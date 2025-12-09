import { BaseRepository } from "./base.repository";
import type { User } from "../models/user.model";
import { getDatabase } from "../config/database";

/**
 * Ví dụ User Repository extends từ BaseRepository
 */
export class UserRepository extends BaseRepository<User> {
    constructor() {
        const db = getDatabase();
        super(db.collection<User>("users"));
    }

    /**
     * Custom method: Tìm user theo email
     */
    async findByEmail(email: string): Promise<User | null> {
        return await this.findOne({ email } as any);
    }

    /**
     * Custom method: Tìm users đang active
     */
    async findActiveUsers(): Promise<User[]> {
        return await this.findAll({ isActive: true } as any);
    }
}
