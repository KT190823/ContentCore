import { BaseRepository } from "./base.repository";
import type { TrendSource } from "../models/trend-source.model";
import { getDatabase } from "../config/database";
import { ObjectId, type Filter } from "mongodb";
import type { SourcePlatformType } from "../models/trend-source.model";

/**
 * Trend Source Repository
 */
export class TrendSourceRepository extends BaseRepository<TrendSource> {
    constructor() {
        const db = getDatabase();
        super(db.collection<TrendSource>("trend_sources"));
    }

    /**
     * Find sources by trend ID
     */
    async findByTrendId(trendId: string | ObjectId): Promise<TrendSource[]> {
        const objectId = typeof trendId === "string" ? new ObjectId(trendId) : trendId;
        return await this.findAll(
            { trend_id: objectId } as Filter<TrendSource>,
            { sort: { crawled_at: -1 } }
        );
    }

    /**
     * Find sources by platform
     */
    async findByPlatform(platform: SourcePlatformType): Promise<TrendSource[]> {
        return await this.findAll(
            { platform } as Filter<TrendSource>,
            { sort: { crawled_at: -1 } }
        );
    }

    /**
     * Find sources by trend and platform
     */
    async findByTrendAndPlatform(
        trendId: string | ObjectId,
        platform: SourcePlatformType
    ): Promise<TrendSource[]> {
        const objectId = typeof trendId === "string" ? new ObjectId(trendId) : trendId;
        return await this.findAll({
            trend_id: objectId,
            platform,
        } as Filter<TrendSource>);
    }

    /**
     * Find sources by sentiment range
     */
    async findBySentimentRange(
        minSentiment: number,
        maxSentiment: number
    ): Promise<TrendSource[]> {
        return await this.findAll({
            sentiment_score: { $gte: minSentiment, $lte: maxSentiment },
        } as any);
    }

    /**
     * Find recent sources
     */
    async findRecentSources(hours: number = 24): Promise<TrendSource[]> {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);
        return await this.findAll(
            { crawled_at: { $gte: since } } as any,
            { sort: { crawled_at: -1 } }
        );
    }
}
