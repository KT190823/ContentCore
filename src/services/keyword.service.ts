import { prisma } from '../utils/prisma';
import { BaseService } from './base.service';

export class KeywordService extends BaseService {
    protected modelName = 'keyword';

    // Override getAll with custom logic
    static async getAll(userId: string) {
        return await prisma.keyword.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Override create with custom logic
    static async create(userId: string, keyword: string, category?: string) {
        return await prisma.keyword.create({
            data: {
                userId,
                keyword,
                category: category || 'general'
            }
        });
    }
}
