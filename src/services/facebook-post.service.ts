import { prisma } from '../utils/prisma';
import { PostStatus } from '../../generated/prisma/client';
import { BaseService } from './base.service';

export class FacebookPostService extends BaseService {
    protected modelName = 'facebookPost';

    // Override getAll with custom logic
    static async getAll(userId: string, status?: string) {
        const where: any = { userId };
        if (status) {
            where.status = status as PostStatus;
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
        const instance = new FacebookPostService();
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
        content?: string;
        imageUrl?: string;
        videoUrl?: string;
        status?: PostStatus;
        scheduledAt?: string;
    }) {
        return await prisma.facebookPost.create({
            data: {
                userId: data.userId,
                title: data.title,
                content: data.content,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
                status: data.status || 'draft',
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
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
        content?: string;
        imageUrl?: string;
        videoUrl?: string;
        status?: PostStatus;
        scheduledAt?: string;
        facebookPostId?: string;
    }) {
        const updateData: any = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.content !== undefined) updateData.content = data.content;
        if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
        if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
        if (data.status !== undefined) updateData.status = data.status;
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
