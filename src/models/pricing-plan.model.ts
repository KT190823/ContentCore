import type { BaseModel } from "./base.model";

/**
 * Pricing Plan model - Service tier definitions
 * Collection: PRICING_PLANS
 */
export interface PricingPlan extends BaseModel {
    plan_name: string;                  // Plan name (e.g., "Free", "Basic", "Premium")
    description: string;                // Plan description
    monthly_price: number;              // Monthly price
    yearly_price: number;               // Yearly price
    features: string[];                 // Array of feature descriptions
    max_channels: number;               // Maximum number of channels allowed
    ai_quota: number;                   // AI usage quota (requests per month)
    is_active: boolean;                 // Whether plan is currently available
    display_order?: number;             // Order to display on pricing page
    is_popular?: boolean;               // Mark as popular/recommended
    max_posts_per_month?: number;       // Maximum posts per month
    custom_branding?: boolean;          // Whether custom branding is allowed
}
