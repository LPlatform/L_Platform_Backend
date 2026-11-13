import type { FastifyInstance } from 'fastify';
import { AppError, Errors } from '../lib/errors.js';

/**
 * Public installer downloads backed by the desktop app's GitHub Releases.
 * The repository and the read-only token stay on the server: clients get release metadata
 * and a redirect to a short-lived signed download URL, never the token or repo internals.
 */

export const PLATFORMS = ['windows', 'windows-msi', 'macos', 'linux', 'linux-deb'] as const;
export type Platform = (typeof PLATFORMS)[number];

const MATCHERS = new Map<Platform, (name: string) => boolean>([
  ['windows', (n) => n.endsWith('-setup.exe')],
  ['windows-msi', (n) => n.endsWith('.msi')],
  ['macos', (n) => n.endsWith('.dmg')],
  ['linux', (n) => n.endsWith('.AppImage')],
  ['linux-deb', (n) => n.endsWith('.deb')],
]);

export function isPlatform(value: string): value is Platform {
  return MATCHERS.has(value as Platform);
}

export interface ReleaseAsset {
  id: number;
  name: string;
  size: number;
  browser_download_url: string;
}

export interface Release {
  tag_name: string;
  published_at: string;
  assets: ReleaseAsset[];
}

export function pickAsset(release: Release, platform: Platform): ReleaseAsset | null {
  const matches = MATCHERS.get(platform);
  if (!matches) return null;
  return release.assets.find((a) => matches(a.name)) ?? null;
}

export function versionOf(tag: string): string {
  return tag.replace(/^app-v/, '');
}

const CACHE_MS = 5 * 60 * 1000;
let cache: { at: number; release: Release } | null = null;

export function clearReleaseCache(): void {
  cache = null;
}

function config() {
  return {
    repo: process.env.GITHUB_RELEASES_REPO?.trim() || 'LPlatform/L_Platform_Application',
    token: process.env.GITHUB_RELEASES_TOKEN?.trim() || '',
  };
}

function headers(token: string, accept = 'application/vnd.github+json'): Record<string, string> {
  const h: Record<string, string> = {
    Accept: accept,
    'User-Agent': 'l-platform-downloads',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function getLatestRelease(): Promise<Release> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.release;
  const { repo, token } = config();
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: headers(token),
  });
  if (!res.ok) {
    throw new AppError(
      503,
      'DOWNLOADS_UNAVAILABLE',
      'Downloads are temporarily unavailable. Please try again later.',
    );
  }
  const release = (await res.json()) as Release;
  cache = { at: Date.now(), release };
  return release;
}

/** Resolves a URL the browser can download from without credentials. */
export async function resolveDownloadUrl(asset: ReleaseAsset): Promise<string> {
  const { repo, token } = config();
  if (!token) return asset.browser_download_url; // public repository
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/assets/${asset.id}`, {
    headers: headers(token, 'application/octet-stream'),
    redirect: 'manual',
  });
  const location = res.headers.get('location');
  if (res.status >= 300 && res.status < 400 && location) return location;
  throw new AppError(503, 'DOWNLOADS_UNAVAILABLE', 'Download link could not be created.');
}

export async function downloadRoutes(app: FastifyInstance) {
  app.get('/api/downloads/latest', async (_request, reply) => {
    const release = await getLatestRelease();
    const platforms = Object.fromEntries(
      PLATFORMS.map((p) => {
        const asset = pickAsset(release, p);
        return [p, asset ? { fileName: asset.name, sizeBytes: asset.size } : null];
      }),
    );
    reply.header('Cache-Control', 'public, max-age=300');
    return {
      version: versionOf(release.tag_name),
      publishedAt: release.published_at,
      platforms,
    };
  });

  app.get('/api/downloads/latest/:platform', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    if (!isPlatform(platform)) {
      throw Errors.notFound('Unknown platform');
    }
    const release = await getLatestRelease();
    const asset = pickAsset(release, platform);
    if (!asset) {
      throw Errors.notFound('No installer for this platform yet.');
    }
    const url = await resolveDownloadUrl(asset);
    reply.header('Cache-Control', 'no-store');
    return reply.redirect(url, 302);
  });
}
