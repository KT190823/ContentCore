import { prisma } from '../utils/prisma';
import { google } from 'googleapis';
import { PassThrough } from 'stream';
import pLimit from 'p-limit';

const limit = pLimit(5);

export class CronJob {
    private static youtubeSchedulerInterval: Timer | null = null;
    private static facebookSchedulerInterval: Timer | null = null;

    static async resetMonthlyUsage() {
        try {
            const now = new Date();
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

            console.log(`[JOB] Resetting usage for ${users.length} users...`);

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
            console.error('[JOB] Error resetting usage:', error);
        }
    }

    static async publishScheduledYoutubePosts() {
        try {
            await this.resetMonthlyUsage();

            const now = new Date();
            console.log(`[JOB] Checking for scheduled YouTube posts at ${now.toISOString()}`);

            const scheduledPosts = await prisma.postYoutube.findMany({
                where: {
                    processStatus: 'scheduled',
                    scheduledAt: {
                        lte: now
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
                return { success: true, count: 0, platform: 'youtube' };
            }

            console.log(`[JOB] Found ${scheduledPosts.length} YouTube posts to publish. Setting them to 'processing'...`);

            const postIdsToProcess = scheduledPosts.map(p => p.id);
            await prisma.postYoutube.updateMany({
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

            const uploadTasks = scheduledPosts.map((post) =>
                limit(async () => {
                    try {
                        if (!post.videoUrl) {
                            await prisma.postYoutube.update({
                                where: { id: post.id },
                                data: { processStatus: 'draft' }
                            });
                            results.skipped.push({ postId: post.id, reason: 'No video URL' });
                            return;
                        }

                        if (post.videoUrl.includes('youtube.com') || post.videoUrl.includes('youtu.be')) {
                            await prisma.postYoutube.update({
                                where: { id: post.id },
                                data: { processStatus: 'published', publishedAt: now }
                            });
                            results.published.push(post.id);
                            return;
                        }

                        const channelId = post.user.channels?.[0]?.id;
                        if (!channelId) {
                            await prisma.postYoutube.update({
                                where: { id: post.id },
                                data: { processStatus: 'scheduled' }
                            });
                            results.skipped.push({ postId: post.id, reason: 'No YouTube channel connected' });
                            return;
                        }

                        const channel = await prisma.channel.findUnique({ where: { id: channelId } });
                        if (!channel) {
                            await prisma.postYoutube.update({
                                where: { id: post.id },
                                data: { processStatus: 'scheduled' }
                            });
                            results.skipped.push({ postId: post.id, reason: 'YouTube channel not found' });
                            return;
                        }

                        let accessToken = channel.accessToken;
                        if (channel.expiresAt && new Date(channel.expiresAt) < now) {
                            if (!channel.refreshToken) {
                                await prisma.postYoutube.update({
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
                                await prisma.postYoutube.update({
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

                        const videoResponse = await fetch(post.videoUrl);
                        if (!videoResponse.ok) throw new Error('Failed to download video from URL');

                        const videoBuffer = await videoResponse.arrayBuffer();
                        const videoBlob = Buffer.from(videoBuffer);
                        const contentType = videoResponse.headers.get('content-type') || 'video/mp4';

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

                        const videoMetadata: any = {
                            snippet: {
                                title: post.title,
                                description: post.description || '',
                                tags: post.tags || [],
                                categoryId: '22',
                            },
                            status: {
                                privacyStatus: 'public',
                                selfDeclaredMadeForKids: false,
                            },
                        };

                        if (post.videoType === 'shorts') {
                            if (!videoMetadata.snippet.tags.includes('Shorts')) {
                                videoMetadata.snippet.tags = [...videoMetadata.snippet.tags, 'Shorts'];
                            }
                            if (!videoMetadata.snippet.description.includes('#Shorts')) {
                                videoMetadata.snippet.description = `${videoMetadata.snippet.description}\n\n#Shorts`;
                            }
                        }

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

                        if (!uploadResponse.data.id) throw new Error('Failed to upload video to YouTube');

                        await prisma.postYoutube.update({
                            where: { id: post.id },
                            data: {
                                processStatus: 'published',
                                publishedAt: now,
                                videoUrl: `https://www.youtube.com/watch?v=${uploadResponse.data.id}`,
                            },
                        });

                        results.published.push(post.id);
                    } catch (uploadError: any) {
                        console.error(`[JOB] Error for YouTube post ${post.id}:`, uploadError);
                        await prisma.postYoutube.update({
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

            await Promise.all(uploadTasks);
            return { success: true, timestamp: now.toISOString(), platform: 'youtube', results };

        } catch (error: any) {
            console.error('[JOB] Error in YouTube scheduled publisher:', error);
            return {
                error: error.message || 'Failed to process scheduled YouTube posts',
                timestamp: new Date().toISOString(),
                platform: 'youtube',
                status: 500
            };
        }
    }

    static async publishScheduledFacebookPosts() {
        try {
            await this.resetMonthlyUsage();

            const now = new Date();
            console.log(`[JOB] Checking for scheduled Facebook posts at ${now.toISOString()}`);

            const scheduledPosts = await prisma.facebookPost.findMany({
                where: {
                    processStatus: 'scheduled',
                    scheduledAt: {
                        lte: now
                    }
                },
                include: {
                    user: {
                        include: {
                            channels: {
                                where: { platform: 'facebook' },
                                orderBy: { createdAt: 'desc' },
                                take: 1
                            }
                        }
                    }
                }
            });

            if (scheduledPosts.length === 0) {
                return { success: true, count: 0, platform: 'facebook' };
            }

            console.log(`[JOB] Found ${scheduledPosts.length} Facebook posts to publish. Setting them to 'processing'...`);

            const postIdsToProcess = scheduledPosts.map(p => p.id);
            await prisma.facebookPost.updateMany({
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

            const uploadTasks = scheduledPosts.map((post) =>
                limit(async () => {
                    try {
                        const channel = post.user.channels?.[0];
                        if (!channel) {
                            await prisma.facebookPost.update({
                                where: { id: post.id },
                                data: { processStatus: 'scheduled' }
                            });
                            results.skipped.push({ postId: post.id, reason: 'No Facebook channel connected' });
                            return;
                        }

                        let accessToken = channel.accessToken;
                        if (!accessToken) {
                            await prisma.facebookPost.update({
                                where: { id: post.id },
                                data: { processStatus: 'scheduled' }
                            });
                            results.skipped.push({ postId: post.id, reason: 'No Facebook access token' });
                            return;
                        }

                        // Check if token is expired
                        if (channel.expiresAt && new Date(channel.expiresAt) < now) {
                            await prisma.facebookPost.update({
                                where: { id: post.id },
                                data: { processStatus: 'scheduled' }
                            });
                            results.skipped.push({ postId: post.id, reason: 'Facebook token expired' });
                            return;
                        }

                        // Prepare Facebook post data
                        const postData: any = {
                            message: post.description || post.title,
                            access_token: accessToken
                        };

                        // Add media if available
                        if (post.videoUrl) {
                            postData.url = post.videoUrl;
                        } else if (post.imageUrl) {
                            postData.url = post.imageUrl;
                        }

                        // Publish to Facebook Page
                        const pageId = channel.channelId;
                        const endpoint = post.videoUrl
                            ? `https://graph.facebook.com/v18.0/${pageId}/videos`
                            : `https://graph.facebook.com/v18.0/${pageId}/photos`;

                        const publishResponse = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(postData)
                        });

                        if (!publishResponse.ok) {
                            const errorData = await publishResponse.json();
                            throw new Error(errorData.error?.message || 'Failed to publish to Facebook');
                        }

                        const publishData = await publishResponse.json();

                        await prisma.facebookPost.update({
                            where: { id: post.id },
                            data: {
                                processStatus: 'published',
                                publishedAt: now,
                                facebookPostId: publishData.id || publishData.post_id
                            },
                        });

                        results.published.push(post.id);
                    } catch (uploadError: any) {
                        console.error(`[JOB] Error for Facebook post ${post.id}:`, uploadError);
                        await prisma.facebookPost.update({
                            where: { id: post.id },
                            data: { processStatus: 'scheduled' }
                        });
                        results.failed.push({
                            postId: post.id,
                            error: uploadError.message || 'Failed to publish to Facebook'
                        });
                    }
                })
            );

            await Promise.all(uploadTasks);
            return { success: true, timestamp: now.toISOString(), platform: 'facebook', results };

        } catch (error: any) {
            console.error('[JOB] Error in Facebook scheduled publisher:', error);
            return {
                error: error.message || 'Failed to process scheduled Facebook posts',
                timestamp: new Date().toISOString(),
                platform: 'facebook',
                status: 500
            };
        }
    }

    static startYoutubeScheduler() {
        if (this.youtubeSchedulerInterval) return;

        this.youtubeSchedulerInterval = setInterval(async () => {
            try {
                await this.publishScheduledYoutubePosts();
            } catch (error) {
                console.error('[JOB] YouTube scheduler error:', error);
            }
        }, 10000);
    }

    static stopYoutubeScheduler() {
        if (this.youtubeSchedulerInterval) {
            clearInterval(this.youtubeSchedulerInterval);
            this.youtubeSchedulerInterval = null;
        }
    }

    static startFacebookScheduler() {
        if (this.facebookSchedulerInterval) return;

        this.facebookSchedulerInterval = setInterval(async () => {
            try {
                await this.publishScheduledFacebookPosts();
            } catch (error) {
                console.error('[JOB] Facebook scheduler error:', error);
            }
        }, 10000);
    }

    static stopFacebookScheduler() {
        if (this.facebookSchedulerInterval) {
            clearInterval(this.facebookSchedulerInterval);
            this.facebookSchedulerInterval = null;
        }
    }

    // Start both schedulers
    static startScheduler() {
        this.startYoutubeScheduler();
        this.startFacebookScheduler();
    }

    // Stop both schedulers
    static stopScheduler() {
        this.stopYoutubeScheduler();
        this.stopFacebookScheduler();
    }
}
