import { Elysia, t } from 'elysia';
import { CronJob } from '../jobs/cron.job';

// Start automatic scheduler (exported for use in index.ts)
export const startScheduler = () => CronJob.startScheduler();
export const stopScheduler = () => CronJob.stopScheduler();

// Routes
export const cronRoutes = new Elysia({ prefix: '/cron' })
  // GET endpoint for manual trigger or external cron
  .get('/publish-scheduled', async ({ headers }) => {
    return await CronJob.publishScheduledPosts(headers.authorization);
  })

  // POST endpoint for manual trigger
  .post('/publish-scheduled', async ({ headers }) => {
    return await CronJob.publishScheduledPosts(headers.authorization);
  })

  // Start scheduler endpoint
  .post('/start-scheduler', ({ headers }) => {
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';

    if (headers.authorization !== `Bearer ${cronSecret}`) {
      return {
        error: 'Unauthorized',
        status: 401
      };
    }

    CronJob.startScheduler();
    return {
      success: true,
      message: 'Scheduler started (runs every 10 seconds)'
    };
  })

  // Stop scheduler endpoint
  .post('/stop-scheduler', ({ headers }) => {
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';

    if (headers.authorization !== `Bearer ${cronSecret}`) {
      return {
        error: 'Unauthorized',
        status: 401
      };
    }

    CronJob.stopScheduler();
    return {
      success: true,
      message: 'Scheduler stopped'
    };
  });
