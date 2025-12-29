import { prisma } from '../utils/prisma';

export class DashboardService {
    static async getSummary(userId?: string, email?: string) {
        let targetUserId = userId;

        if (!targetUserId && email) {
            const user = await prisma.user.findUnique({
                where: { email }
            });
            if (user) {
                targetUserId = user.id;
            }
        }

        if (!targetUserId) {
            return {
                totalPosts: 0,
                scheduledPosts: 0,
                publishedPosts: 0,
                trendingVideos: 0,
                recentPosts: []
            };
        }

        // Count YouTube posts
        const [youtubeTotal, youtubeScheduled, youtubePublished] = await Promise.all([
            prisma.postYoutube.count({ where: { userId: targetUserId } }),
            prisma.postYoutube.count({ where: { userId: targetUserId, processStatus: 'scheduled' } }),
            prisma.postYoutube.count({ where: { userId: targetUserId, processStatus: 'published' } })
        ]);

        // Count Facebook posts
        const [facebookTotal, facebookScheduled, facebookPublished] = await Promise.all([
            prisma.facebookPost.count({ where: { userId: targetUserId } }),
            prisma.facebookPost.count({ where: { userId: targetUserId, processStatus: 'scheduled' } }),
            prisma.facebookPost.count({ where: { userId: targetUserId, processStatus: 'published' } })
        ]);

        // Get trending videos count
        const trendingVideos = await prisma.trendingVideo.count();

        // Get recent posts from both platforms
        const [recentYoutubePosts, recentPostFacebooks] = await Promise.all([
            prisma.postYoutube.findMany({
                where: { userId: targetUserId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    processStatus: true,
                    views: true,
                    likes: true,
                    createdAt: true
                }
            }),
            prisma.facebookPost.findMany({
                where: { userId: targetUserId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    processStatus: true,
                    views: true,
                    likes: true,
                    createdAt: true
                }
            })
        ]);

        // Combine and sort recent posts
        const recentPosts = [...recentYoutubePosts.map(p => ({ ...p, platform: 'youtube' })),
        ...recentPostFacebooks.map(p => ({ ...p, platform: 'facebook' }))]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5);

        return {
            totalPosts: youtubeTotal + facebookTotal,
            scheduledPosts: youtubeScheduled + facebookScheduled,
            publishedPosts: youtubePublished + facebookPublished,
            trendingVideos,
            recentPosts,
            // Additional breakdown by platform
            youtube: {
                total: youtubeTotal,
                scheduled: youtubeScheduled,
                published: youtubePublished
            },
            facebook: {
                total: facebookTotal,
                scheduled: facebookScheduled,
                published: facebookPublished
            }
        };
    }
}
