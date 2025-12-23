import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { BaseService } from './base.service';

export class UserService extends BaseService {
    protected modelName = 'user';

    // Custom method: get profile by email (not standard CRUD)
    static async getProfileByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
                credit: true,
                creditUsed: true,
                capacity: true,
                capacityUsed: true,
                pricingPlanId: true,
                pricingPlan: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        currency: true,
                        credit: true,
                        capacity: true,
                        features: true
                    }
                },
                channels: {
                    select: {
                        id: true,
                        platform: true,
                        channelId: true,
                        channelName: true,
                        channelImage: true,
                        createdAt: true
                    }
                }
            }
        });
    }

    // Custom method: update profile
    static async updateProfile(email: string, data: { name?: string; image?: string; password?: string }) {
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.image !== undefined) updateData.image = data.image;
        if (data.password !== undefined) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        return await prisma.user.update({
            where: { email },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
                credit: true,
                creditUsed: true,
                capacity: true,
                capacityUsed: true
            }
        });
    }

    // Custom method: register user
    static async register(data: { email: string; password?: string; name?: string; image?: string }) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;

        const freePlan = await prisma.pricingPlan.findFirst({
            where: { name: 'free' }
        });

        return await prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                image: data.image,
                password: hashedPassword,
                pricingPlanId: freePlan?.id,
                credit: freePlan?.credit || 0,
                capacity: freePlan?.capacity || 0,
                status: 'ACTIVE'
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            }
        });
    }

    // Custom method: use credits
    static async useCredits(userId: string, amount: number, input: string, output: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const available = user.credit - user.creditUsed;
        if (available < amount) {
            throw new Error('Insufficient credits');
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                creditUsed: { increment: amount }
            }
        });

        await prisma.generateHistory.create({
            data: {
                userId,
                input,
                output,
                credit: amount,
                status: 'SUCCESS'
            }
        });

        return { success: true, remaining: available - amount };
    }

    // Custom method: add storage
    static async addStorage(userId: string, sizeInMB: number) {
        return await prisma.user.update({
            where: { id: userId },
            data: {
                capacity: { increment: sizeInMB }
            },
            select: {
                id: true,
                capacity: true,
                capacityUsed: true
            }
        });
    }

    // Custom method: login
    static async login(email: string, password?: string) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                pricingPlan: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        currency: true,
                        credit: true,
                        capacity: true,
                        features: true
                    }
                }
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.password) {
            throw new Error('Invalid credentials');
        }

        if (!password) {
            throw new Error('Password is required');
        }
        let passwordHash = await bcrypt.hash(password, 10);
        console.log("passwordHash: ", passwordHash)
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        // Helper to remove password from user object
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}
