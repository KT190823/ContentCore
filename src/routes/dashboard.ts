import { Elysia, t } from 'elysia';
import { DashboardService } from '../services';

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
  .post('/summary', async ({ body }) => {
    try {
      const { userId, email } = body;

      const summary = await DashboardService.getSummary(userId, email);
      return summary;

    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      return {
        error: 'Failed to fetch dashboard summary',
        status: 500
      };
    }
  }, {
    body: t.Object({
      userId: t.Optional(t.String()),
      email: t.Optional(t.String())
    })
  });
