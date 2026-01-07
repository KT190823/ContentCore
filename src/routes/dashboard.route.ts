import { Elysia } from 'elysia';
import { DashboardService } from '../services';
import { UserHelper } from '../utils/user-helper';

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
  .post('/summary', async (context) => {
    try {
      const { user } = await UserHelper.fromContext(context);

      const summary = await DashboardService.getSummary(user.id, user.email);
      return summary;

    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard summary',
        status: 500
      };
    }
  });
