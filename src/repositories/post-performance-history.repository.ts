import { BaseRepository } from "./base.repository";
import type { PostPerformanceHistory } from "../models/post-performance-history.model";
import { getDatabase } from "../config/database";
import { ObjectId, type Filter } from "mongodb";
import type { MetricType, PerformancePlatformType } from "../models/post-performance-history.model";

/**
 * Post Performance History Repository
 */
export class PostPerformanceHistoryRepository extends BaseRepository<PostPerformanceHistory> {
    constructor() {
        const db = getDatabase();
        super(db.collection<PostPerformanceHistory>("post_performance_history"));
    }

    /**
     * Find performance by schedule ID
     */
    async findByScheduleId(scheduleId: string | ObjectId): Promise<PostPerformanceHistory[]> {
        const objectId = typeof scheduleId === "string" ? new ObjectId(scheduleId) : scheduleId;
        return await this.findAll(
            { schedule_id: objectId } as Filter<PostPerformanceHistory>,
            { sort: { collected_at: -1 } }
        );
    }

    /**
     * Find performance by platform
     */
    async findByPlatform(platform: PerformancePlatformType): Promise<PostPerformanceHistory[]> {
        return await this.findAll(
            { platform } as Filter<PostPerformanceHistory>,
            { sort: { collected_at: -1 } }
        );
    }

    /**
     * Find performance by metric type
     */
    async findByMetricType(metricType: MetricType): Promise<PostPerformanceHistory[]> {
        return await this.findAll(
            { metric_type: metricType } as Filter<PostPerformanceHistory>,
            { sort: { collected_at: -1 } }
        );
    }

    /**
     * Find performance by schedule and metric
     */
    async findByScheduleAndMetric(
        scheduleId: string | ObjectId,
        metricType: MetricType
    ): Promise<PostPerformanceHistory[]> {
        const objectId = typeof scheduleId === "string" ? new ObjectId(scheduleId) : scheduleId;
        return await this.findAll(
            {
                schedule_id: objectId,
                metric_type: metricType,
            } as Filter<PostPerformanceHistory>,
            { sort: { collected_at: 1 } }
        );
    }

    /**
     * Find performance by date range
     */
    async findByDateRange(startDate: Date, endDate: Date): Promise<PostPerformanceHistory[]> {
        return await this.findAll(
            {
                collected_at: { $gte: startDate, $lte: endDate },
            } as any,
            { sort: { collected_at: -1 } }
        );
    }

    /**
     * Get latest performance for schedule
     */
    async getLatestBySchedule(scheduleId: string | ObjectId): Promise<PostPerformanceHistory[]> {
        const objectId = typeof scheduleId === "string" ? new ObjectId(scheduleId) : scheduleId;
        return await this.findAll(
            { schedule_id: objectId } as Filter<PostPerformanceHistory>,
            {
                sort: { collected_at: -1 },
                limit: 10,
            }
        );
    }
}
