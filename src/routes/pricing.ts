import { Elysia, t } from 'elysia';
import { prisma } from '../utils/prisma';

export const pricingRoutes = new Elysia({ prefix: '/pricing' })
  // GET all pricing plans
  .get('/plans', async () => {
    try {
      const plans = await prisma.pricingPlan.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { price: 'asc' }
      });
      return { plans };
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

      const history = await prisma.pricingPlanHistory.findMany({
        where: { userId: targetUserId },
        include: {
          plan: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return { history };
    } catch (error) {
      console.error('Error fetching pricing history:', error);
      return {
        error: 'Failed to fetch pricing history',
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

      const plan = await prisma.pricingPlan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        return {
          error: 'Plan not found',
          status: 404
        };
      }

      const isYearly = plan.billingCycle === 'YEARLY';
      const monthlyCredit = isYearly ? Math.floor(plan.credit / 12) : plan.credit;

      // Update the user with the new plan and credits
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          pricingPlanId: plan.id,
          credit: monthlyCredit,
          creditUsed: 0, // Reset usage for new plan cycle
          capacity: plan.capacity, // Storage capacity remains the same
          lastResetDate: new Date()
        }
      });

      // Create history record
      const durationDays = isYearly ? 365 : 30;
      const expireDate = plan.name !== 'free' ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000) : null;

      const history = await prisma.pricingPlanHistory.create({
        data: {
          userId: targetUserId,
          planId: plan.id,
          price: plan.price,
          currency: plan.currency,
          status: 'SUCCESS',
          paymentMethod,
          transactionId,
          startDate: new Date(),
          endDate: expireDate,
          expireAt: expireDate
        },
        include: {
          plan: true
        }
      });

      return { history, status: 201 };
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      return {
        error: 'Failed to subscribe to plan',
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

      // Find the free plan
      const freePlan = await prisma.pricingPlan.findFirst({
        where: { name: 'free', billingCycle: 'MONTHLY' }
      });

      if (!freePlan) {
        return {
          error: 'Free plan not found',
          status: 404
        };
      }

      // Update user to free plan
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          pricingPlanId: freePlan.id,
          credit: freePlan.credit,
          creditUsed: 0,
          capacity: freePlan.capacity,
          lastResetDate: new Date()
        }
      });

      // Create history record for cancellation
      await prisma.pricingPlanHistory.create({
        data: {
          userId: targetUserId,
          planId: freePlan.id,
          price: 0,
          currency: 'VND',
          status: 'SUCCESS',
          paymentMethod: 'system',
          transactionId: 'cancel-revert-free',
          startDate: new Date(),
          expireAt: null // Free plan doesn't expire
        }
      });

      return { success: true, message: 'Subscription cancelled and reverted to free plan' };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return {
        error: 'Failed to cancel subscription',
        status: 500
      };
    }
  }, {
    body: t.Object({
      userId: t.Optional(t.String()),
      email: t.Optional(t.String())
    })
  });
