import { BaseService } from "./base.service";
import type { Config } from "../models/config.model";
import { ConfigRepository } from "../repositories/config.repository";
import { ObjectId } from "mongodb";
import type { CreateModel } from "../models/base.model";

/**
 * Config Service
 */
export class ConfigService extends BaseService<Config> {
    private configRepository: ConfigRepository;

    constructor() {
        const configRepository = new ConfigRepository();
        super(configRepository);
        this.configRepository = configRepository;
    }

    /**
     * Get config by user ID
     */
    async getByUserId(userId: string | ObjectId): Promise<Config | null> {
        return await this.configRepository.findByUserId(userId);
    }

    /**
     * Create or update user config
     */
    async upsertConfig(userId: string | ObjectId, configData: Partial<Config>): Promise<Config> {
        const existing = await this.getByUserId(userId);

        if (existing) {
            // Update existing config
            const updated = await this.update(existing._id!, configData as any);
            if (!updated) {
                throw new Error("Failed to update config");
            }
            return updated;
        } else {
            // Create new config
            const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
            return await this.create({
                user_id: objectId,
                target_regions: [],
                industry_niche: "",
                ...configData,
            } as CreateModel<Config>);
        }
    }

    /**
     * Update notification settings
     */
    async updateNotificationSettings(
        userId: string | ObjectId,
        notificationSettings: Config["notification_settings"]
    ): Promise<Config | null> {
        const config = await this.getByUserId(userId);
        if (!config) {
            throw new Error("Config not found");
        }

        return await this.update(config._id!, {
            notification_settings: notificationSettings,
        } as any);
    }
}
