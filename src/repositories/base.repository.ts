import { Collection, ObjectId, type Filter, type FindOptions, type Document } from "mongodb";
import type { BaseModel, CreateModel, UpdateModel } from "../models/base.model";

/**
 * Base Repository với CRUD operations
 */
export class BaseRepository<T extends BaseModel> {
    protected collection: Collection<T>;

    constructor(collection: Collection<T>) {
        this.collection = collection;
    }

    /**
     * Tạo document mới
     */
    async create(data: CreateModel<T>): Promise<T> {
        const now = new Date();
        const document = {
            ...data,
            createAt: now,
            updateAt: now,
        } as any;

        const result = await this.collection.insertOne(document);
        return {
            ...document,
            _id: result.insertedId,
        } as T;
    }

    /**
     * Tìm document theo ID
     */
    async findById(id: string | ObjectId): Promise<T | null> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        return await this.collection.findOne({ _id: objectId } as Filter<T>) as T | null;
    }

    /**
     * Tìm tất cả documents với filter và options
     */
    async findAll(
        filter: Filter<T> = {},
        options: FindOptions<T> = {}
    ): Promise<T[]> {
        return await this.collection.find(filter, options).toArray() as T[];
    }

    /**
     * Tìm một document với filter
     */
    async findOne(filter: Filter<T>): Promise<T | null> {
        return await this.collection.findOne(filter) as T | null;
    }

    /**
     * Đếm số lượng documents
     */
    async count(filter: Filter<T> = {}): Promise<number> {
        return await this.collection.countDocuments(filter);
    }

    /**
     * Cập nhật document theo ID
     */
    async update(
        id: string | ObjectId,
        data: UpdateModel<T>
    ): Promise<T | null> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        const updateData = {
            ...data,
            updateAt: new Date(),
        };

        const result = await this.collection.findOneAndUpdate(
            { _id: objectId } as Filter<T>,
            { $set: updateData as Partial<T> },
            { returnDocument: "after" }
        );

        return (result || null) as T | null;
    }

    /**
     * Xóa document theo ID
     */
    async delete(id: string | ObjectId): Promise<boolean> {
        const objectId = typeof id === "string" ? new ObjectId(id) : id;
        const result = await this.collection.deleteOne({ _id: objectId } as Filter<T>);
        return result.deletedCount > 0;
    }

    /**
     * Xóa nhiều documents
     */
    async deleteMany(filter: Filter<T>): Promise<number> {
        const result = await this.collection.deleteMany(filter);
        return result.deletedCount;
    }
}
