import { ObjectId, type Filter, type FindOptions } from "mongodb";
import type { BaseModel, CreateModel, UpdateModel } from "../models/base.model";
import { BaseRepository } from "../repositories/base.repository";

/**
 * Base Service - Business logic layer
 */
export class BaseService<T extends BaseModel> {
    protected repository: BaseRepository<T>;

    constructor(repository: BaseRepository<T>) {
        this.repository = repository;
    }

    /**
     * Tạo document mới
     */
    async create(data: CreateModel<T>): Promise<T> {
        return await this.repository.create(data);
    }

    /**
     * Tìm document theo ID
     */
    async findById(id: string | ObjectId): Promise<T | null> {
        return await this.repository.findById(id);
    }

    /**
     * Tìm tất cả documents
     */
    async findAll(
        filter: Filter<T> = {},
        options: FindOptions<T> = {}
    ): Promise<T[]> {
        return await this.repository.findAll(filter, options);
    }

    /**
     * Tìm một document
     */
    async findOne(filter: Filter<T>): Promise<T | null> {
        return await this.repository.findOne(filter);
    }

    /**
     * Đếm số lượng documents
     */
    async count(filter: Filter<T> = {}): Promise<number> {
        return await this.repository.count(filter);
    }

    /**
     * Cập nhật document
     */
    async update(
        id: string | ObjectId,
        data: UpdateModel<T>
    ): Promise<T | null> {
        return await this.repository.update(id, data);
    }

    /**
     * Xóa document
     */
    async delete(id: string | ObjectId): Promise<boolean> {
        return await this.repository.delete(id);
    }

    /**
     * Xóa nhiều documents
     */
    async deleteMany(filter: Filter<T>): Promise<number> {
        return await this.repository.deleteMany(filter);
    }
}
