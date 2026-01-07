import { Elysia, t } from 'elysia';
import { GenerateHistoryService } from '../services';
import { UserHelper } from '../utils/user-helper';

export const generateHistoryRoutes = new Elysia({ prefix: '/generate-history' })
    // GET all generate history
    .get('/', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const { status, limit, offset } = context.query;

            const history = await GenerateHistoryService.getAll(user.id, {
                status: status as any,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined
            });

            return history;
        } catch (error) {
            console.error('Error fetching generate history:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to fetch generate history',
                status: 500
            };
        }
    }, {
        query: t.Object({
            status: t.Optional(t.Enum({
                SUCCESS: 'SUCCESS',
                FAILED: 'FAILED'
            })),
            limit: t.Optional(t.String()),
            offset: t.Optional(t.String())
        })
    })

    // GET statistics
    .get('/stats', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const stats = await GenerateHistoryService.getStats(user.id);
            return stats;
        } catch (error) {
            console.error('Error fetching generate history stats:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to fetch generate history stats',
                status: 500
            };
        }
    })

    // CREATE a new generate history
    .post('/', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const { input, output, credit, status, errorMessage } = context.body;

            if (!input || !output || credit === undefined) {
                return {
                    error: 'Input, output, and credit are required',
                    status: 400
                };
            }

            const history = await GenerateHistoryService.create({
                userId: user.id,
                input,
                output,
                credit,
                status,
                errorMessage
            });

            return history;
        } catch (error) {
            console.error('Error creating generate history:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to create generate history',
                status: 500
            };
        }
    }, {
        body: t.Object({
            input: t.String(),
            output: t.String(),
            credit: t.Number(),
            status: t.Optional(t.Enum({
                SUCCESS: 'SUCCESS',
                FAILED: 'FAILED'
            })),
            errorMessage: t.Optional(t.String())
        })
    })

    // GET a single generate history by ID
    .get('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);
            const history = await GenerateHistoryService.get(context.params.id);

            if (!history) {
                return {
                    error: 'Generate history not found',
                    status: 404
                };
            }

            // Verify ownership
            if (history.userId !== user.id) {
                return {
                    error: 'Unauthorized to access this generate history',
                    status: 403
                };
            }

            return history;
        } catch (error) {
            console.error('Error fetching generate history:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            return {
                error: 'Failed to fetch generate history',
                status: 500
            };
        }
    })

    // UPDATE a generate history
    .patch('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);

            // Check ownership first
            const existingHistory = await GenerateHistoryService.get(context.params.id);
            if (!existingHistory) {
                return {
                    error: 'Generate history not found',
                    status: 404
                };
            }

            if (existingHistory.userId !== user.id) {
                return {
                    error: 'Unauthorized to update this generate history',
                    status: 403
                };
            }

            const history = await GenerateHistoryService.update(context.params.id, context.body as any);
            return history;
        } catch (error) {
            console.error('Error updating generate history:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            if ((error as any).code === 'P2025') {
                return {
                    error: 'Generate history not found',
                    status: 404
                };
            }

            return {
                error: 'Failed to update generate history',
                status: 500
            };
        }
    }, {
        body: t.Object({
            input: t.Optional(t.String()),
            output: t.Optional(t.String()),
            credit: t.Optional(t.Number()),
            status: t.Optional(t.Enum({
                SUCCESS: 'SUCCESS',
                FAILED: 'FAILED'
            })),
            errorMessage: t.Optional(t.String())
        })
    })

    // DELETE a generate history
    .delete('/:id', async (context) => {
        try {
            const { user } = await UserHelper.fromContext(context);

            // Check ownership first
            const existingHistory = await GenerateHistoryService.get(context.params.id);
            if (!existingHistory) {
                return {
                    error: 'Generate history not found',
                    status: 404
                };
            }

            if (existingHistory.userId !== user.id) {
                return {
                    error: 'Unauthorized to delete this generate history',
                    status: 403
                };
            }

            await GenerateHistoryService.delete(context.params.id, user.id);
            return { success: true };
        } catch (error) {
            console.error('Error deleting generate history:', error);

            if ((error as Error).message.includes('token')) {
                return {
                    error: (error as Error).message,
                    status: 401
                };
            }

            if ((error as any).code === 'P2025') {
                return {
                    error: 'Generate history not found',
                    status: 404
                };
            }

            return {
                error: 'Failed to delete generate history',
                status: 500
            };
        }
    });
