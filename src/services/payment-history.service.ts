import { BaseService } from "./base.service";
import type { PaymentHistory } from "../models/payment-history.model";
import { PaymentHistoryRepository } from "../repositories/payment-history.repository";
import type { ObjectId } from "mongodb";
import type { PaymentStatusType } from "../models/payment-history.model";

/**
 * Payment History Service
 */
export class PaymentHistoryService extends BaseService<PaymentHistory> {
    private paymentHistoryRepository: PaymentHistoryRepository;

    constructor() {
        const paymentHistoryRepository = new PaymentHistoryRepository();
        super(paymentHistoryRepository);
        this.paymentHistoryRepository = paymentHistoryRepository;
    }

    /**
     * Get payments by user ID
     */
    async getByUserId(userId: string | ObjectId): Promise<PaymentHistory[]> {
        return await this.paymentHistoryRepository.findByUserId(userId);
    }

    /**
     * Get payments by subscription ID
     */
    async getBySubscriptionId(subId: string | ObjectId): Promise<PaymentHistory[]> {
        return await this.paymentHistoryRepository.findBySubscriptionId(subId);
    }

    /**
     * Get payments by status
     */
    async getByStatus(status: PaymentStatusType): Promise<PaymentHistory[]> {
        return await this.paymentHistoryRepository.findByStatus(status);
    }

    /**
     * Record payment
     */
    async recordPayment(paymentData: Omit<PaymentHistory, "_id" | "createAt" | "updateAt">): Promise<PaymentHistory> {
        return await this.create(paymentData);
    }

    /**
     * Update payment status
     */
    async updatePaymentStatus(
        paymentId: string | ObjectId,
        status: PaymentStatusType,
        transactionId?: string
    ): Promise<PaymentHistory | null> {
        const updateData: any = { status };
        if (transactionId) {
            updateData.transaction_id = transactionId;
        }
        return await this.update(paymentId, updateData);
    }

    /**
     * Process refund
     */
    async processRefund(
        paymentId: string | ObjectId,
        refundAmount: number
    ): Promise<PaymentHistory | null> {
        return await this.update(paymentId, {
            status: "refunded" as PaymentStatusType,
            refund_amount: refundAmount,
            refund_date: new Date(),
        } as any);
    }

    /**
     * Get total revenue
     */
    async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
        return await this.paymentHistoryRepository.getTotalRevenue(startDate, endDate);
    }

    /**
     * Get revenue report
     */
    async getRevenueReport(startDate: Date, endDate: Date): Promise<{
        total: number;
        count: number;
        average: number;
    }> {
        const payments = await this.paymentHistoryRepository.findByDateRange(startDate, endDate);
        const completed = payments.filter(p => p.status === "completed");
        const total = completed.reduce((sum, p) => sum + p.amount, 0);

        return {
            total,
            count: completed.length,
            average: completed.length > 0 ? total / completed.length : 0,
        };
    }

    /**
     * Get failed payments
     */
    async getFailedPayments(): Promise<PaymentHistory[]> {
        return await this.paymentHistoryRepository.findFailedPayments();
    }
}
