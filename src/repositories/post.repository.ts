import { BaseRepository } from "./base.repository";
import type { Post } from "../models/post.model";
import { getDatabase } from "../config/database";
import { ObjectId, type Filter } from "mongodb";
import type { PostStatusType } from "../models/post.model";

/**
 * Post Repository
 */
export class PostRepository extends BaseRepository<Post> {
    constructor() {
        const db = getDatabase();
        super(db.collection<Post>("posts"));
    }

    /**
     * Find posts by user ID
     */
    async findByUserId(userId: string | ObjectId): Promise<Post[]> {
        const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
        return await this.findAll(
            { user_id: objectId } as Filter<Post>,
            { sort: { createAt: -1 } }
        );
    }

    /**
     * Find posts by trend ID
     */
    async findByTrendId(trendId: string | ObjectId): Promise<Post[]> {
        const objectId = typeof trendId === "string" ? new ObjectId(trendId) : trendId;
        return await this.findAll(
            { trend_id: objectId } as Filter<Post>,
            { sort: { createAt: -1 } }
        );
    }

    /**
     * Find posts by status
     */
    async findByStatus(status: PostStatusType): Promise<Post[]> {
        return await this.findAll(
            { status } as Filter<Post>,
            { sort: { createAt: -1 } }
        );
    }

    /**
     * Find posts by user and status
     */
    async findByUserAndStatus(
        userId: string | ObjectId,
        status: PostStatusType
    ): Promise<Post[]> {
        const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
        return await this.findAll({
            user_id: objectId,
            status,
        } as Filter<Post>);
    }

    /**
     * Find posts with high AI risk
     */
    async findHighRiskPosts(threshold: number = 0.7): Promise<Post[]> {
        return await this.findAll(
            { ai_risk_score: { $gte: threshold } } as any,
            { sort: { ai_risk_score: -1 } }
        );
    }

    /**
     * Count posts by user
     */
    async countByUser(userId: string | ObjectId): Promise<number> {
        const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
        return await this.count({ user_id: objectId } as Filter<Post>);
    }
}
