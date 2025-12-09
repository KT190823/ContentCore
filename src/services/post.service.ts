import { BaseService } from "./base.service";
import type { Post } from "../models/post.model";
import { PostRepository } from "../repositories/post.repository";
import type { ObjectId } from "mongodb";
import type { PostStatusType } from "../models/post.model";
import type { CreateModel } from "../models/base.model";

/**
 * Post Service
 */
export class PostService extends BaseService<Post> {
    private postRepository: PostRepository;

    constructor() {
        const postRepository = new PostRepository();
        super(postRepository);
        this.postRepository = postRepository;
    }

    /**
     * Get posts by user ID
     */
    async getByUserId(userId: string | ObjectId): Promise<Post[]> {
        return await this.postRepository.findByUserId(userId);
    }

    /**
     * Get posts by trend ID
     */
    async getByTrendId(trendId: string | ObjectId): Promise<Post[]> {
        return await this.postRepository.findByTrendId(trendId);
    }

    /**
     * Get posts by status
     */
    async getByStatus(status: PostStatusType): Promise<Post[]> {
        return await this.postRepository.findByStatus(status);
    }

    /**
     * Create post with AI risk assessment
     */
    async createPost(data: CreateModel<Post>): Promise<Post> {
        // Here you could add AI risk assessment logic
        // For now, we'll just set a default risk score if not provided
        const postData = {
            ...data,
            ai_risk_score: data.ai_risk_score ?? 0,
            status: data.status ?? "draft" as PostStatusType,
        };

        return await this.create(postData);
    }

    /**
     * Get high risk posts
     */
    async getHighRiskPosts(threshold: number = 0.7): Promise<Post[]> {
        return await this.postRepository.findHighRiskPosts(threshold);
    }

    /**
     * Update post status
     */
    async updateStatus(postId: string | ObjectId, status: PostStatusType): Promise<Post | null> {
        return await this.update(postId, { status } as any);
    }

    /**
     * Count user posts
     */
    async countByUser(userId: string | ObjectId): Promise<number> {
        return await this.postRepository.countByUser(userId);
    }
}
