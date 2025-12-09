import { Elysia } from "elysia";
import { PricingPlanService } from "../services/pricing-plan.service";
import { UserSubscriptionService } from "../services/user-subscription.service";

let pricingPlanServiceInstance: PricingPlanService | null = null;
const getPricingPlanService = () => {
    if (!pricingPlanServiceInstance) {
        pricingPlanServiceInstance = new PricingPlanService();
    }
    return pricingPlanServiceInstance;
};

let userSubscriptionServiceInstance: UserSubscriptionService | null = null;
const getUserSubscriptionService = () => {
    if (!userSubscriptionServiceInstance) {
        userSubscriptionServiceInstance = new UserSubscriptionService();
    }
    return userSubscriptionServiceInstance;
};

/**
 * Pricing & Subscription routes
 */
export const pricingRoutes = new Elysia({ prefix: "/api/pricing" })
    // Get all active plans
    .get("/plans", async () => {
        const plans = await getPricingPlanService().getActivePlans();
        return {
            success: true,
            data: plans,
        };
    })

    // Get popular plans
    .get("/plans/popular", async () => {
        const plans = await getPricingPlanService().getPopularPlans();
        return {
            success: true,
            data: plans,
        };
    })

    // Get plan by ID
    .get("/plans/:id", async ({ params, set }) => {
        const plan = await getPricingPlanService().findById(params.id);
        if (!plan) {
            set.status = 404;
            return { success: false, message: "Plan not found" };
        }

        const savings = getPricingPlanService().calculateYearlySavings(plan);
        const discount = getPricingPlanService().calculateYearlyDiscount(plan);

        return {
            success: true,
            data: {
                ...plan,
                yearly_savings: savings,
                yearly_discount_percentage: discount,
            },
        };
    })

    // Get user subscriptions
    .get("/subscriptions/user/:userId", async ({ params }) => {
        const subscriptions = await getUserSubscriptionService().getByUserId(params.userId);
        return {
            success: true,
            data: subscriptions,
        };
    })

    // Get user's active subscription
    .get("/subscriptions/user/:userId/active", async ({ params, set }) => {
        const subscription = await getUserSubscriptionService().getActiveByUser(params.userId);
        if (!subscription) {
            set.status = 404;
            return { success: false, message: "No active subscription found" };
        }
        return {
            success: true,
            data: subscription,
        };
    });
