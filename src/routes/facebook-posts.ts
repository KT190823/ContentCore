import { Elysia, t } from 'elysia';
import { FacebookPostService } from '../services';
import { UserHelper } from '../utils/user-helper';

export const facebookPostsRoutes = new Elysia({ prefix: '/facebook-posts' })
    // GET all facebook posts
    .get('/', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const { status } = context.query;

            const posts = await FacebookPostService.getAll(user.id, status);
            return { posts };
        } catch (error) {
            console.error('Error fetching facebook posts:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to fetch facebook posts',
                status: 500
            };
        }
    }, {
        query: t.Object({
            status: t.Optional(t.String())
        })
    })

    // CREATE a new facebook post
    .post('/', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const { title, content, imageUrl, videoUrl, status, scheduledAt } = context.body;

            if (!title) {
                return {
                    error: 'Title is required',
                    status: 400
                };
            }

            const post = await FacebookPostService.create({
                userId: user.id,
                title,
                content,
                imageUrl,
                videoUrl,
                status,
                scheduledAt
            });

            return { post, status: 201 };
        } catch (error) {
            console.error('Error creating facebook post:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to create facebook post',
                status: 500
            };
        }
    }, {
        body: t.Object({
            title: t.String(),
            content: t.Optional(t.String()),
            imageUrl: t.Optional(t.String()),
            videoUrl: t.Optional(t.String()),
            status: t.Optional(t.Enum({
                draft: 'draft',
                scheduled: 'scheduled',
                processing: 'processing',
                published: 'published'
            })),
            scheduledAt: t.Optional(t.String()),
        })
    })

    // GET a single facebook post by ID
    .get('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const post = await FacebookPostService.get(context.params.id);

            if (!post) {
                return {
                    error: 'Facebook post not found',
                    status: 404
                };
            }

            // Verify ownership
            if (post.userId !== user.id) {
                return {
                    error: 'Unauthorized to access this post',
                    status: 403
                };
            }

            return { post };
        } catch (error) {
            console.error('Error fetching facebook post:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to fetch facebook post',
                status: 500
            };
        }
    })

    // UPDATE a facebook post
    .patch('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);

            // Check ownership first
            const existingPost = await FacebookPostService.get(context.params.id);
            if (!existingPost) {
                return {
                    error: 'Facebook post not found',
                    status: 404
                };
            }

            if (existingPost.userId !== user.id) {
                return {
                    error: 'Unauthorized to update this post',
                    status: 403
                };
            }

            const post = await FacebookPostService.update(context.params.id, context.body as any);
            return { post };
        } catch (error) {
            console.error('Error updating facebook post:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            if ((error as any).code === 'P2025') {
                return {
                    error: 'Facebook post not found',
                    status: 404
                };
            }

            return {
                error: 'Failed to update facebook post',
                status: 500
            };
        }
    }, {
        body: t.Object({
            title: t.Optional(t.String()),
            content: t.Optional(t.String()),
            imageUrl: t.Optional(t.String()),
            videoUrl: t.Optional(t.String()),
            status: t.Optional(t.Enum({
                draft: 'draft',
                scheduled: 'scheduled',
                processing: 'processing',
                published: 'published'
            })),
            scheduledAt: t.Optional(t.String()),
            facebookPostId: t.Optional(t.String())
        })
    })

    // DELETE a facebook post
    .delete('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);

            // Check ownership first
            const existingPost = await FacebookPostService.get(context.params.id);
            if (!existingPost) {
                return {
                    error: 'Facebook post not found',
                    status: 404
                };
            }

            if (existingPost.userId !== user.id) {
                return {
                    error: 'Unauthorized to delete this post',
                    status: 403
                };
            }

            const instance = new FacebookPostService();
            await instance.delete(context.params.id);
            return { success: true };
        } catch (error) {
            console.error('Error deleting facebook post:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            if ((error as any).code === 'P2025') {
                return {
                    error: 'Facebook post not found',
                    status: 404
                };
            }

            return {
                error: 'Failed to delete facebook post',
                status: 500
            };
        }
    });
