import { Elysia, t } from 'elysia';
import { PricingPlanHistoryService } from '../services/pricing.service';
import { UserHelper } from '../utils/user-helper';

export const pricingHistoryRoutes = new Elysia({ prefix: '/pricing-history' })
    // GET all pricing history for current user
    .get('/', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const history = await PricingPlanHistoryService.getUserHistory(user.id);
            return history;
        } catch (error) {
            console.error('Error fetching pricing history:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to fetch pricing history',
                status: 500
            };
        }
    })

    // GET active subscription for current user
    .get('/active', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const subscription = await PricingPlanHistoryService.getActiveSubscription(user.id);

            if (!subscription) {
                return {
                    error: 'No active subscription found',
                    status: 404
                };
            }

            return subscription;
        } catch (error) {
            console.error('Error fetching active subscription:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to fetch active subscription',
                status: 500
            };
        }
    })

    // GET a single pricing history by ID
    .get('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const instance = new PricingPlanHistoryService();
            const history = await instance.get(context.params.id);

            if (!history) {
                return {
                    error: 'Pricing history not found',
                    status: 404
                };
            }

            // Verify ownership
            if (history.userId !== user.id) {
                return {
                    error: 'Unauthorized to access this pricing history',
                    status: 403
                };
            }

            return history;
        } catch (error) {
            console.error('Error fetching pricing history:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to fetch pricing history',
                status: 500
            };
        }
    })

    // SUBSCRIBE to a plan (CREATE history)
    .post('/subscribe', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const { planId, paymentMethod, transactionId } = context.body;

            if (!planId) {
                return {
                    error: 'Plan ID is required',
                    status: 400
                };
            }

            const history = await PricingPlanHistoryService.subscribeToPlan({
                userId: user.id,
                planId,
                paymentMethod,
                transactionId
            });

            return history;
        } catch (error) {
            console.error('Error subscribing to plan:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: error instanceof Error ? error.message : 'Failed to subscribe to plan',
                status: 500
            };
        }
    }, {
        body: t.Object({
            planId: t.String(),
            paymentMethod: t.Optional(t.String()),
            transactionId: t.Optional(t.String())
        })
    })

    // CANCEL subscription (Back to free)
    .post('/cancel', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const result = await PricingPlanHistoryService.cancelSubscription(user.id);
            return result;
        } catch (error) {
            console.error('Error cancelling subscription:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: error instanceof Error ? error.message : 'Failed to cancel subscription',
                status: 500
            };
        }
    })

    // UPDATE a pricing history (admin only - for status updates)
    .patch('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);

            // Check ownership first
            const instance = new PricingPlanHistoryService();
            const existingHistory = await instance.get(context.params.id);

            if (!existingHistory) {
                return {
                    error: 'Pricing history not found',
                    status: 404
                };
            }

            if (existingHistory.userId !== user.id) {
                return {
                    error: 'Unauthorized to update this pricing history',
                    status: 403
                };
            }

            const history = await instance.update(context.params.id, context.body);
            return history;
        } catch (error) {
            console.error('Error updating pricing history:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            if ((error as any).code === 'P2025') {
                return {
                    error: 'Pricing history not found',
                    status: 404
                };
            }

            return {
                error: 'Failed to update pricing history',
                status: 500
            };
        }
    }, {
        body: t.Object({
            status: t.Optional(t.Enum({
                SUCCESS: 'SUCCESS',
                FAILED: 'FAILED',
                EXPIRED: 'EXPIRED'
            })),
            errorMessage: t.Optional(t.String()),
            endDate: t.Optional(t.String()),
            expireAt: t.Optional(t.String())
        })
    })

    // DELETE a pricing history (soft delete by setting status)
    .delete('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);

            // Check ownership first
            const instance = new PricingPlanHistoryService();
            const existingHistory = await instance.get(context.params.id);

            if (!existingHistory) {
                return {
                    error: 'Pricing history not found',
                    status: 404
                };
            }

            if (existingHistory.userId !== user.id) {
                return {
                    error: 'Unauthorized to delete this pricing history',
                    status: 403
                };
            }

            await instance.delete(context.params.id);
            return { success: true };
        } catch (error) {
            console.error('Error deleting pricing history:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            if ((error as any).code === 'P2025') {
                return {
                    error: 'Pricing history not found',
                    status: 404
                };
            }

            return {
                error: 'Failed to delete pricing history',
                status: 500
            };
        }
    });
