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

        const [totalPosts, scheduledPosts, publishedPosts, trendingVideos] = await Promise.all([
            prisma.post.count({ where: { userId: targetUserId } }),
            prisma.post.count({ where: { userId: targetUserId, processStatus: 'scheduled' } }),
            prisma.post.count({ where: { userId: targetUserId, processStatus: 'published' } }),
            prisma.trendingVideo.count()
        ]);

        const recentPosts = await prisma.post.findMany({
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
        });

        return {
            totalPosts,
            scheduledPosts,
            publishedPosts,
            trendingVideos,
            recentPosts
        };
    }
}
