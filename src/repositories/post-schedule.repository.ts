import { BaseRepository } from "./base.repository";
import type { PostSchedule } from "../models/post-schedule.model";
import { getDatabase } from "../config/database";
import { ObjectId, type Filter } from "mongodb";
import type { ScheduleStatusType } from "../models/post-schedule.model";

/**
 * Post Schedule Repository
 */
export class PostScheduleRepository extends BaseRepository<PostSchedule> {
    constructor() {
        const db = getDatabase();
        super(db.collection<PostSchedule>("post_schedules"));
    }

    /**
     * Find schedules by post ID
     */
    async findByPostId(postId: string | ObjectId): Promise<PostSchedule[]> {
        const objectId = typeof postId === "string" ? new ObjectId(postId) : postId;
        return await this.findAll(
            { post_id: objectId } as Filter<PostSchedule>,
            { sort: { scheduled_time: 1 } }
        );
    }

    /**
     * Find schedules by account ID
     */
    async findByAccountId(accountId: string | ObjectId): Promise<PostSchedule[]> {
        const objectId = typeof accountId === "string" ? new ObjectId(accountId) : accountId;
        return await this.findAll(
            { account_id: objectId } as Filter<PostSchedule>,
            { sort: { scheduled_time: 1 } }
        );
    }

    /**
     * Find schedules by status
     */
    async findByStatus(status: ScheduleStatusType): Promise<PostSchedule[]> {
        return await this.findAll(
            { post_status: status } as Filter<PostSchedule>,
            { sort: { scheduled_time: 1 } }
        );
    }

    /**
     * Find upcoming schedules
     */
    async findUpcoming(limit: number = 10): Promise<PostSchedule[]> {
        const now = new Date();
        return await this.findAll(
            {
                scheduled_time: { $gte: now },
                post_status: "pending",
            } as any,
            {
                sort: { scheduled_time: 1 },
                limit,
            }
        );
    }

    /**
     * Find schedules by date range
     */
    async findByDateRange(startDate: Date, endDate: Date): Promise<PostSchedule[]> {
        return await this.findAll(
            {
                scheduled_time: { $gte: startDate, $lte: endDate },
            } as any,
            { sort: { scheduled_time: 1 } }
        );
    }

    /**
     * Find AI-optimized schedules
     */
    async findAiOptimized(): Promise<PostSchedule[]> {
        return await this.findAll(
            { ai_optimized_time: true } as Filter<PostSchedule>,
            { sort: { scheduled_time: 1 } }
        );
    }

    /**
     * Find failed schedules that can be retried
     */
    async findRetryable(maxRetries: number = 3): Promise<PostSchedule[]> {
        return await this.findAll({
            post_status: "failed",
            retry_count: { $lt: maxRetries },
        } as any);
    }
}
