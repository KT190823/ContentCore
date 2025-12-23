import { tokenHelper } from './token';

export class UserHelper {
    /**
     * Extract and verify user from request context
     * @param context - Elysia request context
     * @returns User object from token
     * @throws Error if token is invalid or missing
     */
    static async fromContext(context: any): Promise<{ user: any }> {
        const token = context.headers['a-token'];

        if (!token) {
            throw new Error('Authentication token is required');
        }

        const payload = tokenHelper.verifyToken(token);

        if (!payload) {
            throw new Error('Invalid or expired token');
        }

        return { user: payload };
    }

    /**
     * Extract user ID from context
     * @param context - Elysia request context
     * @returns User ID string
     */
    static async getUserId(context: any): Promise<string> {
        const { user } = await this.fromContext(context);

        if (!user.id) {
            throw new Error('User ID not found in token');
        }

        return user.id;
    }

    /**
     * Check if user is authenticated (optional check, doesn't throw)
     * @param context - Elysia request context
     * @returns true if authenticated, false otherwise
     */
    static async isAuthenticated(context: any): Promise<boolean> {
        try {
            await this.fromContext(context);
            return true;
        } catch {
            return false;
        }
    }
}
