import type { BaseModel } from "./base.model";
import type { ObjectId } from "mongodb";

/**
 * Subscription status types
 */
export type SubscriptionStatusType = "active" | "expired" | "trial" | "cancelled" | "suspended";

/**
 * Renewal types
 */
export type RenewalType = "manual" | "auto";

/**
 * User Subscription model - User's active subscription
 * Collection: USER_SUBSCRIPTIONS
 */
export interface UserSubscription extends BaseModel {
    user_id: ObjectId;                  // Foreign key to USERS
    plan_id: ObjectId;                  // Foreign key to PRICING_PLANS
    start_date: Date;                   // Subscription start date
    end_date: Date;                     // Subscription end date
    status: SubscriptionStatusType;     // Current subscription status
    renewal_type: RenewalType;          // Renewal type
    auto_renew: boolean;                // Whether to auto-renew
    trial_end_date?: Date;              // Trial end date (if applicable)
    cancellation_date?: Date;           // Date when cancelled
    cancellation_reason?: string;       // Reason for cancellation
}
