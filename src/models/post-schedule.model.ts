import type { BaseModel } from "./base.model";
import type { ObjectId } from "mongodb";

/**
 * Schedule status types
 */
export type ScheduleStatusType = "pending" | "publishing" | "published" | "failed" | "cancelled";

/**
 * Post Schedule model - Scheduled posts for specific channels
 * Collection: POST_SCHEDULES
 */
export interface PostSchedule extends BaseModel {
    post_id: ObjectId;                  // Foreign key to POSTS
    account_id: ObjectId;               // Foreign key to SOCIAL_ACCOUNTS
    scheduled_time: Date;               // When to publish
    post_status: ScheduleStatusType;    // Current status
    platform_post_id?: string;          // ID from platform after successful post
    ai_optimized_time: boolean;         // Whether time was AI-optimized
    published_at?: Date;                // Actual publish time
    error_message?: string;             // Error message if failed
    retry_count?: number;               // Number of retry attempts
}
