import { Elysia, t } from 'elysia';
import { KeywordService } from '../services';
import { UserHelper } from '../utils/user-helper';
import { prisma } from '../utils/prisma';

export const keywordsRoutes = new Elysia({ prefix: '/keywords' })
  // GET all keywords
  .get('/', async (context) => {
    try {
      const { user } = await UserHelper.fromContext(context);
      const keywords = await KeywordService.getAll(user.id);
      return keywords;
    } catch (error) {
      console.error('Error fetching keywords:', error);

      if ((error as Error).message.includes('token')) {
        return {
          error: (error as Error).message,
          status: 401
        };
      }

      return {
        error: 'Failed to fetch keywords',
        status: 500
      };
    }
  })

  // CREATE a new keyword
  .post('/', async (context) => {
    try {
      const { user } = await UserHelper.fromContext(context);
      const { keyword, category } = context.body;

      if (!keyword) {
        return {
          error: 'Keyword is required',
          status: 400
        };
      }

      const newKeyword = await KeywordService.create(user.id, keyword, category);
      return newKeyword;
    } catch (error) {
      console.error('Error creating keyword:', error);

      if ((error as Error).message.includes('token')) {
        return {
          error: (error as Error).message,
          status: 401
        };
      }

      return {
        error: 'Failed to create keyword',
        status: 500
      };
    }
  }, {
    body: t.Object({
      keyword: t.String(),
      category: t.Optional(t.String())
    })
  })

  // DELETE a keyword
  .delete('/:id', async (context) => {
    try {
      const { user } = await UserHelper.fromContext(context);

      // Check ownership
      const keyword = await prisma.keyword.findUnique({
        where: { id: context.params.id }
      });

      if (!keyword) {
        return {
          error: 'Keyword not found',
          status: 404
        };
      }

      if (keyword.userId !== user.id) {
        return {
          error: 'Unauthorized to delete this keyword',
          status: 403
        };
      }

      const instance = new KeywordService();
      await instance.delete(context.params.id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting keyword:', error);

      if ((error as Error).message.includes('token')) {
        return {
          error: (error as Error).message,
          status: 401
        };
      }

      if ((error as any).code === 'P2025') {
        return {
          error: 'Keyword not found',
          status: 404
        };
      }

      return {
        error: 'Failed to delete keyword',
        status: 500
      };
    }
  });
