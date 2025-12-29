import { prisma } from '../utils/prisma';
import { BaseService } from './base.service';
import { PricingPlanService } from './pricing-plan.service';

export class PricingPlanHistoryService extends BaseService {
    protected modelName = 'pricingPlanHistory';

    /**
     * Get pricing history for a user
     */
    static async getUserHistory(userId: string) {
        return await prisma.pricingPlanHistory.findMany({
            where: { userId },
            include: {
                plan: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get pricing history by email
     */
    static async getUserHistoryByEmail(email: string) {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw new Error('User not found');
        }

        return await this.getUserHistory(user.id);
    }

    /**
     * Subscribe user to a plan
     */
    static async subscribeToPlan(params: {
        userId: string;
        planId: string;
        paymentMethod?: string;
        transactionId?: string;
    }) {
        const { userId, planId, paymentMethod, transactionId } = params;

        // Get the plan
        const plan = await prisma.pricingPlan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            throw new Error('Plan not found');
        }

        // Calculate credits based on billing cycle
        const isYearly = plan.billingCycle === 'YEARLY';
        const monthlyCredit = isYearly ? Math.floor(plan.credit / 12) : plan.credit;

        // Update the user with the new plan and credits
        await prisma.user.update({
            where: { id: userId },
            data: {
                pricingPlanId: plan.id,
                credit: monthlyCredit,
                creditUsed: 0, // Reset usage for new plan cycle
                capacity: plan.capacity,
                lastResetDate: new Date()
            }
        });

        // Create history record
        const durationDays = isYearly ? 365 : 30;
        const expireDate = plan.name !== 'free'
            ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
            : null;

        const history = await prisma.pricingPlanHistory.create({
            data: {
                userId,
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
                plan: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                }
            }
        });

        return history;
    }

    /**
     * Cancel subscription and revert to free plan
     */
    static async cancelSubscription(userId: string) {
        // Find the free plan
        const freePlan = await PricingPlanService.getFreePlan();

        if (!freePlan) {
            throw new Error('Free plan not found');
        }

        // Update user to free plan
        await prisma.user.update({
            where: { id: userId },
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
                userId,
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

        return { success: true };
    }

    /**
     * Get active subscription for a user
     */
    static async getActiveSubscription(userId: string) {
        return await prisma.pricingPlanHistory.findFirst({
            where: {
                userId,
                status: 'SUCCESS',
                OR: [
                    { expireAt: null }, // Free plan
                    { expireAt: { gte: new Date() } } // Not expired
                ]
            },
            include: {
                plan: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
