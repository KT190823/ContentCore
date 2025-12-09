import { BaseService } from "./base.service";
import type { AiTimeOptimization } from "../models/ai-time-optimization.model";
import { AiTimeOptimizationRepository } from "../repositories/ai-time-optimization.repository";
import { ObjectId } from "mongodb";
import type { BestTime } from "../models/ai-time-optimization.model";

/**
 * AI Time Optimization Service
 */
export class AiTimeOptimizationService extends BaseService<AiTimeOptimization> {
    private aiTimeOptimizationRepository: AiTimeOptimizationRepository;

    constructor() {
        const aiTimeOptimizationRepository = new AiTimeOptimizationRepository();
        super(aiTimeOptimizationRepository);
        this.aiTimeOptimizationRepository = aiTimeOptimizationRepository;
    }

    /**
     * Get optimization by account ID
     */
    async getByAccountId(accountId: string | ObjectId): Promise<AiTimeOptimization | null> {
        return await this.aiTimeOptimizationRepository.findByAccountId(accountId);
    }

    /**
     * Update best times for an account
     */
    async updateBestTimes(
        accountId: string | ObjectId,
        bestTimes: BestTime[],
        sampleSize?: number,
        confidenceScore?: number
    ): Promise<AiTimeOptimization> {
        const existing = await this.getByAccountId(accountId);
        const objectId = typeof accountId === "string" ? new ObjectId(accountId) : accountId;

        if (existing) {
            const updated = await this.update(existing._id!, {
                best_times: bestTimes,
                updated_at: new Date(),
                sample_size: sampleSize,
                confidence_score: confidenceScore,
            } as any);

            if (!updated) {
                throw new Error("Failed to update optimization");
            }
            return updated;
        } else {
            return await this.create({
                account_id: objectId,
                best_times: bestTimes,
                updated_at: new Date(),
                sample_size: sampleSize,
                confidence_score: confidenceScore,
            });
        }
    }

    /**
     * Get best posting time for an account
     */
    async getBestPostingTime(accountId: string | ObjectId): Promise<BestTime | null> {
        const optimization = await this.getByAccountId(accountId);
        if (!optimization || !optimization.best_times || optimization.best_times.length === 0) {
            return null;
        }

        // Return the time with highest engagement score
        return optimization.best_times.reduce((best, current) =>
            current.engagement_score > best.engagement_score ? current : best
        );
    }

    /**
     * Get high confidence optimizations
     */
    async getHighConfidence(minConfidence: number = 0.7): Promise<AiTimeOptimization[]> {
        return await this.aiTimeOptimizationRepository.findHighConfidence(minConfidence);
    }

    /**
     * Get stale optimizations that need update
     */
    async getStaleOptimizations(daysOld: number = 30): Promise<AiTimeOptimization[]> {
        return await this.aiTimeOptimizationRepository.findStale(daysOld);
    }
}
