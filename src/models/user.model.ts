import type { BaseModel } from "./base.model";

/**
 * Ví dụ User model extends từ BaseModel
 */
export interface User extends BaseModel {
    name: string;
    email: string;
    age?: number;
    isActive?: boolean;
}
