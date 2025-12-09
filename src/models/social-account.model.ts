import type { BaseModel } from "./base.model";
import type { ObjectId } from "mongodb";

/**
 * Platform types supported for social accounts
 */
export type PlatformType = "facebook" | "youtube" | "instagram" | "tiktok" | "twitter";

/**
 * Social Account model - Stores connected social media accounts
 * Collection: SOCIAL_ACCOUNTS
 */
export interface SocialAccount extends BaseModel {
    user_id: ObjectId;                  // Foreign key to USERS
    platform: PlatformType;             // Social media platform
    platform_page_id: string;           // Platform-specific page/channel ID
    access_token: string;               // OAuth access token
    refresh_token?: string;             // OAuth refresh token (optional)
    token_expires_at?: Date;            // Token expiration date
    is_active: boolean;                 // Whether account is active
    page_name?: string;                 // Display name of the page/channel
    profile_picture_url?: string;       // Profile picture URL
}
