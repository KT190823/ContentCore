import type { BaseModel } from "./base.model";
import type { ObjectId } from "mongodb";

/**
 * Payment status types
 */
export type PaymentStatusType = "completed" | "failed" | "pending" | "refunded" | "cancelled";

/**
 * Payment method types
 */
export type PaymentMethodType = "bank_transfer" | "momo" | "zalopay" | "credit_card" | "vnpay";

/**
 * Payment History model - Payment transaction records
 * Collection: PAYMENT_HISTORY
 */
export interface PaymentHistory extends BaseModel {
    user_id: ObjectId;                  // Foreign key to USERS
    sub_id: ObjectId;                   // Foreign key to USER_SUBSCRIPTIONS
    plan_id: ObjectId;                  // Foreign key to PRICING_PLANS
    amount: number;                     // Payment amount
    currency: string;                   // Currency code (e.g., "VND", "USD")
    payment_method: PaymentMethodType;  // Payment method used
    transaction_time: Date;             // When transaction occurred
    status: PaymentStatusType;          // Transaction status
    transaction_id?: string;            // External transaction ID
    invoice_number?: string;            // Invoice number
    refund_amount?: number;             // Refund amount (if applicable)
    refund_date?: Date;                 // Refund date (if applicable)
}
