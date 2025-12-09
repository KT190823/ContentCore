import { BaseRepository } from "./base.repository";
import type { PaymentHistory } from "../models/payment-history.model";
import { getDatabase } from "../config/database";
import { ObjectId, type Filter } from "mongodb";
import type { PaymentStatusType, PaymentMethodType } from "../models/payment-history.model";

/**
 * Payment History Repository
 */
export class PaymentHistoryRepository extends BaseRepository<PaymentHistory> {
    constructor() {
        const db = getDatabase();
        super(db.collection<PaymentHistory>("payment_history"));
    }

    /**
     * Find payments by user ID
     */
    async findByUserId(userId: string | ObjectId): Promise<PaymentHistory[]> {
        const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
        return await this.findAll(
            { user_id: objectId } as Filter<PaymentHistory>,
            { sort: { transaction_time: -1 } }
        );
    }

    /**
     * Find payments by subscription ID
     */
    async findBySubscriptionId(subId: string | ObjectId): Promise<PaymentHistory[]> {
        const objectId = typeof subId === "string" ? new ObjectId(subId) : subId;
        return await this.findAll(
            { sub_id: objectId } as Filter<PaymentHistory>,
            { sort: { transaction_time: -1 } }
        );
    }

    /**
     * Find payments by status
     */
    async findByStatus(status: PaymentStatusType): Promise<PaymentHistory[]> {
        return await this.findAll(
            { status } as Filter<PaymentHistory>,
            { sort: { transaction_time: -1 } }
        );
    }

    /**
     * Find payments by date range
     */
    async findByDateRange(startDate: Date, endDate: Date): Promise<PaymentHistory[]> {
        return await this.findAll(
            {
                transaction_time: { $gte: startDate, $lte: endDate },
            } as any,
            { sort: { transaction_time: -1 } }
        );
    }

    /**
     * Find payments by payment method
     */
    async findByPaymentMethod(method: PaymentMethodType): Promise<PaymentHistory[]> {
        return await this.findAll(
            { payment_method: method } as Filter<PaymentHistory>,
            { sort: { transaction_time: -1 } }
        );
    }

    /**
     * Calculate total revenue by date range
     */
    async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
        const filter: any = { status: "completed" };
        if (startDate && endDate) {
            filter.transaction_time = { $gte: startDate, $lte: endDate };
        }
        const payments = await this.findAll(filter);
        return payments.reduce((sum, payment) => sum + payment.amount, 0);
    }

    /**
     * Find failed payments that need retry
     */
    async findFailedPayments(): Promise<PaymentHistory[]> {
        return await this.findAll(
            { status: "failed" } as Filter<PaymentHistory>,
            { sort: { transaction_time: -1 } }
        );
    }
}
