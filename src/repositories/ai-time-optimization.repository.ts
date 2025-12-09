import { BaseRepository } from "./base.repository";
import type { AiTimeOptimization } from "../models/ai-time-optimization.model";
import { getDatabase } from "../config/database";
import { ObjectId, type Filter } from "mongodb";

/**
 * AI Time Optimization Repository
 */
export class AiTimeOptimizationRepository extends BaseRepository<AiTimeOptimization> {
    constructor() {
        const db = getDatabase();
        super(db.collection<AiTimeOptimization>("ai_time_optimization"));
    }

    /**
     * Find optimization by account ID
     */
    async findByAccountId(accountId: string | ObjectId): Promise<AiTimeOptimization | null> {
        const objectId = typeof accountId === "string" ? new ObjectId(accountId) : accountId;
        return await this.findOne({ account_id: objectId } as Filter<AiTimeOptimization>);
    }

    /**
     * Find all optimizations sorted by update date
     */
    async findAllSorted(): Promise<AiTimeOptimization[]> {
        return await this.findAll({}, { sort: { updated_at: -1 } });
    }

    /**
     * Find optimizations with high confidence
     */
    async findHighConfidence(minConfidence: number = 0.7): Promise<AiTimeOptimization[]> {
        return await this.findAll(
            { confidence_score: { $gte: minConfidence } } as any,
            { sort: { confidence_score: -1 } }
        );
    }

    /**
     * Find stale optimizations
     */
    async findStale(daysOld: number = 30): Promise<AiTimeOptimization[]> {
        const staleDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
        return await this.findAll({ updated_at: { $lt: staleDate } } as any);
    }
}
