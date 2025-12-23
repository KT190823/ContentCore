import { prisma } from '../utils/prisma';
import { google } from 'googleapis';
import { PassThrough } from 'stream';
import pLimit from 'p-limit';

const limit = pLimit(5);

export class CronJob {
    private static schedulerInterval: Timer | null = null;

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

    static async publishScheduledPosts(authHeader?: string) {
        try {
            await this.resetMonthlyUsage();

            const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';

            if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
                return {
                    error: 'Unauthorized',
                    status: 401
                };
            }

            const now = new Date();
            console.log(`[JOB] Checking for scheduled posts at ${now.toISOString()}`);

            const scheduledPosts = await prisma.post.findMany({
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
                return { success: true, count: 0 };
            }

            console.log(`[JOB] Found ${scheduledPosts.length} posts to publish. Setting them to 'processing'...`);

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

            const uploadTasks = scheduledPosts.map((post) =>
                limit(async () => {
                    try {
                        if (!post.videoUrl) {
                            await prisma.post.update({
                                where: { id: post.id },
                                data: { processStatus: 'draft' }
                            });
                            results.skipped.push({ postId: post.id, reason: 'No video URL' });
                            return;
                        }

                        if (post.videoUrl.includes('youtube.com') || post.videoUrl.includes('youtu.be')) {
                            await prisma.post.update({
                                where: { id: post.id },
                                data: { processStatus: 'published', publishedAt: now }
                            });
                            results.published.push(post.id);
                            return;
                        }

                        const channel = post.user.channels?.[0];
                        if (!channel) {
                            await prisma.post.update({
                                where: { id: post.id },
                                data: { processStatus: 'scheduled' }
                            });
                            results.skipped.push({ postId: post.id, reason: 'No YouTube channel connected' });
                            return;
                        }

                        let accessToken = channel.accessToken;
                        if (channel.expiresAt && new Date(channel.expiresAt) < now) {
                            if (!channel.refreshToken) {
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

                        await prisma.post.update({
                            where: { id: post.id },
                            data: {
                                processStatus: 'published',
                                publishedAt: now,
                                videoUrl: `https://www.youtube.com/watch?v=${uploadResponse.data.id}`,
                            },
                        });

                        results.published.push(post.id);
                    } catch (uploadError: any) {
                        console.error(`[JOB] Error for post ${post.id}:`, uploadError);
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

            await Promise.all(uploadTasks);
            return { success: true, timestamp: now.toISOString(), results };

        } catch (error: any) {
            console.error('[JOB] Error in scheduled publisher:', error);
            return {
                error: error.message || 'Failed to process scheduled posts',
                timestamp: new Date().toISOString(),
                status: 500
            };
        }
    }

    static startScheduler() {
        if (this.schedulerInterval) return;

        this.schedulerInterval = setInterval(async () => {
            try {
                await this.publishScheduledPosts();
            } catch (error) {
                console.error('[JOB] Scheduler error:', error);
            }
        }, 10000);
    }

    static stopScheduler() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
    }
}
