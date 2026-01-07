import { Elysia, t } from 'elysia';
import { ChannelService } from '../services';
import { UserHelper } from '../utils/user-helper';

export const channelsRoutes = new Elysia({ prefix: '/channels' })
    // GET all channels
    .get('/', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const { platform } = context.query;

            const instance = new ChannelService();
            const channels = await instance.getAll({ userId: user.id, ...(platform && { platform }) });
            return channels;
        } catch (error) {
            console.error('Error fetching channels:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to fetch channels',
                status: 500
            };
        }
    }, {
        query: t.Object({
            platform: t.Optional(t.String())
        })
    })

    // UPSERT a channel
    .post('/upsert', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const { platform, channelId, channelName, channelImage, accessToken, refreshToken, expiresAt } = context.body;

            if (!platform || !channelId) {
                return {
                    error: 'Platform and channelId are required',
                    status: 400
                };
            }

            const data = {
                userId: user.id,
                platform,
                channelId,
                ...(channelName && { channelName }),
                ...(channelImage && { channelImage }),
                ...(accessToken && { accessToken }),
                ...(refreshToken && { refreshToken }),
                ...(expiresAt && { expiresAt: new Date(expiresAt) })
            };

            const result = await ChannelService.upsert(data);
            return result;
        } catch (error) {
            console.error('Error upserting channel:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to upsert channel',
                status: 500
            };
        }
    }, {
        body: t.Object({
            platform: t.String(),
            channelId: t.String(),
            channelName: t.Optional(t.String()),
            channelImage: t.Optional(t.String()),
            accessToken: t.Optional(t.String()),
            refreshToken: t.Optional(t.String()),
            expiresAt: t.Optional(t.String())
        })
    })

    // DELETE a channel
    .delete('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            await ChannelService.delete(context.params.id, user.id);
            return { success: true };
        } catch (error) {
            console.error('Error deleting channel:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            if ((error as Error).message.includes('Unauthorized') || (error as Error).message.includes('not found')) {
                return {
                    error: (error as Error).message,
                    status: 403
                };
            }

            return {
                error: 'Failed to delete channel',
                status: 500
            };
        }
    });
