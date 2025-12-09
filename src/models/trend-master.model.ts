import type { BaseModel } from "./base.model";

/**
 * Sentiment types for trends
 */
export type SentimentType = "positive" | "negative" | "neutral" | "mixed";

/**
 * Trend Master model - AI-clustered trending topics
 * Collection: TRENDS_MASTER
 */
export interface TrendMaster extends BaseModel {
    app_id: string;                     // Application identifier
    topic_title: string;                // Summary title of the trend
    overall_sentiment: SentimentType;   // Overall sentiment of the trend
    start_time: Date;                   // When trend started
    last_update: Date;                  // Last time trend was updated
    trend_score: number;                // Hotness score (0-100)
    summary_ai: string;                 // AI-generated summary of why it's trending
    category?: string;                  // Category (e.g., "tech", "entertainment")
    related_hashtags?: string[];        // Related hashtags
    total_mentions?: number;            // Total mention count
}
