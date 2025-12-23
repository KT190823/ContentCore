import { prisma } from '../utils/prisma';
import { Status } from '../../generated/prisma/client';

export class TrendingService {
    static async getTrending(category?: string, platform?: string) {
        // Note: The TrendingVideo model doesn't explicitly store 'platform' in the current schema
        // strictly speaking, but it has 'category'. We'll filter by category if provided.
        // If the user meant platform, we might need a schema change or just ignore it for now 
        // as per the schema I saw: model TrendingVideo { ... category ... }

        const where: any = { status: 'ACTIVE' };
        if (category) {
            where.category = { contains: category, mode: 'insensitive' };
        }

        return await prisma.trendingVideo.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to avoid massive payloads
        });
    }

    static async updateTrending(data: any[]) {
        // This is typically a batch operation from a crawler.
        // We might want to upsert them based on videoId.

        const results = [];
        for (const item of data) {
            // Basic validation
            if (!item.videoId || !item.title) continue;

            const video = await prisma.trendingVideo.upsert({
                where: { videoId: item.videoId },
                create: {
                    videoId: item.videoId,
                    title: item.title,
                    channelName: item.channelName || 'Unknown',
                    channelId: item.channelId,
                    thumbnailUrl: item.thumbnailUrl || '',
                    views: String(item.views || '0'),
                    publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
                    category: item.category,
                    tags: item.tags || [],
                    status: 'ACTIVE'
                },
                update: {
                    title: item.title,
                    views: String(item.views || '0'),
                    updatedAt: new Date()
                }
            });
            results.push(video);
        }
        return results;
    }
}
