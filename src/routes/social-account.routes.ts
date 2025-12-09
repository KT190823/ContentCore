import { Elysia, t } from "elysia";
import { SocialAccountService } from "../services/social-account.service";
import { ObjectId } from "mongodb";

let socialAccountServiceInstance: SocialAccountService | null = null;
const getSocialAccountService = () => {
    if (!socialAccountServiceInstance) {
        socialAccountServiceInstance = new SocialAccountService();
    }
    return socialAccountServiceInstance;
};

/**
 * Social Account routes
 */
export const socialAccountRoutes = new Elysia({ prefix: "/api/social-accounts" })
    // Get all social accounts
    .get("/", async () => {
        const accounts = await getSocialAccountService().findAll();
        return {
            success: true,
            data: accounts,
            total: accounts.length,
        };
    })

    // Get accounts by user
    .get("/user/:userId", async ({ params, set }) => {
        try {
            const accounts = await getSocialAccountService().getByUserId(params.userId);
            return {
                success: true,
                data: accounts,
            };
        } catch (err: any) {
            set.status = 400;
            return { success: false, message: err.message };
        }
    })

    // Get active accounts by user
    .get("/user/:userId/active", async ({ params, set }) => {
        try {
            const accounts = await getSocialAccountService().getActiveAccountsByUser(params.userId);
            return {
                success: true,
                data: accounts,
            };
        } catch (err: any) {
            set.status = 400;
            return { success: false, message: err.message };
        }
    })

    // Connect new social account
    .post(
        "/",
        async ({ body, set }) => {
            try {
                const account = await getSocialAccountService().connectAccount({
                    user_id: new ObjectId(body.user_id),
                    platform: body.platform as any,
                    platform_page_id: body.platform_page_id,
                    access_token: body.access_token,
                    is_active: true,
                });
                return {
                    success: true,
                    data: account,
                    message: "Account connected successfully",
                };
            } catch (err: any) {
                set.status = 400;
                return {
                    success: false,
                    message: err.message || "Failed to connect account",
                };
            }
        },
        {
            body: t.Object({
                user_id: t.String(),
                platform: t.String(),
                platform_page_id: t.String(),
                access_token: t.String(),
            }),
        }
    )

    // Disconnect account
    .delete("/:id", async ({ params, set }) => {
        try {
            const success = await getSocialAccountService().disconnectAccount(params.id);
            return {
                success,
                message: success ? "Account disconnected" : "Failed to disconnect account",
            };
        } catch (err: any) {
            set.status = 400;
            return { success: false, message: err.message };
        }
    });
