import { prisma } from '../utils/prisma';
import { PostStatus, VideoType } from '../../generated/prisma/client';
import { BaseService } from './base.service';

export class PostFacebookService extends BaseService {
    protected modelName = 'facebookPost';

    // Override getAll with custom logic
    static async getAll(userId: string, status?: string) {
        const where: any = { userId };
        if (status) {
            where.processStatus = status as PostStatus;
        }

        return await prisma.facebookPost.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        });
    }

    // Override get with include user info
    static async get(id: string) {
        const instance = new PostFacebookService();
        return await instance.get(id, {
            user: {
                select: {
                    name: true,
                    email: true,
                    image: true
                }
            }
        });
    }

    // Alias for backward compatibility
    static async getById(id: string) {
        return this.get(id);
    }

    // Override create with custom logic
    static async create(data: {
        userId: string;
        title: string;
        description?: string;
        thumbnailUrl?: string;
        imageUrl?: string;
        videoUrl?: string;
        videoType?: VideoType;
        status?: PostStatus;
        scheduledAt?: string;
        tags?: string[];
    }) {
        return await prisma.facebookPost.create({
            data: {
                userId: data.userId,
                title: data.title,
                description: data.description,
                thumbnailUrl: data.thumbnailUrl,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
                videoType: data.videoType,
                processStatus: data.status || 'draft',
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
                tags: data.tags || []
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        });
    }

    // Override update with custom logic
    static async update(id: string, data: {
        title?: string;
        description?: string;
        thumbnailUrl?: string;
        imageUrl?: string;
        videoUrl?: string;
        videoType?: VideoType;
        status?: PostStatus;
        scheduledAt?: string;
        tags?: string[];
        facebookPostId?: string;
    }) {
        const updateData: any = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
        if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
        if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
        if (data.videoType !== undefined) updateData.videoType = data.videoType;
        if (data.status !== undefined) updateData.processStatus = data.status;
        if (data.tags !== undefined) updateData.tags = data.tags;
        if (data.facebookPostId !== undefined) updateData.facebookPostId = data.facebookPostId;
        if (data.scheduledAt !== undefined) {
            updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
        }

        return await prisma.facebookPost.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        });
    }
}
