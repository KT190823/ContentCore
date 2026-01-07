import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import 'dotenv/config';

// Import routes
import { youtubePostsRoutes } from './routes/youtube-posts.route';
import { userRoutes } from './routes/user.route';
import { keywordsRoutes } from './routes/keywords.route';
import { dashboardRoutes } from './routes/dashboard.route';
import { pricingRoutes } from './routes/pricing.route';
import { pricingHistoryRoutes } from './routes/pricing-history.route';
import { facebookPostsRoutes } from './routes/post-facebook.route';
import { channelsRoutes } from './routes/channels.route';
import { trendingRoutes } from './routes/trending.route';
import { aiRoutes } from './routes/ai.route';
import { generateHistoryRoutes } from './routes/generate-history.route';
import { authRoutes } from './routes/auth.route';
import { authMiddleware } from './middlewares/auth';

// Import cron job for automatic scheduling
import { CronJob } from './jobs/cron.job';

const PORT = process.env.PORT || 3000;

const app = new Elysia()
  // Add CORS support
  .use(cors({
    origin: process.env.WEBAPP_URI,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'a-token']
  }))

  // Add Swagger documentation
  .use(swagger({
    documentation: {
      info: {
        title: 'Zenith Social YouTube Manager API',
        version: '1.0.0',
        description: 'Backend API for managing YouTube content and scheduled posts'
      },
      tags: [
        { name: 'YouTube Posts', description: 'YouTube posts management endpoints' },
        { name: 'Facebook Posts', description: 'Facebook posts management endpoints' },
        { name: 'User', description: 'User management endpoints' },
        { name: 'Keywords', description: 'Keywords management endpoints' },
        { name: 'Generate History', description: 'AI generation history endpoints' }
      ]
    }
  }))

  // Health check endpoint
  .get('/', () => ({
    message: 'Zenith Social YouTube Manager API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  }))

  // API routes
  .group('/api', (app) =>
    app
      .use(authRoutes)
      .group('', (app) =>
        app
          .use(authMiddleware)
          .onBeforeHandle(({ user, set }: { user: any, set: any }) => {
            if (!user) {
              set.status = 401;
              return { error: 'Unauthorized: Invalid or missing token' };
            }
          })
          .use(youtubePostsRoutes)
          .use(userRoutes)
          .use(keywordsRoutes)
          .use(dashboardRoutes)
          .use(pricingRoutes)
          .use(pricingHistoryRoutes)
          .use(facebookPostsRoutes)
          .use(channelsRoutes)
          .use(trendingRoutes)
          .use(aiRoutes)
          .use(generateHistoryRoutes)
      )
  )

  // Error handling
  .onError(({ code, error, set }) => {
    console.error('Error:', error);

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: 'Route not found' };
    }

    if (code === 'VALIDATION') {
      set.status = 400;
      return { error: 'Validation error', details: error.message };
    }

    set.status = 500;
    return { error: 'Internal server error' };
  })

  .listen({
    port: PORT as number,
    hostname: '0.0.0.0'
  });

console.log(`
🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}

📚 API Documentation: http://localhost:${PORT}/swagger
🏥 Health Check: http://localhost:${PORT}/
`);

// Start automatic scheduler (runs every 10 seconds)
console.log('⏰ Starting automatic scheduler for scheduled posts...');
CronJob.startScheduler();
console.log('✅ Scheduler started successfully (checks every 10 seconds)\n');