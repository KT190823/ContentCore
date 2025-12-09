import type { BaseModel } from "./base.model";
import type { ObjectId } from "mongodb";

/**
 * Source platform types
 */
export type SourcePlatformType = "tiktok" | "facebook" | "youtube" | "instagram" | "twitter" | "vnexpress" | "news";

/**
 * Trend Source model - Source posts/URLs for trends
 * Collection: TREND_SOURCES
 */
export interface TrendSource extends BaseModel {
    trend_id: ObjectId;                 // Foreign key to TRENDS_MASTER
    source_url: string;                 // URL of the source
    platform: SourcePlatformType;       // Platform where content was found
    sentiment_score: number;            // Sentiment score (-1 to 1)
    crawled_at: Date;                   // When this source was crawled
    author?: string;                    // Author/creator name
    engagement_metrics?: {
        likes?: number;
        shares?: number;
        comments?: number;
        views?: number;
    };
}
