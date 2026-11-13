import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../lib/errors.js';
import {
  clearReleaseCache,
  downloadRoutes,
  pickAsset,
  versionOf,
  type Release,
} from '../../routes/downloads.routes.js';

const release: Release = {
  tag_name: 'app-v0.3.0',
  published_at: '2026-11-13T10:00:00Z',
  assets: [
    {
      id: 1,
      name: 'L_Platform.Student_0.3.0_x64-setup.exe',
      size: 10,
      browser_download_url: 'https://dl/exe',
    },
    {
      id: 2,
      name: 'L_Platform.Student_0.3.0_x64_en-US.msi',
      size: 11,
      browser_download_url: 'https://dl/msi',
    },
    {
      id: 3,
      name: 'L_Platform.Student_0.3.0_universal.dmg',
      size: 12,
      browser_download_url: 'https://dl/dmg',
    },
    {
      id: 4,
      name: 'L_Platform.Student_0.3.0_amd64.AppImage',
      size: 13,
      browser_download_url: 'https://dl/appimage',
    },
    { id: 5, name: 'SHA256SUMS-windows-x64.txt', size: 1, browser_download_url: 'https://dl/sums' },
  ],
};

async function buildApp() {
  const app = Fastify();
  app.setErrorHandler((error, _req, reply) => {
    const status = error instanceof AppError ? error.statusCode : 500;
    void reply.status(status).send({ message: error instanceof Error ? error.message : 'error' });
  });
  await app.register(downloadRoutes);
  return app;
}

describe('downloads', () => {
  beforeEach(() => {
    clearReleaseCache();
    delete process.env.GITHUB_RELEASES_TOKEN;
  });
  afterEach(() => vi.unstubAllGlobals());

  it('maps each platform to the right installer', () => {
    expect(pickAsset(release, 'windows')?.id).toBe(1);
    expect(pickAsset(release, 'windows-msi')?.id).toBe(2);
    expect(pickAsset(release, 'macos')?.id).toBe(3);
    expect(pickAsset(release, 'linux')?.id).toBe(4);
    expect(pickAsset(release, 'linux-deb')).toBeNull();
    expect(versionOf('app-v0.3.0')).toBe('0.3.0');
  });

  it('returns metadata without exposing repository URLs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(release), { status: 200 })),
    );
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/downloads/latest' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.version).toBe('0.3.0');
    expect(body.platforms.macos.fileName).toContain('.dmg');
    expect(res.payload).not.toContain('github');
    expect(res.payload).not.toContain('https://dl/');
  });

  it('redirects to a signed URL for private repos (token stays server-side)', async () => {
    process.env.GITHUB_RELEASES_TOKEN = 'test-token';
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/releases/latest')) return new Response(JSON.stringify(release));
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
      return new Response(null, {
        status: 302,
        headers: { location: 'https://signed.example/file' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/downloads/latest/windows' });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('https://signed.example/file');
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/releases/assets/1');
  });

  it('404s unknown platforms and 503s when GitHub is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 })),
    );
    const app = await buildApp();
    expect((await app.inject({ url: '/api/downloads/latest/amiga' })).statusCode).toBe(404);
    expect((await app.inject({ url: '/api/downloads/latest/windows' })).statusCode).toBe(503);
  });
});
