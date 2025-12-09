import { BaseService } from "./base.service";
import type { UserSubscription } from "../models/user-subscription.model";
import { UserSubscriptionRepository } from "../repositories/user-subscription.repository";
import type { ObjectId } from "mongodb";
import type { SubscriptionStatusType } from "../models/user-subscription.model";
import type { CreateModel } from "../models/base.model";

/**
 * User Subscription Service
 */
export class UserSubscriptionService extends BaseService<UserSubscription> {
    private userSubscriptionRepository: UserSubscriptionRepository;

    constructor() {
        const userSubscriptionRepository = new UserSubscriptionRepository();
        super(userSubscriptionRepository);
        this.userSubscriptionRepository = userSubscriptionRepository;
    }

    /**
     * Get subscriptions by user ID
     */
    async getByUserId(userId: string | ObjectId): Promise<UserSubscription[]> {
        return await this.userSubscriptionRepository.findByUserId(userId);
    }

    /**
     * Get active subscription for user
     */
    async getActiveByUser(userId: string | ObjectId): Promise<UserSubscription | null> {
        return await this.userSubscriptionRepository.findActiveByUser(userId);
    }

    /**
     * Create new subscription
     */
    async subscribe(data: CreateModel<UserSubscription>): Promise<UserSubscription> {
        // Deactivate existing active subscriptions
        const existingActive = await this.getActiveByUser(data.user_id);
        if (existingActive) {
            await this.update(existingActive._id!, {
                status: "cancelled" as SubscriptionStatusType,
                cancellation_date: new Date(),
            } as any);
        }

        return await this.create(data);
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(
        subscriptionId: string | ObjectId,
        reason?: string
    ): Promise<UserSubscription | null> {
        return await this.update(subscriptionId, {
            status: "cancelled" as SubscriptionStatusType,
            auto_renew: false,
            cancellation_date: new Date(),
            cancellation_reason: reason,
        } as any);
    }

    /**
     * Renew subscription
     */
    async renewSubscription(
        subscriptionId: string | ObjectId,
        newEndDate: Date
    ): Promise<UserSubscription | null> {
        return await this.update(subscriptionId, {
            status: "active" as SubscriptionStatusType,
            end_date: newEndDate,
        } as any);
    }

    /**
     * Get expiring subscriptions
     */
    async getExpiring(daysAhead: number = 7): Promise<UserSubscription[]> {
        return await this.userSubscriptionRepository.findExpiring(daysAhead);
    }

    /**
     * Check if subscription is active
     */
    async isActive(userId: string | ObjectId): Promise<boolean> {
        const subscription = await this.getActiveByUser(userId);
        return subscription !== null && subscription.status === "active";
    }

    /**
     * Count active subscriptions by plan
     */
    async countByPlan(planId: string | ObjectId): Promise<number> {
        return await this.userSubscriptionRepository.countByPlan(planId);
    }
}
