import { Elysia, t } from "elysia";
import { PostService } from "../services/post.service";
import { PostScheduleService } from "../services/post-schedule.service";
import { ObjectId } from "mongodb";

let postServiceInstance: PostService | null = null;
const getPostService = () => {
    if (!postServiceInstance) {
        postServiceInstance = new PostService();
    }
    return postServiceInstance;
};

let postScheduleServiceInstance: PostScheduleService | null = null;
const getPostScheduleService = () => {
    if (!postScheduleServiceInstance) {
        postScheduleServiceInstance = new PostScheduleService();
    }
    return postScheduleServiceInstance;
};

/**
 * Post routes
 */
export const postRoutes = new Elysia({ prefix: "/api/posts" })
    // Get all posts
    .get("/", async () => {
        const posts = await getPostService().findAll();
        return {
            success: true,
            data: posts,
            total: posts.length,
        };
    })

    // Get posts by user
    .get("/user/:userId", async ({ params }) => {
        const posts = await getPostService().getByUserId(params.userId);
        return {
            success: true,
            data: posts,
        };
    })

    // Get post by ID
    .get("/:id", async ({ params, set }) => {
        const post = await getPostService().findById(params.id);
        if (!post) {
            set.status = 404;
            return { success: false, message: "Post not found" };
        }
        return {
            success: true,
            data: post,
        };
    })

    // Create post
    .post(
        "/",
        async ({ body, set }) => {
            try {
                const post = await getPostService().createPost({
                    user_id: new ObjectId(body.user_id),
                    content_text: body.content_text,
                    trend_id: body.trend_id ? new ObjectId(body.trend_id) : undefined,
                    media_url: body.media_url,
                    ai_risk_score: body.ai_risk_score || 0,
                    status: (body.status || "draft") as any,
                });
                return {
                    success: true,
                    data: post,
                    message: "Post created successfully",
                };
            } catch (err: any) {
                set.status = 400;
                return {
                    success: false,
                    message: err.message || "Failed to create post",
                };
            }
        },
        {
            body: t.Object({
                user_id: t.String(),
                content_text: t.String({ minLength: 1 }),
                trend_id: t.Optional(t.String()),
                media_url: t.Optional(t.String()),
                ai_risk_score: t.Optional(t.Number()),
                status: t.Optional(t.String()),
            }),
        }
    )

    // Schedule post
    .post(
        "/:id/schedule",
        async ({ params, body, set }) => {
            try {
                const schedule = await getPostScheduleService().schedulePost({
                    post_id: new ObjectId(params.id),
                    account_id: new ObjectId(body.account_id),
                    scheduled_time: new Date(body.scheduled_time),
                    post_status: "pending" as any,
                    ai_optimized_time: body.ai_optimized_time || false,
                });
                return {
                    success: true,
                    data: schedule,
                    message: "Post scheduled successfully",
                };
            } catch (err: any) {
                set.status = 400;
                return {
                    success: false,
                    message: err.message || "Failed to schedule post",
                };
            }
        },
        {
            body: t.Object({
                account_id: t.String(),
                scheduled_time: t.String(),
                ai_optimized_time: t.Optional(t.Boolean()),
            }),
        }
    )

    // Get schedules for a post
    .get("/:id/schedules", async ({ params }) => {
        const schedules = await getPostScheduleService().getByPostId(params.id);
        return {
            success: true,
            data: schedules,
        };
    })

    // Get upcoming schedules
    .get("/schedules/upcoming", async ({ query }) => {
        const limit = query.limit ? parseInt(query.limit) : 10;
        const schedules = await getPostScheduleService().getUpcoming(limit);
        return {
            success: true,
            data: schedules,
        };
    });
