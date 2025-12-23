import { Elysia, t } from 'elysia';
import { PostService } from '../services';
import { UserHelper } from '../utils/user-helper';

export const postsRoutes = new Elysia({ prefix: '/posts' })
  // GET all posts
  .get('/', async (context) => {
    try {
      const { user } = await UserHelper.fromContext(context);
      const { status } = context.query;

      const posts = await PostService.getAll(user.id, status);
      return { posts };
    } catch (error) {
      console.error('Error fetching posts:', error);

      if ((error as Error).message.includes('token')) {
        return {
          error: (error as Error).message,
          status: 401
        };
      }

      return {
        error: 'Failed to fetch posts',
        status: 500
      };
    }
  }, {
    query: t.Object({
      status: t.Optional(t.String())
    })
  })

  // CREATE a new post
  .post('/', async (context) => {
    try {
      const { user } = await UserHelper.fromContext(context);
      const { title, description, thumbnailUrl, videoUrl, status, scheduledAt, tags, videoType } = context.body;

      if (!title) {
        return {
          error: 'Title is required',
          status: 400
        };
      }

      const post = await PostService.create({
        userId: user.id,
        title,
        description,
        thumbnailUrl,
        videoUrl,
        status,
        scheduledAt,
        tags,
        videoType
      });

      return { post, status: 201 };
    } catch (error) {
      console.error('Error creating post:', error);

      if ((error as Error).message.includes('token')) {
        return {
          error: (error as Error).message,
          status: 401
        };
      }

      return {
        error: 'Failed to create post',
        status: 500
      };
    }
  }, {
    body: t.Object({
      title: t.String(),
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

  // GET a single post by ID
  .get('/:id', async (context) => {
    try {
      const { user } = await UserHelper.fromContext(context);
      const post = await PostService.get(context.params.id);

      if (!post) {
        return {
          error: 'Post not found',
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
      console.error('Error fetching post:', error);

      if ((error as Error).message.includes('token')) {
        return {
          error: (error as Error).message,
          status: 401
        };
      }

      return {
        error: 'Failed to fetch post',
        status: 500
      };
    }
  })

  // UPDATE a post
  .patch('/:id', async (context) => {
    try {
      const { user } = await UserHelper.fromContext(context);

      // Check ownership first
      const existingPost = await PostService.get(context.params.id);
      if (!existingPost) {
        return {
          error: 'Post not found',
          status: 404
        };
      }

      if (existingPost.userId !== user.id) {
        return {
          error: 'Unauthorized to update this post',
          status: 403
        };
      }

      const post = await PostService.update(context.params.id, context.body);
      return { post };
    } catch (error) {
      console.error('Error updating post:', error);

      if ((error as Error).message.includes('token')) {
        return {
          error: (error as Error).message,
          status: 401
        };
      }

      if ((error as any).code === 'P2025') {
        return {
          error: 'Post not found',
          status: 404
        };
      }

      return {
        error: 'Failed to update post',
        status: 500
      };
    }
  }, {
    body: t.Object({
      title: t.Optional(t.String()),
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

  // DELETE a post
  .delete('/:id', async (context) => {
    try {
      const { user } = await UserHelper.fromContext(context);

      // Check ownership first
      const existingPost = await PostService.get(context.params.id);
      if (!existingPost) {
        return {
          error: 'Post not found',
          status: 404
        };
      }

      if (existingPost.userId !== user.id) {
        return {
          error: 'Unauthorized to delete this post',
          status: 403
        };
      }

      const instance = new PostService();
      await instance.delete(context.params.id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting post:', error);

      if ((error as Error).message.includes('token')) {
        return {
          error: (error as Error).message,
          status: 401
        };
      }

      if ((error as any).code === 'P2025') {
        return {
          error: 'Post not found',
          status: 404
        };
      }

      return {
        error: 'Failed to delete post',
        status: 500
      };
    }
  });
