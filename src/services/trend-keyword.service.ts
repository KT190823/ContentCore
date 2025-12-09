import { BaseService } from "./base.service";
import type { TrendKeyword } from "../models/trend-keyword.model";
import { TrendKeywordRepository } from "../repositories/trend-keyword.repository";
import type { ObjectId } from "mongodb";

/**
 * Trend Keyword Service
 */
export class TrendKeywordService extends BaseService<TrendKeyword> {
    private trendKeywordRepository: TrendKeywordRepository;

    constructor() {
        const trendKeywordRepository = new TrendKeywordRepository();
        super(trendKeywordRepository);
        this.trendKeywordRepository = trendKeywordRepository;
    }

    /**
     * Get keywords by trend ID
     */
    async getByTrendId(trendId: string | ObjectId): Promise<TrendKeyword[]> {
        return await this.trendKeywordRepository.findByTrendId(trendId);
    }

    /**
     * Get top keywords for a trend
     */
    async getTopKeywordsByTrend(
        trendId: string | ObjectId,
        limit: number = 10
    ): Promise<TrendKeyword[]> {
        return await this.trendKeywordRepository.findTopKeywordsByTrend(trendId, limit);
    }

    /**
     * Get fast-growing keywords
     */
    async getFastGrowingKeywords(minGrowthRate: number = 50): Promise<TrendKeyword[]> {
        return await this.trendKeywordRepository.findByGrowthRate(minGrowthRate);
    }

    /**
     * Search keywords
     */
    async searchKeywords(searchText: string): Promise<TrendKeyword[]> {
        return await this.trendKeywordRepository.searchByText(searchText);
    }
}
