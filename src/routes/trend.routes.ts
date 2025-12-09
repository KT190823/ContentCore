import { Elysia, t } from "elysia";
import { TrendMasterService } from "../services/trend-master.service";

let trendMasterServiceInstance: TrendMasterService | null = null;
const getTrendMasterService = () => {
    if (!trendMasterServiceInstance) {
        trendMasterServiceInstance = new TrendMasterService();
    }
    return trendMasterServiceInstance;
};

/**
 * Trend routes
 */
export const trendRoutes = new Elysia({ prefix: "/api/trends" })
    // Get top trends
    .get("/top", async ({ query }) => {
        const limit = query.limit ? parseInt(query.limit) : 10;
        const appId = query.app_id;
        const trends = await getTrendMasterService().getTopTrends(limit, appId);
        return {
            success: true,
            data: trends,
            total: trends.length,
        };
    })

    // Get hot trends (above threshold)
    .get("/hot", async ({ query }) => {
        const minScore = query.min_score ? parseFloat(query.min_score) : 70;
        const appId = query.app_id;
        const trends = await getTrendMasterService().getHotTrends(minScore, appId);
        return {
            success: true,
            data: trends,
            total: trends.length,
        };
    })

    // Get trend by ID
    .get("/:id", async ({ params, set }) => {
        const trend = await getTrendMasterService().findById(params.id);
        if (!trend) {
            set.status = 404;
            return { success: false, message: "Trend not found" };
        }
        return {
            success: true,
            data: trend,
        };
    })

    // Get trends by category
    .get("/category/:category", async ({ params }) => {
        const trends = await getTrendMasterService().getByCategory(params.category);
        return {
            success: true,
            data: trends,
        };
    });
