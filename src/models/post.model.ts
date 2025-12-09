import type { BaseModel } from "./base.model";
import type { ObjectId } from "mongodb";

/**
 * Post status types
 */
export type PostStatusType = "draft" | "scheduled" | "published" | "failed" | "archived";

/**
 * Post model - Master content/posts
 * Collection: POSTS
 */
export interface Post extends BaseModel {
    user_id: ObjectId;                  // Foreign key to USERS
    trend_id?: ObjectId;                // Foreign key to TRENDS_MASTER (optional)
    content_text: string;               // Main content text
    media_url?: string;                 // Media URL (image/video)
    media_type?: "image" | "video" | "carousel";
    ai_risk_score: number;              // AI-assessed content risk score (0-1)
    status: PostStatusType;             // Current status of the post
    title?: string;                     // Post title/headline
    hashtags?: string[];                // Hashtags used
    target_audience?: string;           // Target audience description
}
