import { BaseRepository } from "./base.repository";
import type { SocialAccount } from "../models/social-account.model";
import { getDatabase } from "../config/database";
import { ObjectId, type Filter } from "mongodb";
import type { PlatformType } from "../models/social-account.model";

/**
 * Social Account Repository
 */
export class SocialAccountRepository extends BaseRepository<SocialAccount> {
    constructor() {
        const db = getDatabase();
        super(db.collection<SocialAccount>("social_accounts"));
    }

    /**
     * Find accounts by user ID
     */
    async findByUserId(userId: string | ObjectId): Promise<SocialAccount[]> {
        const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
        return await this.findAll({ user_id: objectId } as Filter<SocialAccount>);
    }

    /**
     * Find accounts by platform
     */
    async findByPlatform(platform: PlatformType): Promise<SocialAccount[]> {
        return await this.findAll({ platform } as Filter<SocialAccount>);
    }

    /**
     * Find active accounts for a user
     */
    async findActiveAccountsByUser(userId: string | ObjectId): Promise<SocialAccount[]> {
        const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
        return await this.findAll({
            user_id: objectId,
            is_active: true,
        } as Filter<SocialAccount>);
    }

    /**
     * Find account by user and platform
     */
    async findByUserAndPlatform(
        userId: string | ObjectId,
        platform: PlatformType
    ): Promise<SocialAccount | null> {
        const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
        return await this.findOne({
            user_id: objectId,
            platform,
        } as Filter<SocialAccount>);
    }

    /**
     * Count accounts by user
     */
    async countByUser(userId: string | ObjectId): Promise<number> {
        const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
        return await this.count({ user_id: objectId } as Filter<SocialAccount>);
    }
}
