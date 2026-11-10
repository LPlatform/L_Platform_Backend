import dotenv from 'dotenv';
dotenv.config();

import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { pool } from './db/connection.js';
import { AppError } from './lib/errors.js';

// Route imports
import { authRoutes } from './routes/auth.routes.js';
import { organizationRoutes } from './routes/organizations.routes.js';
import { userRoutes } from './routes/users.routes.js';
import { classRoutes } from './routes/classes.routes.js';
import { sectionRoutes } from './routes/sections.routes.js';
import { courseRoutes } from './routes/courses.routes.js';
import { allocationRoutes } from './routes/allocations.routes.js';
import { questionRoutes } from './routes/questions.routes.js';
import { testCaseRoutes } from './routes/test-cases.routes.js';
import { assignmentRoutes } from './routes/assignments.routes.js';
import { submissionRoutes } from './routes/submissions.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { auditRoutes } from './routes/audit.routes.js';
import { invitationRoutes } from './routes/invitations.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';
import { reportRoutes } from './routes/reports.routes.js';

const app = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Security & utility plugins
await app.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

await app.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production-long-random-string',
});

await app.register(helmet, {
  contentSecurityPolicy: false, // Allow Swagger UI
});

await app.register(rateLimit, {
  max: 1000,
  timeWindow: '1 minute',
});

// Swagger / OpenAPI documentation
await app.register(swagger, {
  openapi: {
    info: {
      title: 'L_Platform REST API',
      description: 'Educational programming platform multi-tenant API',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
});

await app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
});

// Health & readiness
app.get('/health', async () => {
  return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
});

app.get('/ready', async (request, reply) => {
  try {
    await pool.query('SELECT 1');
    return { status: 'ready', database: 'connected' };
  } catch (err: any) {
    reply.status(503);
    return { status: 'not ready', database: 'disconnected', error: err.message };
  }
});

// Register API modules
await app.register(authRoutes);
await app.register(organizationRoutes);
await app.register(userRoutes);
await app.register(classRoutes);
await app.register(sectionRoutes);
await app.register(courseRoutes);
await app.register(allocationRoutes);
await app.register(questionRoutes);
await app.register(testCaseRoutes);
await app.register(assignmentRoutes);
await app.register(submissionRoutes);
await app.register(dashboardRoutes);
await app.register(auditRoutes);
await app.register(invitationRoutes);
await app.register(settingsRoutes);
await app.register(reportRoutes);

// Global error handler
app.setErrorHandler((error: any, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }

  request.log.error(error);
  return reply.status(error.statusCode || 500).send({
    code: error.code || 'INTERNAL_ERROR',
    message: error.message || 'An unexpected error occurred',
  });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

export async function startServer() {
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`L_Platform Backend running on http://${HOST}:${PORT}`);
    console.log(`OpenAPI documentation: http://${HOST}:${PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  startServer();
}

export default app;
