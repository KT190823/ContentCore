import { Elysia, t } from "elysia";
import { UserService } from "../services/user.service";

/**
 * Lazy initialization of userService to ensure database is connected
 */
let userServiceInstance: UserService | null = null;
const getUserService = () => {
    if (!userServiceInstance) {
        userServiceInstance = new UserService();
    }
    return userServiceInstance;
};

/**
 * User routes - Ví dụ CRUD endpoints
 */
export const userRoutes = new Elysia({ prefix: "/api/users" })
    // Get all users
    .get("/", async () => {
        const users = await getUserService().findAll();
        return {
            success: true,
            data: users,
            total: users.length,
        };
    })

    // Get user by ID
    .get("/:id", async ({ params, set }) => {
        const user = await getUserService().findById(params.id);
        if (!user) {
            set.status = 404;
            return { success: false, message: "User not found" };
        }
        return {
            success: true,
            data: user,
        };
    })

    // Create new user
    .post(
        "/",
        async ({ body, set }) => {
            try {
                const user = await getUserService().createUser(body);
                return {
                    success: true,
                    data: user,
                    message: "User created successfully",
                };
            } catch (err: any) {
                set.status = 400;
                return {
                    success: false,
                    message: err.message || "Failed to create user",
                };
            }
        },
        {
            body: t.Object({
                name: t.String({ minLength: 1 }),
                email: t.String({ format: "email" }),
                age: t.Optional(t.Number({ minimum: 0 })),
            }),
        }
    )

    // Update user
    .put(
        "/:id",
        async ({ params, body, set }) => {
            const user = await getUserService().update(params.id, body);
            if (!user) {
                set.status = 404;
                return { success: false, message: "User not found" };
            }
            return {
                success: true,
                data: user,
                message: "User updated successfully",
            };
        },
        {
            body: t.Object({
                name: t.Optional(t.String({ minLength: 1 })),
                email: t.Optional(t.String({ format: "email" })),
                age: t.Optional(t.Number({ minimum: 0 })),
                isActive: t.Optional(t.Boolean()),
            }),
        }
    )

    // Delete user
    .delete("/:id", async ({ params, set }) => {
        const deleted = await getUserService().delete(params.id);
        if (!deleted) {
            set.status = 404;
            return { success: false, message: "User not found" };
        }
        return {
            success: true,
            message: "User deleted successfully",
        };
    })

    // Get active users
    .get("/active/list", async () => {
        const users = await getUserService().getActiveUsers();
        return {
            success: true,
            data: users,
            total: users.length,
        };
    })

    // Get user by email
    .get("/email/:email", async ({ params, set }) => {
        const user = await getUserService().getUserByEmail(params.email);
        if (!user) {
            set.status = 404;
            return { success: false, message: "User not found" };
        }
        return {
            success: true,
            data: user,
        };
    });

