import { BaseRepository } from "./base.repository";
import type { PricingPlan } from "../models/pricing-plan.model";
import { getDatabase } from "../config/database";
import type { Filter } from "mongodb";

/**
 * Pricing Plan Repository
 */
export class PricingPlanRepository extends BaseRepository<PricingPlan> {
    constructor() {
        const db = getDatabase();
        super(db.collection<PricingPlan>("pricing_plans"));
    }

    /**
     * Find all active plans
     */
    async findActivePlans(): Promise<PricingPlan[]> {
        return await this.findAll(
            { is_active: true } as Filter<PricingPlan>,
            { sort: { display_order: 1 } }
        );
    }

    /**
     * Find plan by name
     */
    async findByName(planName: string): Promise<PricingPlan | null> {
        return await this.findOne({ plan_name: planName } as Filter<PricingPlan>);
    }

    /**
     * Find popular plans
     */
    async findPopularPlans(): Promise<PricingPlan[]> {
        return await this.findAll({
            is_active: true,
            is_popular: true,
        } as Filter<PricingPlan>);
    }

    /**
     * Find plans by price range
     */
    async findByPriceRange(minPrice: number, maxPrice: number): Promise<PricingPlan[]> {
        return await this.findAll({
            is_active: true,
            monthly_price: { $gte: minPrice, $lte: maxPrice },
        } as any);
    }

    /**
     * Find plans with specific features
     */
    async findByChannelLimit(minChannels: number): Promise<PricingPlan[]> {
        return await this.findAll(
            {
                is_active: true,
                max_channels: { $gte: minChannels },
            } as any,
            { sort: { monthly_price: 1 } }
        );
    }
}
