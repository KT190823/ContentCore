import { Elysia, t } from 'elysia';
import { UserService } from '../services';

export const userRoutes = new Elysia({ prefix: '/user' })
  // GET user profile
  .get('/', async ({ query }) => {
    try {
      const { email } = query;

      if (!email) {
        return {
          error: 'Email is required',
          status: 400
        };
      }

      const user = await UserService.getProfileByEmail(email);

      if (!user) {
        return {
          error: 'User not found',
          status: 404
        };
      }

      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return {
        error: 'Failed to fetch user',
        status: 500
      };
    }
  }, {
    query: t.Object({
      email: t.String()
    })
  })

  // UPDATE user profile
  .patch('/', async ({ body }) => {
    try {
      const { email } = body;

      if (!email) {
        return {
          error: 'Email is required',
          status: 400
        };
      }

      const user = await UserService.updateProfile(email, body);
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      if ((error as any).code === 'P2025') {
        return {
          error: 'User not found',
          status: 404
        };
      }
      return {
        error: 'Failed to update user',
        status: 500
      };
    }
  }, {
    body: t.Object({
      email: t.String(),
      name: t.Optional(t.String()),
      image: t.Optional(t.String()),
      password: t.Optional(t.String())
    })
  })

  // REGISTER a new user
  .post('/register', async ({ body }) => {
    try {
      const user = await UserService.register(body);
      return user;
    } catch (error) {
      console.error('Error registering user:', error);
      return {
        error: (error as Error).message || 'Failed to register',
        status: 400
      };
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.Optional(t.String()),
      name: t.Optional(t.String()),
      image: t.Optional(t.String())
    })
  })

  // USE CREDITS
  .post('/credits/use', async ({ body }) => {
    try {
      const { userId, amount, input, output } = body;
      const result = await UserService.useCredits(userId, amount, input, output);
      return result;
    } catch (error) {
      console.error('Error using credits:', error);
      return {
        error: (error as Error).message || 'Failed to use credits',
        status: 500
      };
    }
  }, {
    body: t.Object({
      userId: t.String(),
      amount: t.Number(),
      input: t.String(),
      output: t.String()
    })
  })

  // ADD STORAGE
  .post('/storage/add', async ({ body }) => {
    try {
      const { userId, sizeInMB } = body;
      const result = await UserService.addStorage(userId, sizeInMB);
      return result;
    } catch (error) {
      console.error('Error adding storage:', error);
      return {
        error: 'Failed to add storage',
        status: 500
      };
    }
  }, {
    body: t.Object({
      userId: t.String(),
      sizeInMB: t.Number()
    })
  });
