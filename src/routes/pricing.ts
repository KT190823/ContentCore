import { Elysia, t } from 'elysia';
import { PricingPlanService, PricingPlanHistoryService } from '../services/pricing.service';
import { prisma } from '../utils/prisma';

export const pricingRoutes = new Elysia({ prefix: '/pricing' })
  // GET all pricing plans
  .get('/plans', async () => {
    try {
      const plans = await PricingPlanService.getAllActivePlans();
      return plans;
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      return {
        error: 'Failed to fetch pricing plans',
        status: 500
      };
    }
  })

  // GET user's pricing history
  .get('/history', async ({ query }) => {
    try {
      const { userId, email } = query;

      if (!userId && !email) {
        return {
          error: 'User ID or Email is required',
          status: 400
        };
      }

      let history;
      if (email) {
        history = await PricingPlanHistoryService.getUserHistoryByEmail(email);
      } else if (userId) {
        history = await PricingPlanHistoryService.getUserHistory(userId);
      }

      return history;
    } catch (error) {
      console.error('Error fetching pricing history:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch pricing history',
        status: 500
      };
    }
  }, {
    query: t.Object({
      userId: t.Optional(t.String()),
      email: t.Optional(t.String())
    })
  })

  // GET active subscription
  .get('/active', async ({ query }) => {
    try {
      const { userId, email } = query;

      let targetUserId = userId;

      if (!targetUserId && email) {
        const user = await prisma.user.findUnique({
          where: { email }
        });
        if (user) {
          targetUserId = user.id;
        }
      }

      if (!targetUserId) {
        return {
          error: 'User ID or Email is required',
          status: 400
        };
      }

      const subscription = await PricingPlanHistoryService.getActiveSubscription(targetUserId);
      return subscription;
    } catch (error) {
      console.error('Error fetching active subscription:', error);
      return {
        error: 'Failed to fetch active subscription',
        status: 500
      };
    }
  }, {
    query: t.Object({
      userId: t.Optional(t.String()),
      email: t.Optional(t.String())
    })
  })

  // SUBSCRIBE to a plan (CREATE history)
  .post('/subscribe', async ({ body }) => {
    try {
      const { userId, email, planId, paymentMethod, transactionId } = body;

      let targetUserId = userId;

      if (!targetUserId && email) {
        const user = await prisma.user.findUnique({
          where: { email }
        });
        if (user) {
          targetUserId = user.id;
        }
      }

      if (!targetUserId || !planId) {
        return {
          error: 'User ID and Plan ID are required',
          status: 400
        };
      }

      const history = await PricingPlanHistoryService.subscribeToPlan({
        userId: targetUserId,
        planId,
        paymentMethod,
        transactionId
      });

      return history;
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to subscribe to plan',
        status: 500
      };
    }
  }, {
    body: t.Object({
      userId: t.Optional(t.String()),
      email: t.Optional(t.String()),
      planId: t.String(),
      paymentMethod: t.Optional(t.String()),
      transactionId: t.Optional(t.String())
    })
  })

  // CANCEL subscription (Back to free)
  .post('/cancel', async ({ body }) => {
    try {
      const { userId, email } = body;

      let targetUserId = userId;

      if (!targetUserId && email) {
        const user = await prisma.user.findUnique({
          where: { email }
        });
        if (user) {
          targetUserId = user.id;
        }
      }

      if (!targetUserId) {
        return {
          error: 'User ID or Email is required',
          status: 400
        };
      }

      const result = await PricingPlanHistoryService.cancelSubscription(targetUserId);
      return result;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
        status: 500
      };
    }
  }, {
    body: t.Object({
      userId: t.Optional(t.String()),
      email: t.Optional(t.String())
    })
  });
