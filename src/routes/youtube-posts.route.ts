import { Elysia, t } from 'elysia';
import { PostYoutubeService } from '../services/post-youtube.service';
import { UserHelper } from '../utils/user-helper';

export const youtubePostsRoutes = new Elysia({ prefix: '/youtube-posts' })
    // GET all YouTube posts
    .get('/', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const { status } = context.query;

            const posts = await PostYoutubeService.getAll(user.id, status);
            return posts;
        } catch (error) {
            console.error('Error fetching YouTube posts:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to fetch YouTube posts',
                status: 500
            };
        }
    }, {
        query: t.Object({
            status: t.Optional(t.String())
        })
    })

    // CREATE a new YouTube post
    .post('/', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const { title, description, thumbnailUrl, videoUrl, status, scheduledAt, tags, videoType, channelId } = context.body;

            if (!title) {
                return {
                    error: 'Title is required',
                    status: 400
                };
            }

            const post = await PostYoutubeService.create({
                userId: user.id,
                channelId,
                title,
                description,
                thumbnailUrl,
                videoUrl,
                status,
                scheduledAt,
                tags,
                videoType
            });

            return post;
        } catch (error) {
            console.error('Error creating YouTube post:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to create YouTube post',
                status: 500
            };
        }
    }, {
        body: t.Object({
            title: t.String(),
            channelId: t.Optional(t.String()),
            description: t.Optional(t.String()),
            thumbnailUrl: t.Optional(t.String()),
            videoUrl: t.Optional(t.String()),
            status: t.Optional(t.Enum({
                draft: 'draft',
                scheduled: 'scheduled',
                processing: 'processing',
                published: 'published'
            })),
            scheduledAt: t.Optional(t.String()),
            tags: t.Optional(t.Array(t.String())),
            videoType: t.Optional(t.Enum({
                video: 'video',
                shorts: 'shorts'
            }))
        })
    })

    // GET a single YouTube post by ID
    .get('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const post = await PostYoutubeService.get(context.params.id);

            if (!post) {
                return {
                    error: 'YouTube post not found',
                    status: 404
                };
            }

            // Verify ownership
            if (post.userId !== user.id) {
                return {
                    error: 'Unauthorized to access this YouTube post',
                    status: 403
                };
            }

            return post;
        } catch (error) {
            console.error('Error fetching YouTube post:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to fetch YouTube post',
                status: 500
            };
        }
    })

    // UPDATE a YouTube post
    .patch('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);

            // Check ownership first
            const existingPost = await PostYoutubeService.get(context.params.id);
            if (!existingPost) {
                return {
                    error: 'YouTube post not found',
                    status: 404
                };
            }

            if (existingPost.userId !== user.id) {
                return {
                    error: 'Unauthorized to update this YouTube post',
                    status: 403
                };
            }

            const post = await PostYoutubeService.update(context.params.id, context.body as any);
            return post;
        } catch (error) {
            console.error('Error updating YouTube post:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            if ((error as any).code === 'P2025') {
                return {
                    error: 'YouTube post not found',
                    status: 404
                };
            }

            return {
                error: 'Failed to update YouTube post',
                status: 500
            };
        }
    }, {
        body: t.Object({
            title: t.Optional(t.String()),
            channelId: t.Optional(t.String()),
            description: t.Optional(t.String()),
            thumbnailUrl: t.Optional(t.String()),
            videoUrl: t.Optional(t.String()),
            status: t.Optional(t.Enum({
                draft: 'draft',
                scheduled: 'scheduled',
                processing: 'processing',
                published: 'published'
            })),
            scheduledAt: t.Optional(t.String()),
            tags: t.Optional(t.Array(t.String())),
            videoType: t.Optional(t.Enum({
                video: 'video',
                shorts: 'shorts'
            }))
        })
    })

    // DELETE a YouTube post
    .delete('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);

            // Check ownership first
            const existingPost = await PostYoutubeService.get(context.params.id);
            if (!existingPost) {
                return {
                    error: 'YouTube post not found',
                    status: 404
                };
            }

            if (existingPost.userId !== user.id) {
                return {
                    error: 'Unauthorized to delete this YouTube post',
                    status: 403
                };
            }

            const instance = new PostYoutubeService();
            await instance.delete(context.params.id);
            return { success: true };
        } catch (error) {
            console.error('Error deleting YouTube post:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            if ((error as any).code === 'P2025') {
                return {
                    error: 'YouTube post not found',
                    status: 404
                };
            }

            return {
                error: 'Failed to delete YouTube post',
                status: 500
            };
        }
    });
