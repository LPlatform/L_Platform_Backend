import './load-env.js';

import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import { pool } from './db/connection.js';
import { runWithRlsContext, type RlsContext } from './db/rls-context.js';
import { getAllowedCorsOrigins, getCookieSecret } from './lib/env.js';
import { AppError } from './lib/errors.js';
import { resolveTokenUser } from './middleware/auth.js';

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
import { learningRoutes } from './routes/learning.routes.js';
import { assessmentRoutes } from './routes/assessment.routes.js';
import { lmsRoutes } from './routes/lms.routes.js';
import { downloadRoutes } from './routes/downloads.routes.js';

const app = fastify({
  // Behind Vercel / the Next.js proxy, use X-Forwarded-For for client IP (rate limiting).
  trustProxy: process.env.TRUST_PROXY === 'true' || Boolean(process.env.VERCEL),
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Security & utility plugins
const allowedCorsOrigins = new Set(getAllowedCorsOrigins());
await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin || allowedCorsOrigins.has(origin)) {
      cb(null, true);
      return;
    }
    const corsError = new Error('Origin not allowed by CORS policy') as Error & {
      statusCode?: number;
    };
    corsError.statusCode = 403;
    cb(corsError, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

await app.register(cookie, {
  secret: getCookieSecret(),
});

app.addHook('onRequest', (request, _reply, done) => {
  let token: string | undefined;
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (request.cookies?.access_token) {
    token = request.cookies.access_token;
  }

  const enter = (ctx: RlsContext) => runWithRlsContext(ctx, () => done());
  if (!token) {
    enter({ userId: null, role: null, organizationId: null, systemContext: null });
    return;
  }

  resolveTokenUser(token).then(
    (payload) => {
      if (payload) {
        request.user = payload;
        enter({
          userId: payload.userId,
          role: payload.role,
          organizationId: payload.organizationId,
          systemContext: null,
        });
      } else {
        enter({ userId: null, role: null, organizationId: null, systemContext: null });
      }
    },
    () => enter({ userId: null, role: null, organizationId: null, systemContext: null }),
  );
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

// Interactive docs UI is skipped on Vercel: its static-file dependency cannot load there.
if (!process.env.VERCEL) {
  const { default: swaggerUi } = await import('@fastify/swagger-ui');
  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });
}

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
await app.register(learningRoutes);
await app.register(assessmentRoutes);
await app.register(lmsRoutes);
await app.register(downloadRoutes);

// Global error handler
app.setErrorHandler((error: unknown, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }

  const errObj = error as { statusCode?: number; code?: string; message?: string };
  const statusCode = errObj.statusCode && errObj.statusCode >= 400 ? errObj.statusCode : 500;
  request.log.error(error);

  const isProd500 = process.env.NODE_ENV === 'production' && statusCode >= 500;
  return reply.status(statusCode).send({
    code: errObj.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    message: isProd500
      ? 'An unexpected internal error occurred'
      : errObj.message || 'An unexpected error occurred',
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

if (
  !process.env.VERCEL &&
  (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js'))
) {
  startServer();
}

export default app;
