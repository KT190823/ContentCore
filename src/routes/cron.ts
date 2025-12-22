import { Elysia, t } from 'elysia';
import { prisma } from '../utils/prisma';
import { google } from 'googleapis';
import { PassThrough } from 'stream';
import pLimit from 'p-limit';

/**
 * Scheduled Posts Auto-Publisher
 * 
 * This endpoint checks for posts that are scheduled to be published
 * and automatically publishes them to YouTube when the scheduled time arrives.
 * 
 * Runs automatically every 10 seconds via internal scheduler
 */

// Limit to 5 concurrent uploads
const limit = pLimit(5);

/**
 * Monthly Usage Reset
 * 
 * Resets creditUsed and capacityUsed to 0 every month (30 days)
 * calculated based on the lastResetDate/subscription date.
 */
async function resetMonthlyUsage() {
  try {
    const now = new Date();
    // Find users who haven't been reset in at least 30 days
    const users = await prisma.user.findMany({
      where: {
        pricingPlanId: { not: null },
        OR: [
          { lastResetDate: null },
          { lastResetDate: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
        ]
      }
    });

    if (users.length === 0) return;

    console.log(`[CRON] Resetting usage for ${users.length} users...`);

    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          creditUsed: 0,
          capacityUsed: 0,
          lastResetDate: now
        }
      });
    }
  } catch (error) {
    console.error('[CRON] Error resetting usage:', error);
  }
}

// Shared function for publishing scheduled posts
async function publishScheduledPosts(authHeader?: string) {
  try {
    // Also run usage reset check
    await resetMonthlyUsage();

    // Verify cron secret to prevent unauthorized access
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';
    
    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return {
        error: 'Unauthorized',
        status: 401
      };
    }

    const now = new Date();
    console.log(`[CRON] Checking for scheduled posts at ${now.toISOString()}`);

    // 1. Find all posts that are scheduled and past their scheduled time
    const scheduledPosts = await prisma.post.findMany({
      where: {
        processStatus: 'scheduled',
        scheduledAt: {
          lte: now // Less than or equal to current time
        }
      },
      include: {
        user: {
          include: {
            channels: {
              where: { platform: 'youtube' },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (scheduledPosts.length === 0) {
      return { success: true, count: 0 };
    }

    console.log(`[CRON] Found ${scheduledPosts.length} posts to publish. Setting them to 'processing'...`);

    // 2. Immediately update status to 'processing' to prevent other workers from picking them up
    // We use a transaction or bulk update if possible, but for individual processing we'll do it here
    const postIdsToProcess = scheduledPosts.map(p => p.id);
    await prisma.post.updateMany({
      where: {
        id: { in: postIdsToProcess }
      },
      data: {
        processStatus: 'processing'
      }
    });

    const results = {
      total: scheduledPosts.length,
      published: [] as string[],
      failed: [] as { postId: string; error: string }[],
      skipped: [] as { postId: string; reason: string }[]
    };

    // 3. Process each scheduled post using p-limit for concurrency control
    const uploadTasks = scheduledPosts.map((post) => 
      limit(async () => {
        try {
          console.log(`[CRON] Processing post: ${post.id} - ${post.title}`);

          // Check if post has a video
          if (!post.videoUrl) {
            console.log(`[CRON] Skipping post ${post.id}: No video URL`);
            await prisma.post.update({
              where: { id: post.id },
              data: { processStatus: 'draft' } // Move to draft if no video
            });
            results.skipped.push({ postId: post.id, reason: 'No video URL' });
            return;
          }

          // Check if already a YouTube URL
          if (post.videoUrl.includes('youtube.com') || post.videoUrl.includes('youtu.be')) {
            console.log(`[CRON] Skipping post ${post.id}: Already a YouTube URL`);
            await prisma.post.update({
              where: { id: post.id },
              data: { processStatus: 'published', publishedAt: now }
            });
            results.published.push(post.id);
            return;
          }

          // Check if user has YouTube channel connected
          const channel = post.user.channels?.[0];
          if (!channel) {
            console.log(`[CRON] Skipping post ${post.id}: No YouTube channel connected`);
            await prisma.post.update({
              where: { id: post.id },
              data: { processStatus: 'scheduled' } // Keep as scheduled to retry later
            });
            results.skipped.push({ postId: post.id, reason: 'No YouTube channel connected' });
            return;
          }

          // Check if access token is expired and refresh if needed
          let accessToken = channel.accessToken;
          if (channel.expiresAt && new Date(channel.expiresAt) < now) {
            console.log(`[CRON] Refreshing token for post ${post.id}`);
            
            if (!channel.refreshToken) {
              console.log(`[CRON] Skipping post ${post.id}: Token expired, no refresh token`);
              await prisma.post.update({
                where: { id: post.id },
                data: { processStatus: 'scheduled' }
              });
              results.skipped.push({ postId: post.id, reason: 'YouTube token expired, no refresh token' });
              return;
            }

            const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                refresh_token: channel.refreshToken,
                grant_type: 'refresh_token',
              }),
            });

            if (!refreshResponse.ok) {
              console.log(`[CRON] Skipping post ${post.id}: Failed to refresh token`);
              await prisma.post.update({
                where: { id: post.id },
                data: { processStatus: 'scheduled' }
              });
              results.skipped.push({ postId: post.id, reason: 'Failed to refresh YouTube token' });
              return;
            }

            const newTokens = await refreshResponse.json();
            const newExpiresAt = new Date(Date.now() + (newTokens.expires_in || 3600) * 1000);
            
            await prisma.channel.update({
              where: { id: channel.id },
              data: {
                accessToken: newTokens.access_token,
                expiresAt: newExpiresAt,
              },
            });
            
            accessToken = newTokens.access_token;
          }

          // Download video
          console.log(`[CRON] Downloading video from: ${post.videoUrl}`);
          const videoResponse = await fetch(post.videoUrl);
          
          if (!videoResponse.ok) {
            throw new Error('Failed to download video from URL');
          }

          const videoBuffer = await videoResponse.arrayBuffer();
          const videoBlob = Buffer.from(videoBuffer);
          const contentType = videoResponse.headers.get('content-type') || 'video/mp4';

          // Initialize YouTube API
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
          );

          oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: channel.refreshToken || undefined,
          });

          const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client,
          });

          // Prepare video metadata
          const videoMetadata: any = {
            snippet: {
              title: post.title,
              description: post.description || '',
              tags: post.tags || [],
              categoryId: '22', // People & Blogs
            },
            status: {
              privacyStatus: 'public',
              selfDeclaredMadeForKids: false,
            },
          };

          // If it's a Short, add the #Shorts tag
          console.log(`[CRON] Post videoType for ${post.id}: ${post.videoType}`);
          if (post.videoType === 'shorts') {
            if (!videoMetadata.snippet.tags.includes('Shorts')) {
              videoMetadata.snippet.tags = [...videoMetadata.snippet.tags, 'Shorts'];
            }
            if (!videoMetadata.snippet.description.includes('#Shorts')) {
              videoMetadata.snippet.description = `${videoMetadata.snippet.description}\n\n#Shorts`;
            }
          }

          console.log(`[CRON] Uploading video to YouTube (${videoBlob.length} bytes)`);
          
          const videoStream = new PassThrough();
          videoStream.end(videoBlob);
          
          const uploadResponse = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: videoMetadata,
            media: {
              mimeType: contentType,
              body: videoStream,
            },
          });

          const uploadedVideo = uploadResponse.data;

          if (!uploadedVideo.id) {
            throw new Error('Failed to upload video to YouTube');
          }

          console.log(`[CRON] Video uploaded successfully: ${uploadedVideo.id}`);

          // Update post status to published
          await prisma.post.update({
            where: { id: post.id },
            data: {
              processStatus: 'published',
              publishedAt: now,
              videoUrl: `https://www.youtube.com/watch?v=${uploadedVideo.id}`,
            },
          });
          
          results.published.push(post.id);
          console.log(`[CRON] Successfully published post ${post.id}: https://www.youtube.com/watch?v=${uploadedVideo.id}`);
          
        } catch (uploadError: any) {
          console.error(`[CRON] Error for post ${post.id}:`, uploadError);
          // Set back to scheduled or failed? For now, move back to scheduled so it can be retried eventually
          // but we should be careful about infinite retry loops
          await prisma.post.update({
            where: { id: post.id },
            data: { processStatus: 'scheduled' }
          });
          results.failed.push({
            postId: post.id,
            error: uploadError.message || 'Failed to upload video to YouTube'
          });
        }
      })
    );

    // 4. Wait for all tasks in this batch to complete (honoring p-limit)
    await Promise.all(uploadTasks);

    console.log(`[CRON] Completed. Published: ${results.published.length}, Failed: ${results.failed.length}, Skipped: ${results.skipped.length}`);

    return {
      success: true,
      timestamp: now.toISOString(),
      results
    };

  } catch (error: any) {
    console.error('[CRON] Error in scheduled publisher:', error);
    return {
      error: error.message || 'Failed to process scheduled posts',
      timestamp: new Date().toISOString(),
      status: 500
    };
  }
}


