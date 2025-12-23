import { Elysia, t } from 'elysia';
import { UserService } from '../services';
import { tokenHelper } from '../utils/token';

export const authRoutes = new Elysia({ prefix: '/auth' })
    // LOGIN
    .post('/login', async ({ body, set }) => {
        try {
            const { email, password } = body;
            const user = await UserService.login(email, password);

            // Generate token
            const token = tokenHelper.generateToken(user);

            return {
                user,
                token
            };
        } catch (error) {
            console.error('Error logging in:', error);
            const errorMessage = (error as Error).message;

            if (errorMessage === 'User not found' || errorMessage === 'Invalid credentials') {
                set.status = 401;
                return {
                    error: 'Invalid email or password'
                };
            }

            set.status = 500;
            return {
                error: 'Failed to login'
            };
        }
    }, {
        body: t.Object({
            email: t.String(),
            password: t.String()
        })
    })

    // REGISTER
    .post('/register', async ({ body, set }) => {
        try {
            const user = await UserService.register(body);

            // Generate token
            const token = tokenHelper.generateToken(user);

            set.status = 201;
            return {
                user,
                token
            };
        } catch (error) {
            console.error('Error registering user:', error);
            set.status = 400;
            return {
                error: (error as Error).message || 'Failed to register'
            };
        }
    }, {
        body: t.Object({
            email: t.String(),
            password: t.Optional(t.String()),
            name: t.Optional(t.String()),
            image: t.Optional(t.String())
        })
    });
