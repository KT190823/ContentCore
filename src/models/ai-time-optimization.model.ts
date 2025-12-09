import type { BaseModel } from "./base.model";
import type { ObjectId } from "mongodb";

/**
 * Best time data structure
 */
export interface BestTime {
    hour: number;                       // Hour of day (0-23)
    day_of_week: number;                // Day of week (0-6, 0=Sunday)
    engagement_score: number;           // Engagement score (0-1)
}

/**
 * AI Time Optimization model - AI-calculated optimal posting times
 * Collection: AI_TIME_OPTIMIZATION
 */
export interface AiTimeOptimization extends BaseModel {
    account_id: ObjectId;               // Foreign key to SOCIAL_ACCOUNTS
    best_times: BestTime[];             // Array of best posting times
    updated_at: Date;                   // Last update timestamp
    sample_size?: number;               // Number of posts analyzed
    confidence_score?: number;          // Confidence in recommendations (0-1)
    last_analyzed_post_date?: Date;     // Date of last post analyzed
}
