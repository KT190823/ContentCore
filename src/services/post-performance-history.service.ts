import { BaseService } from "./base.service";
import type { PostPerformanceHistory } from "../models/post-performance-history.model";
import { PostPerformanceHistoryRepository } from "../repositories/post-performance-history.repository";
import { ObjectId } from "mongodb";
import type { MetricType, PerformancePlatformType } from "../models/post-performance-history.model";

/**
 * Post Performance History Service
 */
export class PostPerformanceHistoryService extends BaseService<PostPerformanceHistory> {
    private postPerformanceHistoryRepository: PostPerformanceHistoryRepository;

    constructor() {
        const postPerformanceHistoryRepository = new PostPerformanceHistoryRepository();
        super(postPerformanceHistoryRepository);
        this.postPerformanceHistoryRepository = postPerformanceHistoryRepository;
    }

    /**
     * Get performance by schedule ID
     */
    async getByScheduleId(scheduleId: string | ObjectId): Promise<PostPerformanceHistory[]> {
        return await this.postPerformanceHistoryRepository.findByScheduleId(scheduleId);
    }

    /**
     * Get performance by metric type
     */
    async getByMetricType(metricType: MetricType): Promise<PostPerformanceHistory[]> {
        return await this.postPerformanceHistoryRepository.findByMetricType(metricType);
    }

    /**
     * Get performance by schedule and metric
     */
    async getByScheduleAndMetric(
        scheduleId: string | ObjectId,
        metricType: MetricType
    ): Promise<PostPerformanceHistory[]> {
        return await this.postPerformanceHistoryRepository.findByScheduleAndMetric(
            scheduleId,
            metricType
        );
    }

    /**
     * Track performance metric
     */
    async trackMetric(
        scheduleId: string | ObjectId,
        platform: PerformancePlatformType,
        metricType: MetricType,
        value: number
    ): Promise<PostPerformanceHistory> {
        // Get previous value for growth calculation
        const history = await this.getByScheduleAndMetric(scheduleId, metricType);
        const previousValue = history.length > 0 ? history[history.length - 1].value : 0;
        const growthRate = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;

        const objectId = typeof scheduleId === "string" ? new ObjectId(scheduleId) : scheduleId;
        return await this.create({
            schedule_id: objectId,
            platform,
            metric_type: metricType,
            value,
            collected_at: new Date(),
            previous_value: previousValue,
            growth_rate: growthRate,
        });
    }

    /**
     * Get latest performance metrics
     */
    async getLatestBySchedule(scheduleId: string | ObjectId): Promise<PostPerformanceHistory[]> {
        return await this.postPerformanceHistoryRepository.getLatestBySchedule(scheduleId);
    }
}
