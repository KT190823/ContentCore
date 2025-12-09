import { BaseRepository } from "./base.repository";
import type { TrendKeyword } from "../models/trend-keyword.model";
import { getDatabase } from "../config/database";
import { ObjectId, type Filter } from "mongodb";

/**
 * Trend Keyword Repository
 */
export class TrendKeywordRepository extends BaseRepository<TrendKeyword> {
    constructor() {
        const db = getDatabase();
        super(db.collection<TrendKeyword>("trend_keywords"));
    }

    /**
     * Find keywords by trend ID
     */
    async findByTrendId(trendId: string | ObjectId): Promise<TrendKeyword[]> {
        const objectId = typeof trendId === "string" ? new ObjectId(trendId) : trendId;
        return await this.findAll(
            { trend_id: objectId } as Filter<TrendKeyword>,
            { sort: { frequency_count: -1 } }
        );
    }

    /**
     * Find top keywords by frequency
     */
    async findTopKeywordsByTrend(
        trendId: string | ObjectId,
        limit: number = 10
    ): Promise<TrendKeyword[]> {
        const objectId = typeof trendId === "string" ? new ObjectId(trendId) : trendId;
        return await this.findAll(
            { trend_id: objectId } as Filter<TrendKeyword>,
            {
                sort: { frequency_count: -1 },
                limit,
            }
        );
    }

    /**
     * Find keywords by growth rate
     */
    async findByGrowthRate(minGrowthRate: number): Promise<TrendKeyword[]> {
        return await this.findAll(
            { daily_growth_rate: { $gte: minGrowthRate } } as any,
            { sort: { daily_growth_rate: -1 } }
        );
    }

    /**
     * Search keywords by text
     */
    async searchByText(searchText: string): Promise<TrendKeyword[]> {
        return await this.findAll({
            keyword_text: { $regex: searchText, $options: "i" },
        } as any);
    }
}
