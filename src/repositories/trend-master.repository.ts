import { BaseRepository } from "./base.repository";
import type { TrendMaster } from "../models/trend-master.model";
import { getDatabase } from "../config/database";
import type { Filter } from "mongodb";

/**
 * Trend Master Repository
 */
export class TrendMasterRepository extends BaseRepository<TrendMaster> {
    constructor() {
        const db = getDatabase();
        super(db.collection<TrendMaster>("trends_master"));
    }

    /**
     * Find trends by app ID
     */
    async findByAppId(appId: string): Promise<TrendMaster[]> {
        return await this.findAll(
            { app_id: appId } as Filter<TrendMaster>,
            { sort: { trend_score: -1 } }
        );
    }

    /**
     * Find top trends by score
     */
    async findTopTrends(limit: number = 10, appId?: string): Promise<TrendMaster[]> {
        const filter = appId ? ({ app_id: appId } as Filter<TrendMaster>) : {};
        return await this.findAll(filter, {
            sort: { trend_score: -1 },
            limit,
        });
    }

    /**
     * Find trends by date range
     */
    async findByDateRange(startDate: Date, endDate?: Date): Promise<TrendMaster[]> {
        const filter: any = {
            start_time: { $gte: startDate },
        };
        if (endDate) {
            filter.start_time.$lte = endDate;
        }
        return await this.findAll(filter, { sort: { start_time: -1 } });
    }

    /**
     * Find trends by category
     */
    async findByCategory(category: string): Promise<TrendMaster[]> {
        return await this.findAll(
            { category } as Filter<TrendMaster>,
            { sort: { trend_score: -1 } }
        );
    }

    /**
     * Find trends above score threshold
     */
    async findAboveScore(minScore: number, appId?: string): Promise<TrendMaster[]> {
        const filter: any = { trend_score: { $gte: minScore } };
        if (appId) {
            filter.app_id = appId;
        }
        return await this.findAll(filter, { sort: { trend_score: -1 } });
    }
}