// Start automatic scheduler (runs every 10 seconds)
let schedulerInterval: Timer | null = null;

export function startScheduler() {
  if (schedulerInterval) {
    console.log('[CRON] Scheduler already running');
    return;
  }

  console.log('[CRON] Starting automatic scheduler (every 10 seconds)');
  
  schedulerInterval = setInterval(async () => {
    try {
      await publishScheduledPosts();
    } catch (error) {
      console.error('[CRON] Scheduler error:', error);
    }
  }, 10000); // 10 seconds
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[CRON] Scheduler stopped');
  }
}

// Routes
export const cronRoutes = new Elysia({ prefix: '/cron' })
  // GET endpoint for manual trigger or external cron
  .get('/publish-scheduled', async ({ headers }) => {
    return await publishScheduledPosts(headers.authorization);
  })
  
  // POST endpoint for manual trigger
  .post('/publish-scheduled', async ({ headers }) => {
    return await publishScheduledPosts(headers.authorization);
  })
  
  // Start scheduler endpoint
  .post('/start-scheduler', ({ headers }) => {
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';
    
    if (headers.authorization !== `Bearer ${cronSecret}`) {
      return {
        error: 'Unauthorized',
        status: 401
      };
    }
    
    startScheduler();
    return {
      success: true,
      message: 'Scheduler started (runs every 10 seconds)'
    };
  })
  
  // Stop scheduler endpoint
  .post('/stop-scheduler', ({ headers }) => {
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';
    
    if (headers.authorization !== `Bearer ${cronSecret}`) {
      return {
        error: 'Unauthorized',
        status: 401
      };
    }
    
    stopScheduler();
    return {
      success: true,
      message: 'Scheduler stopped'
    };
  });
