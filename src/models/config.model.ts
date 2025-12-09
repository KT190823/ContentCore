import type { BaseModel } from "./base.model";
import type { ObjectId } from "mongodb";

/**
 * User Config model - Stores user preferences and settings
 * Collection: CONFIGS
 */
export interface Config extends BaseModel {
    user_id: ObjectId;                  // Foreign key to USERS
    target_regions: string[];           // Target regions/countries (e.g., ["VN", "US", "TH"])
    industry_niche: string;             // Industry/niche focus (e.g., "fashion", "tech", "food")
    language_preference?: string;       // Preferred language (e.g., "vi", "en")
    timezone?: string;                  // User timezone (e.g., "Asia/Ho_Chi_Minh")
    notification_settings?: {
        email_enabled: boolean;
        push_enabled: boolean;
        trend_alerts: boolean;
        post_reminders: boolean;
    };
}
