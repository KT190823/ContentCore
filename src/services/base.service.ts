import { prisma } from '../utils/prisma';

export abstract class BaseService<T = any> {
    protected abstract modelName: string;

    async getAll(where?: any, options?: { take?: number; skip?: number; orderBy?: any; include?: any }) {
        const model = (prisma as any)[this.modelName];
        return await model.findMany({
            where: where || {},
            take: options?.take,
            skip: options?.skip,
            orderBy: options?.orderBy || { createdAt: 'desc' },
            include: options?.include
        });
    }

    async get(id: string, include?: any) {
        const model = (prisma as any)[this.modelName];
        return await model.findUnique({
            where: { id },
            include
        });
    }

    async create(data: any, include?: any) {
        if (!data) {
            throw new Error('Data is required for create operation');
        }

        const model = (prisma as any)[this.modelName];
        return await model.create({
            data,
            include
        });
    }

    async update(id: string, data: any, include?: any) {
        if (!data) {
            throw new Error('Data is required for update operation');
        }

        const model = (prisma as any)[this.modelName];

        // Check if record exists before updating
        const existing = await model.findUnique({ where: { id } });
        if (!existing) {
            throw new Error(`${this.modelName} with id ${id} not found`);
        }

        return await model.update({
            where: { id },
            data,
            include
        });
    }

    async delete(id: string) {
        const model = (prisma as any)[this.modelName];

        // Check if record exists before deleting
        const existing = await model.findUnique({ where: { id } });
        if (!existing) {
            throw new Error(`${this.modelName} with id ${id} not found`);
        }

        return await model.delete({
            where: { id }
        });
    }
}
