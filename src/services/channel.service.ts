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
        // Check if channel already exists
        const existingChannel = await prisma.channel.findUnique({
            where: {
                userId_platform_channelId: {
                    userId: data.userId,
                    platform: data.platform,
                    channelId: data.channelId
                }
            }
        });

        const channelData: any = {
            userId: data.userId,
            platform: data.platform,
            channelId: data.channelId,
            status: 'ACTIVE' as Status
        };

        if (data.channelName !== undefined) channelData.channelName = data.channelName;
        if (data.channelImage !== undefined) channelData.channelImage = data.channelImage;
        if (data.accessToken !== undefined) channelData.accessToken = data.accessToken;
        if (data.refreshToken !== undefined) channelData.refreshToken = data.refreshToken;
        if (data.expiresAt !== undefined) channelData.expiresAt = data.expiresAt;

        if (existingChannel) {
            // Update existing channel
            return await prisma.channel.update({
                where: { id: existingChannel.id },
                data: channelData
            });
        } else {
            // Create new channel
            // Ensure default channelName if missing for creation
            if (!channelData.channelName) channelData.channelName = '';

            return await prisma.channel.create({
                data: channelData
            });
        }
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
