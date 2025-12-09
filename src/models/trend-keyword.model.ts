import type { BaseModel } from "./base.model";
import type { ObjectId } from "mongodb";

/**
 * Trend Keyword model - Keywords contributing to a trend
 * Collection: TREND_KEYWORDS
 */
export interface TrendKeyword extends BaseModel {
    trend_id: ObjectId;                 // Foreign key to TRENDS_MASTER
    keyword_text: string;               // The keyword/phrase
    frequency_count: number;            // Number of mentions
    daily_growth_rate: number;          // Growth rate percentage (e.g., 25.5 for 25.5%)
    search_volume?: number;             // Search volume if available
    competition_score?: number;         // Competition score (0-1)
}
