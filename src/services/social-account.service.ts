import { BaseService } from "./base.service";
import type { SocialAccount } from "../models/social-account.model";
import { SocialAccountRepository } from "../repositories/social-account.repository";
import type { ObjectId } from "mongodb";
import type { PlatformType } from "../models/social-account.model";
import type { CreateModel } from "../models/base.model";

/**
 * Social Account Service
 */
export class SocialAccountService extends BaseService<SocialAccount> {
    private socialAccountRepository: SocialAccountRepository;

    constructor() {
        const socialAccountRepository = new SocialAccountRepository();
        super(socialAccountRepository);
        this.socialAccountRepository = socialAccountRepository;
    }

    /**
     * Get accounts by user ID
     */
    async getByUserId(userId: string | ObjectId): Promise<SocialAccount[]> {
        return await this.socialAccountRepository.findByUserId(userId);
    }

    /**
     * Get active accounts for user
     */
    async getActiveAccountsByUser(userId: string | ObjectId): Promise<SocialAccount[]> {
        return await this.socialAccountRepository.findActiveAccountsByUser(userId);
    }

    /**
     * Connect new social account
     */
    async connectAccount(data: CreateModel<SocialAccount>): Promise<SocialAccount> {
        // Check if account already exists
        const existing = await this.socialAccountRepository.findByUserAndPlatform(
            data.user_id,
            data.platform
        );
        if (existing) {
            throw new Error(`${data.platform} account already connected`);
        }

        return await this.create(data);
    }

    /**
     * Disconnect social account
     */
    async disconnectAccount(accountId: string | ObjectId): Promise<boolean> {
        const account = await this.findById(accountId);
        if (!account) {
            throw new Error("Account not found");
        }

        // Deactivate instead of deleting
        await this.update(accountId, { is_active: false } as any);
        return true;
    }

    /**
     * Count accounts by user
     */
    async countByUser(userId: string | ObjectId): Promise<number> {
        return await this.socialAccountRepository.countByUser(userId);
    }

    /**
     * Refresh access token
     */
    async refreshToken(
        accountId: string | ObjectId,
        newAccessToken: string,
        expiresAt?: Date
    ): Promise<SocialAccount | null> {
        return await this.update(accountId, {
            access_token: newAccessToken,
            token_expires_at: expiresAt,
        } as any);
    }
}
