import { BaseService } from "./base.service";
import type { PricingPlan } from "../models/pricing-plan.model";
import { PricingPlanRepository } from "../repositories/pricing-plan.repository";

/**
 * Pricing Plan Service
 */
export class PricingPlanService extends BaseService<PricingPlan> {
    private pricingPlanRepository: PricingPlanRepository;

    constructor() {
        const pricingPlanRepository = new PricingPlanRepository();
        super(pricingPlanRepository);
        this.pricingPlanRepository = pricingPlanRepository;
    }

    /**
     * Get all active plans
     */
    async getActivePlans(): Promise<PricingPlan[]> {
        return await this.pricingPlanRepository.findActivePlans();
    }

    /**
     * Get plan by name
     */
    async getByName(planName: string): Promise<PricingPlan | null> {
        return await this.pricingPlanRepository.findByName(planName);
    }

    /**
     * Get popular plans
     */
    async getPopularPlans(): Promise<PricingPlan[]> {
        return await this.pricingPlanRepository.findPopularPlans();
    }

    /**
     * Get plans by price range
     */
    async getByPriceRange(minPrice: number, maxPrice: number): Promise<PricingPlan[]> {
        return await this.pricingPlanRepository.findByPriceRange(minPrice, maxPrice);
    }

    /**
     * Calculate yearly savings
     */
    calculateYearlySavings(plan: PricingPlan): number {
        const monthlyTotal = plan.monthly_price * 12;
        return monthlyTotal - plan.yearly_price;
    }

    /**
     * Calculate yearly discount percentage
     */
    calculateYearlyDiscount(plan: PricingPlan): number {
        const monthlyTotal = plan.monthly_price * 12;
        if (monthlyTotal === 0) return 0;
        return ((monthlyTotal - plan.yearly_price) / monthlyTotal) * 100;
    }
}
