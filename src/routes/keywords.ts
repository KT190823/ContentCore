import { Elysia, t } from 'elysia';
import { prisma } from '../utils/prisma';

export const keywordsRoutes = new Elysia({ prefix: '/keywords' })
  // GET all keywords
  .get('/', async ({ query }) => {
    try {
      const { userId } = query;

      if (!userId) {
        return {
          error: 'User ID is required',
          status: 400
        };
      }

      const keywords = await prisma.keyword.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      return { keywords };
    } catch (error) {
      console.error('Error fetching keywords:', error);
      return {
        error: 'Failed to fetch keywords',
        status: 500
      };
    }
  }, {
    query: t.Object({
      userId: t.String()
    })
  })
  
  // CREATE a new keyword
  .post('/', async ({ body }) => {
    try {
      const { userId, keyword, category } = body;

      if (!userId || !keyword) {
        return {
          error: 'User ID and keyword are required',
          status: 400
        };
      }

      const newKeyword = await prisma.keyword.create({
        data: {
          userId,
          keyword,
          category: category || 'general'
        }
      });

      return { keyword: newKeyword, status: 201 };
    } catch (error) {
      console.error('Error creating keyword:', error);
      return {
        error: 'Failed to create keyword',
        status: 500
      };
    }
  }, {
    body: t.Object({
      userId: t.String(),
      keyword: t.String(),
      category: t.Optional(t.String())
    })
  })
  
  // DELETE a keyword
  .delete('/:id', async ({ params }) => {
    try {
      await prisma.keyword.delete({
        where: { id: params.id }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting keyword:', error);
      return {
        error: 'Failed to delete keyword',
        status: 500
      };
    }
  });
