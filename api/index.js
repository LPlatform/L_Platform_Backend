// Vercel serverless entry: reuses the compiled Fastify app from `pnpm build` (dist/).
import app from '../dist/index.js';

export default async function handler(req, res) {
  await app.ready();
  app.server.emit('request', req, res);
}
