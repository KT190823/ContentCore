import { Elysia, t } from 'elysia';
import { TrendingService } from '../services';

export const trendingRoutes = new Elysia({ prefix: '/trending' })
    // GET trending videos
    .get('/', async ({ query }) => {
        try {
            const { category, platform } = query;
            const data = await TrendingService.getTrending(category, platform);
            return data;
        } catch (error) {
            console.error('Error fetching trending data:', error);
            return {
                error: 'Failed to fetch trending data',
                status: 500
            };
        }
    }, {
        query: t.Object({
            category: t.Optional(t.String()),
            platform: t.Optional(t.String())
        })
    })

    // UPDATE trending data (Internal/Crawler use)
    .post('/', async ({ body }) => {
        try {
            const { data } = body;
            const result = await TrendingService.updateTrending(data);
            return result;
        } catch (error) {
            console.error('Error updating trending data:', error);
            return {
                error: 'Failed to update trending data',
                status: 500
            };
        }
    }, {
        body: t.Object({
            data: t.Array(t.Object({
                videoId: t.String(),
                title: t.String(),
                channelName: t.Optional(t.String()),
                channelId: t.Optional(t.String()),
                thumbnailUrl: t.Optional(t.String()),
                views: t.Optional(t.Union([t.String(), t.Number()])),
                publishedAt: t.Optional(t.String()),
                category: t.Optional(t.String()),
                tags: t.Optional(t.Array(t.String()))
            }))
        })
    });
