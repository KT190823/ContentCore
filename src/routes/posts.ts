import { Elysia, t } from 'elysia';
import { prisma } from '../utils/prisma';

export const postsRoutes = new Elysia({ prefix: '/posts' })
  // GET all posts
  .get('/', async ({ query }) => {
    try {
      const { userId, status } = query;

      if (!userId) {
        return {
          error: 'User ID is required',
          status: 400
        };
      }

      const where: any = { userId };
      if (status) {
        where.processStatus = status;
      }

      const posts = await prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true
            }
          }
        }
      });

      return { posts };
    } catch (error) {
      console.error('Error fetching posts:', error);
      return {
        error: 'Failed to fetch posts',
        status: 500
      };
    }
  }, {
    query: t.Object({
      userId: t.String(),
      status: t.Optional(t.String())
    })
  })
  
  // CREATE a new post
  .post('/', async ({ body }) => {
    try {
      const {
        userId,
        title,
        description,
        thumbnailUrl,
        videoUrl,
        status,
        scheduledAt,
        tags,
        videoType
      } = body;

      if (!userId || !title) {
        return {
          error: 'User ID and title are required',
          status: 400
        };
      }

      const post = await prisma.post.create({
        data: {
          userId,
          title,
          description,
          thumbnailUrl,
          videoUrl,
          videoType,
          processStatus: status || 'draft',
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          tags: tags || []
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true
            }
          }
        }
      });

      return { post, status: 201 };
    } catch (error) {
      console.error('Error creating post:', error);
      return {
        error: 'Failed to create post',
        status: 500
      };
    }
  }, {
    body: t.Object({
      userId: t.String(),
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
  .get('/:id', async ({ params }) => {
    try {
      const post = await prisma.post.findUnique({
        where: { id: params.id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true
            }
          }
        }
      });

      if (!post) {
        return {
          error: 'Post not found',
          status: 404
        };
      }

      return { post };
    } catch (error) {
      console.error('Error fetching post:', error);
      return {
        error: 'Failed to fetch post',
        status: 500
      };
    }
  })
  
  // UPDATE a post
  .patch('/:id', async ({ params, body }) => {
    try {
      // Check if post exists
      const existingPost = await prisma.post.findUnique({
        where: { id: params.id }
      });

      if (!existingPost) {
        return {
          error: 'Post not found',
          status: 404
        };
      }

      // Prepare update data
      const updateData: any = {};
      
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
      if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;
      if (body.status !== undefined) updateData.processStatus = body.status;
      if (body.videoType !== undefined) updateData.videoType = body.videoType;
      if (body.tags !== undefined) updateData.tags = body.tags;
      if (body.scheduledAt !== undefined) {
        updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
      }

      const post = await prisma.post.update({
        where: { id: params.id },
        data: updateData,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true
            }
          }
        }
      });

      return { post };
    } catch (error) {
      console.error('Error updating post:', error);
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
  .delete('/:id', async ({ params }) => {
    try {
      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: params.id }
      });

      if (!post) {
        return {
          error: 'Post not found',
          status: 404
        };
      }

      // Delete the post from database
      await prisma.post.delete({
        where: { id: params.id }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting post:', error);
      return {
        error: 'Failed to delete post',
        status: 500
      };
    }
  });
