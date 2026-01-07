import { prisma } from '../utils/prisma';
import { PostStatus, VideoType } from '../../generated/prisma/client';
import { BaseService } from './base.service';

export class PostFacebookService extends BaseService {
    protected modelName = 'postFacebook';

    // Override getAll with custom logic
    static async getAll(userId: string, status?: string) {
        const where: any = { userId };
        if (status) {
            where.processStatus = status as PostStatus;
        }

        return await prisma.postFacebook.findMany({
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
        channelId?: string;
        title: string;
        description?: string;
        thumbnailUrl?: string;
        uploadedUrls?: string[];
        videoType?: VideoType;
        status?: PostStatus;
        scheduledAt?: string;
        tags?: string[];
    }) {
        return await prisma.postFacebook.create({
            data: {
                userId: data.userId,
                channelId: data.channelId,
                title: data.title,
                description: data.description,
                thumbnailUrl: data.thumbnailUrl,
                uploadedUrls: data.uploadedUrls || [],
                videoType: data.videoType,
                processStatus: data.status || 'draft',
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
                // Automatically set publishedAt when creating with 'published' status
                publishedAt: data.status === 'published' ? new Date() : null,
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
        channelId?: string;
        title?: string;
        description?: string;
        thumbnailUrl?: string;
        uploadedUrls?: string[];
        videoType?: VideoType;
        status?: PostStatus;
        scheduledAt?: string;
        tags?: string[];
        facebookPostId?: string;
    }) {
        const updateData: any = {};

        if (data.channelId !== undefined) updateData.channelId = data.channelId;
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
        if (data.uploadedUrls !== undefined) updateData.uploadedUrls = data.uploadedUrls;
        if (data.videoType !== undefined) updateData.videoType = data.videoType;
        if (data.status !== undefined) {
            updateData.processStatus = data.status;
            // Automatically set publishedAt when status changes to 'published'
            if (data.status === 'published') {
                updateData.publishedAt = new Date();
            }
        }
        if (data.tags !== undefined) updateData.tags = data.tags;
        if (data.facebookPostId !== undefined) updateData.facebookPostId = data.facebookPostId;
        if (data.scheduledAt !== undefined) {
            updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
        }

        return await prisma.postFacebook.update({
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
