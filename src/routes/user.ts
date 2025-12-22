import { Elysia, t } from 'elysia';
import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';

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

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          credit: true,
          creditUsed: true,
          capacity: true,
          capacityUsed: true,
          pricingPlanId: true,
          pricingPlan: {
            select: {
              id: true,
              name: true,
              price: true,
              currency: true,
              credit: true,
              capacity: true,
              features: true
            }
          },
          channels: {
            select: {
              id: true,
              platform: true,
              channelId: true,
              channelName: true,
              channelImage: true,
              createdAt: true
            }
          }
        }
      });

      if (!user) {
        return {
          error: 'User not found',
          status: 404
        };
      }

      return { user };
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
      const { email, name, image, password } = body;

      if (!email) {
        return {
          error: 'Email is required',
          status: 400
        };
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (image !== undefined) updateData.image = image;
      if (password !== undefined) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const user = await prisma.user.update({
        where: { email },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          credit: true,
          creditUsed: true,
          capacity: true,
          capacityUsed: true
        }
      });

      return { user };
    } catch (error) {
      console.error('Error updating user:', error);
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
  });
