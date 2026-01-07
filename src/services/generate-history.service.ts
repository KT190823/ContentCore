import { prisma } from '../utils/prisma';
import { GenerateStatus } from '../../generated/prisma/client';
import { BaseService } from './base.service';

export class GenerateHistoryService extends BaseService {
    protected modelName = 'generateHistory';

    // Get all generate history for a user
    static async getAll(userId: string, options?: {
        status?: GenerateStatus;
        limit?: number;
        offset?: number;
    }) {
        const where: any = { userId };

        if (options?.status) {
            where.status = options.status;
        }

        return await prisma.generateHistory.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 50,
            skip: options?.offset || 0,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        });
    }

    // Get a single generate history by ID
    static async get(id: string) {
        return await prisma.generateHistory.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        });
    }

    // Create a new generate history
    static async create(data: {
        userId: string;
        input: string;
        output: string;
        credit: number;
        status?: GenerateStatus;
        errorMessage?: string;
    }) {
        return await prisma.generateHistory.create({
            data: {
                userId: data.userId,
                input: data.input,
                output: data.output,
                credit: data.credit,
                status: data.status || 'SUCCESS',
                errorMessage: data.errorMessage
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        });
    }

    // Update a generate history
    static async update(id: string, data: {
        input?: string;
        output?: string;
        credit?: number;
        status?: GenerateStatus;
        errorMessage?: string;
    }) {
        const updateData: any = {};

        if (data.input !== undefined) updateData.input = data.input;
        if (data.output !== undefined) updateData.output = data.output;
        if (data.credit !== undefined) updateData.credit = data.credit;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.errorMessage !== undefined) updateData.errorMessage = data.errorMessage;

        return await prisma.generateHistory.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            }
        });
    }

    // Delete a generate history
    static async delete(id: string, userId: string) {
        // Verify ownership
        const history = await prisma.generateHistory.findUnique({
            where: { id }
        });

        if (!history) {
            throw new Error('Generate history not found');
        }

        if (history.userId !== userId) {
            throw new Error('Unauthorized to delete this generate history');
        }

        return await prisma.generateHistory.delete({
            where: { id }
        });
    }

    // Get statistics for a user
    static async getStats(userId: string) {
        const [total, successful, failed, totalCreditsUsed] = await Promise.all([
            prisma.generateHistory.count({
                where: { userId }
            }),
            prisma.generateHistory.count({
                where: { userId, status: 'SUCCESS' }
            }),
            prisma.generateHistory.count({
                where: { userId, status: 'FAILED' }
            }),
            prisma.generateHistory.aggregate({
                where: { userId },
                _sum: {
                    credit: true
                }
            })
        ]);

        return {
            total,
            successful,
            failed,
            totalCreditsUsed: totalCreditsUsed._sum.credit || 0
        };
    }
}
