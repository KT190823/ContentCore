import { Elysia, t } from 'elysia';
import { AiService } from '../services';

export const aiRoutes = new Elysia({ prefix: '/ai' })
    // GENERATE content
    .post('/generate-content', async ({ body }) => {
        try {
            const { userId, topic, keywords } = body;

            // Assuming we pass userId in body for now, or could extract from token if middleware existed
            if (!userId || !topic) {
                return {
                    error: 'User ID and topic are required',
                    status: 400
                };
            }

            const result = await AiService.generateContent(userId, topic, keywords || []);
            return result;
        } catch (error) {
            console.error('Error generating content:', error);
            return {
                error: (error as Error).message || 'Failed to generate content',
                status: 500
            };
        }
    }, {
        body: t.Object({
            userId: t.String(),
            topic: t.String(),
            keywords: t.Optional(t.Array(t.String()))
        })
    });
