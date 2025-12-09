import { BaseService } from "./base.service";
import type { TrendMaster } from "../models/trend-master.model";
import { TrendMasterRepository } from "../repositories/trend-master.repository";

/**
 * Trend Master Service
 */
export class TrendMasterService extends BaseService<TrendMaster> {
    private trendMasterRepository: TrendMasterRepository;

    constructor() {
        const trendMasterRepository = new TrendMasterRepository();
        super(trendMasterRepository);
        this.trendMasterRepository = trendMasterRepository;
    }

    /**
     * Get trends by app ID
     */
    async getByAppId(appId: string): Promise<TrendMaster[]> {
        return await this.trendMasterRepository.findByAppId(appId);
    }

    /**
     * Get top trending topics
     */
    async getTopTrends(limit: number = 10, appId?: string): Promise<TrendMaster[]> {
        return await this.trendMasterRepository.findTopTrends(limit, appId);
    }

    /**
     * Get trends by date range
     */
    async getByDateRange(startDate: Date, endDate?: Date): Promise<TrendMaster[]> {
        return await this.trendMasterRepository.findByDateRange(startDate, endDate);
    }

    /**
     * Get trends by category
     */
    async getByCategory(category: string): Promise<TrendMaster[]> {
        return await this.trendMasterRepository.findByCategory(category);
    }

    /**
     * Get hot trends (above threshold)
     */
    async getHotTrends(minScore: number = 70, appId?: string): Promise<TrendMaster[]> {
        return await this.trendMasterRepository.findAboveScore(minScore, appId);
    }

    /**
     * Update trend score
     */
    async updateTrendScore(trendId: string, newScore: number): Promise<TrendMaster | null> {
        return await this.update(trendId, {
            trend_score: newScore,
            last_update: new Date(),
        } as any);
    }
}
