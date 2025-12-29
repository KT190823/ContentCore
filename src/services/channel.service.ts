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
        channelName?: string;
        channelImage?: string;
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: Date;
    }) {
        // We use a composite unique key/logic. 
        // The schema has @@unique([userId, platform, channelId])
        // Only provided fields will be updated, others will be kept as-is

        // Build update object with only provided fields
        const updateData: any = { status: 'ACTIVE' };
        if (data.channelName !== undefined) updateData.channelName = data.channelName;
        if (data.channelImage !== undefined) updateData.channelImage = data.channelImage;
        if (data.accessToken !== undefined) updateData.accessToken = data.accessToken;
        if (data.refreshToken !== undefined) updateData.refreshToken = data.refreshToken;
        if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;

        // Build create object with all fields
        const createData: any = {
            userId: data.userId,
            platform: data.platform,
            channelId: data.channelId,
            channelName: data.channelName || '',
            user: { connect: { id: data.userId } },
            status: 'ACTIVE'
        };
        if (data.channelImage !== undefined) createData.channelImage = data.channelImage;
        if (data.accessToken !== undefined) createData.accessToken = data.accessToken;
        if (data.refreshToken !== undefined) createData.refreshToken = data.refreshToken;
        if (data.expiresAt !== undefined) createData.expiresAt = data.expiresAt;

        return await prisma.channel.upsert({
            where: {
                userId_platform_channelId: {
                    userId: data.userId,
                    platform: data.platform,
                    channelId: data.channelId
                }
            },
            create: createData,
            update: updateData
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
