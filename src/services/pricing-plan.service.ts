import { prisma } from '../utils/prisma';
import { BaseService } from './base.service';

export class PricingPlanService extends BaseService {
    protected modelName = 'pricingPlan';

    /**
     * Get all active pricing plans
     */
    static async getAllActivePlans() {
        return await prisma.pricingPlan.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { price: 'asc' }
        });
    }

    /**
     * Get a specific plan by ID
     */
    static async getPlanById(planId: string) {
        return await prisma.pricingPlan.findUnique({
            where: { id: planId }
        });
    }

    /**
     * Get free plan
     */
    static async getFreePlan() {
        return await prisma.pricingPlan.findFirst({
            where: { name: 'free', billingCycle: 'MONTHLY' }
        });
    }
}
