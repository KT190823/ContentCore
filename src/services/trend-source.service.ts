import { BaseService } from "./base.service";
import type { TrendSource } from "../models/trend-source.model";
import { TrendSourceRepository } from "../repositories/trend-source.repository";
import type { ObjectId } from "mongodb";
import type { SourcePlatformType } from "../models/trend-source.model";

/**
 * Trend Source Service
 */
export class TrendSourceService extends BaseService<TrendSource> {
    private trendSourceRepository: TrendSourceRepository;

    constructor() {
        const trendSourceRepository = new TrendSourceRepository();
        super(trendSourceRepository);
        this.trendSourceRepository = trendSourceRepository;
    }

    /**
     * Get sources by trend ID
     */
    async getByTrendId(trendId: string | ObjectId): Promise<TrendSource[]> {
        return await this.trendSourceRepository.findByTrendId(trendId);
    }

    /**
     * Get sources by platform
     */
    async getByPlatform(platform: SourcePlatformType): Promise<TrendSource[]> {
        return await this.trendSourceRepository.findByPlatform(platform);
    }

    /**
     * Get recent sources
     */
    async getRecentSources(hours: number = 24): Promise<TrendSource[]> {
        return await this.trendSourceRepository.findRecentSources(hours);
    }

    /**
     * Get sources by sentiment
     */
    async getBySentiment(
        minSentiment: number = -1,
        maxSentiment: number = 1
    ): Promise<TrendSource[]> {
        return await this.trendSourceRepository.findBySentimentRange(minSentiment, maxSentiment);
    }
}
