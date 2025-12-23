import { Elysia } from 'elysia';
import { tokenHelper } from '../utils/token';

export const authMiddleware = (app: Elysia) =>
    app.derive(({ headers, set }) => {
        const token = headers['a-token'];

        if (!token) {
            return { user: null };
        }

        const payload = tokenHelper.verifyToken(token);

        if (!payload) {
            return { user: null };
        }

        return { user: payload };
    })
        .macro(({ onBeforeHandle }) => ({
            isAuth(enabled: boolean) {
                if (!enabled) return;

                onBeforeHandle(({ user, set }: { user: any, set: any }) => {
                    if (!user) {
                        set.status = 401;
                        return { error: 'Unauthorized: Invalid or missing token' };
                    }
                });
            }
        }));
