import { BaseService } from "./base.service";
import type { User } from "../models/user.model";
import { UserRepository } from "../repositories/user.repository";

/**
 * Ví dụ User Service extends từ BaseService
 */
export class UserService extends BaseService<User> {
    private userRepository: UserRepository;

    constructor() {
        const userRepository = new UserRepository();
        super(userRepository);
        this.userRepository = userRepository;
    }

    /**
     * Business logic: Lấy user theo email
     */
    async getUserByEmail(email: string): Promise<User | null> {
        return await this.userRepository.findByEmail(email);
    }

    /**
     * Business logic: Lấy danh sách users active
     */
    async getActiveUsers(): Promise<User[]> {
        return await this.userRepository.findActiveUsers();
    }

    /**
     * Business logic: Tạo user mới với validation
     */
    async createUser(data: { name: string; email: string; age?: number }): Promise<User> {
        // Validate: check email đã tồn tại
        const existingUser = await this.getUserByEmail(data.email);
        if (existingUser) {
            throw new Error("Email already exists");
        }

        // Tạo user mới
        return await this.create({
            ...data,
            isActive: true,
        } as any);
    }
}
