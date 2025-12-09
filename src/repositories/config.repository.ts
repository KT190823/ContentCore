import { BaseRepository } from "./base.repository";
import type { Config } from "../models/config.model";
import { getDatabase } from "../config/database";
import { ObjectId, type Filter } from "mongodb";

/**
 * Config Repository
 */
export class ConfigRepository extends BaseRepository<Config> {
    constructor() {
        const db = getDatabase();
        super(db.collection<Config>("configs"));
    }

    /**
     * Find config by user ID
     */
    async findByUserId(userId: string | ObjectId): Promise<Config | null> {
        const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
        return await this.findOne({ user_id: objectId } as Filter<Config>);
    }

    /**
     * Find configs by industry niche
     */
    async findByIndustry(industry: string): Promise<Config[]> {
        return await this.findAll({ industry_niche: industry } as Filter<Config>);
    }

    /**
     * Find configs by target region
     */
    async findByRegion(region: string): Promise<Config[]> {
        return await this.findAll({ target_regions: region } as Filter<Config>);
    }
}
