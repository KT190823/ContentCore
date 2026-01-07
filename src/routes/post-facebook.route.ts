import { Elysia, t } from 'elysia';
import { PostFacebookService } from '../services';
import { UserHelper } from '../utils/user-helper';

export const facebookPostsRoutes = new Elysia({ prefix: '/facebook-posts' })
    // GET all facebook posts
    .get('/', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const { status } = context.query;

            const posts = await PostFacebookService.getAll(user.id, status);
            return posts;
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
            const { title, description, thumbnailUrl, uploadedUrls, videoType, status, scheduledAt, tags, channelId } = context.body;

            if (!title) {
                return {
                    error: 'Title is required',
                    status: 400
                };
            }

            const post = await PostFacebookService.create({
                userId: user.id,
                channelId,
                title,
                description,
                thumbnailUrl,
                uploadedUrls,
                videoType,
                status,
                scheduledAt,
                tags
            });

            return post;
        } catch (error) {
            console.error('Error creating post facebook:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to create post facebook',
                status: 500
            };
        }
    }, {
        body: t.Object({
            title: t.String(),
            channelId: t.Optional(t.String()),
            description: t.Optional(t.String()),
            thumbnailUrl: t.Optional(t.String()),
            uploadedUrls: t.Optional(t.Array(t.String())),
            videoType: t.Optional(t.Enum({
                video: 'video',
                shorts: 'shorts'
            })),
            status: t.Optional(t.Enum({
                draft: 'draft',
                scheduled: 'scheduled',
                processing: 'processing',
                published: 'published'
            })),
            scheduledAt: t.Optional(t.String()),
            tags: t.Optional(t.Array(t.String()))
        })
    })


    // GET a single facebook post by ID
    .get('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const post = await PostFacebookService.get(context.params.id);

            if (!post) {
                return {
                    error: 'Post facebook not found',
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

            return post;
        } catch (error) {
            console.error('Error fetching post facebook:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to fetch post facebook',
                status: 500
            };
        }
    })

    // UPDATE a facebook post
    .patch('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);

            // Check ownership first
            const existingPost = await PostFacebookService.get(context.params.id);
            if (!existingPost) {
                return {
                    error: 'Post facebook not found',
                    status: 404
                };
            }

            if (existingPost.userId !== user.id) {
                return {
                    error: 'Unauthorized to update this post',
                    status: 403
                };
            }

            const post = await PostFacebookService.update(context.params.id, context.body as any);
            return post;
        } catch (error) {
            console.error('Error updating post facebook:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            if ((error as any).code === 'P2025') {
                return {
                    error: 'Post facebook not found',
                    status: 404
                };
            }

            return {
                error: 'Failed to update post facebook',
                status: 500
            };
        }
    }, {
        body: t.Object({
            title: t.Optional(t.String()),
            channelId: t.Optional(t.String()),
            description: t.Optional(t.String()),
            thumbnailUrl: t.Optional(t.String()),
            uploadedUrls: t.Optional(t.Array(t.String())),
            videoType: t.Optional(t.Enum({
                video: 'video',
                shorts: 'shorts'
            })),
            status: t.Optional(t.Enum({
                draft: 'draft',
                scheduled: 'scheduled',
                processing: 'processing',
                published: 'published'
            })),
            scheduledAt: t.Optional(t.String()),
            tags: t.Optional(t.Array(t.String())),
            facebookPostId: t.Optional(t.String())
        })
    })

    // DELETE a facebook post
    .delete('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);

            // Check ownership first
            const existingPost = await PostFacebookService.get(context.params.id);
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

            const instance = new PostFacebookService();
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
