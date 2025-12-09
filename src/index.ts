import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { connectToDatabase } from "./config/database";
import { userRoutes } from "./routes/user.routes";
import { socialAccountRoutes } from "./routes/social-account.routes";
import { trendRoutes } from "./routes/trend.routes";
import { postRoutes } from "./routes/post.routes";
import { pricingRoutes } from "./routes/pricing.routes";
import { paymentRoutes } from "./routes/payment.routes";

/**
 * Main application instance
 */
const app = new Elysia()
    .use(
        cors({
            origin: process.env.CORS_ORIGIN || "*",
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true,
        })
    )
    .get("/", () => ({
        name: "ContentCore Backend API",
        version: "1.0.0",
        description: "Backend API built with Elysia.js and MongoDB",
        endpoints: {
            health: "/health",
            users: "/api/users",
            socialAccounts: "/api/social-accounts",
            trends: "/api/trends",
            posts: "/api/posts",
            pricing: "/api/pricing",
            payments: "/api/payments",
        },
    }))
    .get("/health", () => ({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "ContentCore Backend",
    }))
    // Register all routes
    .use(userRoutes)
    .use(socialAccountRoutes)
    .use(trendRoutes)
    .use(postRoutes)
    .use(pricingRoutes)
    .use(paymentRoutes);

const PORT = process.env.PORT || 5401;

async function startServer() {
    try {
        await connectToDatabase();
        app.listen(PORT);

        console.log(`🚀 Server is running on http://localhost:${PORT}`);
        console.log(`📝 Health check: http://localhost:${PORT}/health`);
        console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
        console.log(`🔗 Social Accounts API: http://localhost:${PORT}/api/social-accounts`);
        console.log(`📈 Trends API: http://localhost:${PORT}/api/trends`);
        console.log(`📝 Posts API: http://localhost:${PORT}/api/posts`);
        console.log(`💰 Pricing API: http://localhost:${PORT}/api/pricing`);
        console.log(`💳 Payments API: http://localhost:${PORT}/api/payments`);
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();

export default app;
