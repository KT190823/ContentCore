import { ObjectId } from "mongodb";

/**
 * Base model interface với các trường mặc định
 */
export interface BaseModel {
    _id?: ObjectId;
    createAt: Date;
    updateAt: Date;
}

/**
 * Type để tạo model mới (không bao gồm _id và timestamps)
 */
export type CreateModel<T extends BaseModel> = Omit<T, '_id' | 'createAt' | 'updateAt'>;

/**
 * Type để update model (partial và không bao gồm _id, createAt)
 */
export type UpdateModel<T extends BaseModel> = Partial<Omit<T, '_id' | 'createAt' | 'updateAt'>>;
