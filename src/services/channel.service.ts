import { prisma } from '../utils/prisma';
import { Status } from '../../generated/prisma/client';
import { BaseService } from './base.service';

export class ChannelService extends BaseService {
    protected modelName = 'channel';

    // Custom method: upsert (not part of standard CRUD)
    static async upsert(data: {
        userId: string;
        platform: string;
        channelId: string;
        channelName: string;
        channelImage?: string;
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: Date;
    }) {
        // We use a composite unique key/logic. 
        // The schema has @@unique([userId, platform, channelId])

        return await prisma.channel.upsert({
            where: {
                userId_platform_channelId: {
                    userId: data.userId,
                    platform: data.platform,
                    channelId: data.channelId
                }
            },
            create: {
                userId: data.userId,
                platform: data.platform,
                channelId: data.channelId,
                channelName: data.channelName,
                channelImage: data.channelImage,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                expiresAt: data.expiresAt,
                status: 'ACTIVE'
            },
            update: {
                channelName: data.channelName,
                channelImage: data.channelImage,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                expiresAt: data.expiresAt,
                status: 'ACTIVE'
            }
        });
    }

    // Override delete with custom authorization logic
    static async delete(id: string, userId: string) {
        // Ensure user owns the channel
        const channel = await prisma.channel.findUnique({
            where: { id }
        });

        if (!channel || channel.userId !== userId) {
            throw new Error('Channel not found or unauthorized');
        }

        return await prisma.channel.delete({
            where: { id }
        });
    }
}
