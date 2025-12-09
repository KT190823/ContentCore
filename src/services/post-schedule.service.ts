import { BaseService } from "./base.service";
import type { PostSchedule } from "../models/post-schedule.model";
import { PostScheduleRepository } from "../repositories/post-schedule.repository";
import type { ObjectId } from "mongodb";
import type { ScheduleStatusType } from "../models/post-schedule.model";
import type { CreateModel } from "../models/base.model";

/**
 * Post Schedule Service
 */
export class PostScheduleService extends BaseService<PostSchedule> {
    private postScheduleRepository: PostScheduleRepository;

    constructor() {
        const postScheduleRepository = new PostScheduleRepository();
        super(postScheduleRepository);
        this.postScheduleRepository = postScheduleRepository;
    }

    /**
     * Get schedules by post ID
     */
    async getByPostId(postId: string | ObjectId): Promise<PostSchedule[]> {
        return await this.postScheduleRepository.findByPostId(postId);
    }

    /**
     * Get schedules by account ID
     */
    async getByAccountId(accountId: string | ObjectId): Promise<PostSchedule[]> {
        return await this.postScheduleRepository.findByAccountId(accountId);
    }

    /**
     * Get upcoming schedules
     */
    async getUpcoming(limit: number = 10): Promise<PostSchedule[]> {
        return await this.postScheduleRepository.findUpcoming(limit);
    }

    /**
     * Schedule a post
     */
    async schedulePost(data: CreateModel<PostSchedule>): Promise<PostSchedule> {
        const scheduleData = {
            ...data,
            post_status: "pending" as ScheduleStatusType,
            retry_count: 0,
        };

        return await this.create(scheduleData);
    }

    /**
     * Update schedule status
     */
    async updateStatus(
        scheduleId: string | ObjectId,
        status: ScheduleStatusType,
        platformPostId?: string,
        errorMessage?: string
    ): Promise<PostSchedule | null> {
        const updateData: any = { post_status: status };

        if (status === "published" && platformPostId) {
            updateData.platform_post_id = platformPostId;
            updateData.published_at = new Date();
        }

        if (status === "failed" && errorMessage) {
            updateData.error_message = errorMessage;
        }

        return await this.update(scheduleId, updateData);
    }

    /**
     * Get schedules by date range
     */
    async getByDateRange(startDate: Date, endDate: Date): Promise<PostSchedule[]> {
        return await this.postScheduleRepository.findByDateRange(startDate, endDate);
    }

    /**
     * Get retryable failed schedules
     */
    async getRetryable(maxRetries: number = 3): Promise<PostSchedule[]> {
        return await this.postScheduleRepository.findRetryable(maxRetries);
    }

    /**
     * Increment retry count
     */
    async incrementRetry(scheduleId: string | ObjectId): Promise<PostSchedule | null> {
        const schedule = await this.findById(scheduleId);
        if (!schedule) {
            throw new Error("Schedule not found");
        }

        return await this.update(scheduleId, {
            retry_count: (schedule.retry_count || 0) + 1,
        } as any);
    }
}
