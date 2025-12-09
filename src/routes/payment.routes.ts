import { Elysia, t } from "elysia";
import { PaymentHistoryService } from "../services/payment-history.service";
import { ObjectId } from "mongodb";

let paymentHistoryServiceInstance: PaymentHistoryService | null = null;
const getPaymentHistoryService = () => {
    if (!paymentHistoryServiceInstance) {
        paymentHistoryServiceInstance = new PaymentHistoryService();
    }
    return paymentHistoryServiceInstance;
};

/**
 * Payment routes
 */
export const paymentRoutes = new Elysia({ prefix: "/api/payments" })
    // Get payments by user
    .get("/user/:userId", async ({ params }) => {
        const payments = await getPaymentHistoryService().getByUserId(params.userId);
        return {
            success: true,
            data: payments,
        };
    })

    // Record payment
    .post(
        "/",
        async ({ body, set }) => {
            try {
                const payment = await getPaymentHistoryService().recordPayment({
                    user_id: new ObjectId(body.user_id),
                    sub_id: new ObjectId(body.sub_id),
                    plan_id: new ObjectId(body.plan_id),
                    amount: body.amount,
                    currency: body.currency,
                    payment_method: body.payment_method as any,
                    transaction_time: new Date(),
                    status: (body.status || "pending") as any,
                    transaction_id: body.transaction_id,
                });
                return {
                    success: true,
                    data: payment,
                    message: "Payment recorded successfully",
                };
            } catch (err: any) {
                set.status = 400;
                return {
                    success: false,
                    message: err.message || "Failed to record payment",
                };
            }
        },
        {
            body: t.Object({
                user_id: t.String(),
                sub_id: t.String(),
                plan_id: t.String(),
                amount: t.Number(),
                currency: t.String(),
                payment_method: t.String(),
                status: t.Optional(t.String()),
                transaction_id: t.Optional(t.String()),
            }),
        }
    )

    // Get revenue report
    .get("/revenue", async ({ query }) => {
        const startDate = query.start_date ? new Date(query.start_date) : undefined;
        const endDate = query.end_date ? new Date(query.end_date) : undefined;

        if (!startDate || !endDate) {
            const total = await getPaymentHistoryService().getTotalRevenue();
            return {
                success: true,
                data: { total },
            };
        }

        const report = await getPaymentHistoryService().getRevenueReport(startDate, endDate);
        return {
            success: true,
            data: report,
        };
    });
