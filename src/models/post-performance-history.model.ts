import type { BaseModel } from "./base.model";
import type { ObjectId } from "mongodb";

/**
 * Metric types for performance tracking
 */
export type MetricType = "like" | "comment" | "view" | "share" | "click" | "engagement_rate" | "reach" | "impression";

/**
 * Platform types for performance tracking
 */
export type PerformancePlatformType = "facebook" | "youtube" | "instagram" | "tiktok" | "twitter";

/**
 * Post Performance History model - Historical performance metrics
 * Collection: POST_PERFORMANCE_HISTORY
 */
export interface PostPerformanceHistory extends BaseModel {
    schedule_id: ObjectId;              // Foreign key to POST_SCHEDULES
    platform: PerformancePlatformType;  // Platform name
    metric_type: MetricType;            // Type of metric
    value: number;                      // Metric value
    collected_at: Date;                 // When metric was collected
    previous_value?: number;            // Previous value for comparison
    growth_rate?: number;               // Growth rate percentage
}
