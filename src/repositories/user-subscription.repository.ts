import { BaseRepository } from "./base.repository";
import type { UserSubscription } from "../models/user-subscription.model";
import { getDatabase } from "../config/database";
import { ObjectId, type Filter } from "mongodb";
import type { SubscriptionStatusType } from "../models/user-subscription.model";

/**
 * User Subscription Repository
 */
export class UserSubscriptionRepository extends BaseRepository<UserSubscription> {
    constructor() {
        const db = getDatabase();
        super(db.collection<UserSubscription>("user_subscriptions"));
    }

    /**
     * Find subscriptions by user ID
     */
    async findByUserId(userId: string | ObjectId): Promise<UserSubscription[]> {
        const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
        return await this.findAll(
            { user_id: objectId } as Filter<UserSubscription>,
            { sort: { start_date: -1 } }
        );
    }

    /**
     * Find active subscription for user
     */
    async findActiveByUser(userId: string | ObjectId): Promise<UserSubscription | null> {
        const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
        return await this.findOne({
            user_id: objectId,
            status: "active",
        } as Filter<UserSubscription>);
    }

    /**
     * Find subscriptions by status
     */
    async findByStatus(status: SubscriptionStatusType): Promise<UserSubscription[]> {
        return await this.findAll(
            { status } as Filter<UserSubscription>,
            { sort: { start_date: -1 } }
        );
    }

    /**
     * Find expiring subscriptions
     */
    async findExpiring(daysAhead: number = 7): Promise<UserSubscription[]> {
        const now = new Date();
        const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
        return await this.findAll({
            status: "active",
            end_date: { $gte: now, $lte: futureDate },
        } as any);
    }

    /**
     * Find subscriptions by plan
     */
    async findByPlan(planId: string | ObjectId): Promise<UserSubscription[]> {
        const objectId = typeof planId === "string" ? new ObjectId(planId) : planId;
        return await this.findAll({ plan_id: objectId } as Filter<UserSubscription>);
    }

    /**
     * Find auto-renewing subscriptions
     */
    async findAutoRenewing(): Promise<UserSubscription[]> {
        return await this.findAll({
            status: "active",
            auto_renew: true,
        } as Filter<UserSubscription>);
    }

    /**
     * Count subscriptions by plan
     */
    async countByPlan(planId: string | ObjectId): Promise<number> {
        const objectId = typeof planId === "string" ? new ObjectId(planId) : planId;
        return await this.count({
            plan_id: objectId,
            status: "active",
        } as Filter<UserSubscription>);
    }
}
