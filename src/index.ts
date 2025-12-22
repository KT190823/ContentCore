import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import 'dotenv/config';

// Import routes
import { postsRoutes } from './routes/posts';
import { cronRoutes, startScheduler } from './routes/cron';
import { userRoutes } from './routes/user';
import { keywordsRoutes } from './routes/keywords';
import { dashboardRoutes } from './routes/dashboard';
import { pricingRoutes } from './routes/pricing';

const PORT = process.env.PORT || 5444;

const app = new Elysia()
  // Add CORS support
  .use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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
        { name: 'Posts', description: 'Posts management endpoints' },
        { name: 'Cron', description: 'Scheduled jobs endpoints' },
        { name: 'User', description: 'User management endpoints' },
        { name: 'Keywords', description: 'Keywords management endpoints' }
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
      .use(postsRoutes)
      .use(cronRoutes)
      .use(userRoutes)
      .use(keywordsRoutes)
      .use(dashboardRoutes)
      .use(pricingRoutes)
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
  
  .listen(PORT);

console.log(`
🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}

📚 API Documentation: http://localhost:${PORT}/swagger
🏥 Health Check: http://localhost:${PORT}/

Available Routes:
  - GET    /api/posts
  - POST   /api/posts
  - GET    /api/posts/:id
  - PATCH  /api/posts/:id
  - DELETE /api/posts/:id
  - GET    /api/cron/publish-scheduled
  - POST   /api/cron/publish-scheduled
  - POST   /api/cron/start-scheduler
  - POST   /api/cron/stop-scheduler
  - GET    /api/user
  - PATCH  /api/user
  - GET    /api/keywords
  - POST   /api/keywords
  - DELETE /api/keywords/:id
`);

// Start automatic scheduler (runs every 10 seconds)
console.log('⏰ Starting automatic scheduler for scheduled posts...');
startScheduler();
console.log('✅ Scheduler started successfully (checks every 10 seconds)\n');