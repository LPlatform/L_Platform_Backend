import crypto from 'node:crypto';
import fs from 'node:fs';
import { getOciConfig } from '../lib/env.js';

export interface SignedUploadDescriptor {
  objectKey: string;
  namespace: string;
  bucket: string;
  region: string;
  uploadUrl: string;
  expiresAt: string;
  headers: Record<string, string>;
}

const SAFE_SEGMENT = /[^a-zA-Z0-9._-]/g;

export function buildScopedObjectKey(params: {
  organizationId: string | null;
  scope: 'submissions' | 'resources' | 'exports';
  ownerId: string;
  fileName: string;
}): string {
  const tenantSegment = (params.organizationId || 'platform').replace(SAFE_SEGMENT, '_');
  const ownerSegment = params.ownerId.replace(SAFE_SEGMENT, '_');
  const fileSegment = params.fileName.replace(SAFE_SEGMENT, '_').slice(0, 120) || 'artifact.bin';
  const id = crypto.randomUUID();
  return `${tenantSegment}/${params.scope}/${ownerSegment}/${id}-${fileSegment}`;
}

export function createOciObjectRequestSignature(params: {
  method: 'GET' | 'PUT' | 'HEAD' | 'DELETE';
  host: string;
  path: string;
  dateHeader: string;
  tenancyOcid: string;
  userOcid: string;
  fingerprint: string;
  privateKeyPem: string;
}): string {
  const signingString = [
    `(request-target): ${params.method.toLowerCase()} ${params.path}`,
    `date: ${params.dateHeader}`,
    `host: ${params.host}`,
  ].join('\n');

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingString);
  signer.end();
  const signature = signer.sign(params.privateKeyPem, 'base64');
  const keyId = `${params.tenancyOcid}/${params.userOcid}/${params.fingerprint}`;
  return `Signature version="1",keyId="${keyId}",algorithm="rsa-sha256",headers="(request-target) date host",signature="${signature}"`;
}

export function authorizeOciObjectOperation(params: {
  method: 'GET' | 'PUT';
  objectKey: string;
  ttlSeconds?: number;
}): SignedUploadDescriptor {
  const cfg = getOciConfig();
  if (!cfg.configured || !cfg.region || !cfg.objectStorageNamespace || !cfg.objectStorageBucket) {
    throw new Error(
      'OCI Object Storage credentials/bucket configuration are not provisioned in the environment.',
    );
  }

  const keyPath = process.env.OCI_PRIVATE_KEY_PATH?.trim();
  const privateKeyPem =
    process.env.OCI_PRIVATE_KEY?.replace(/\\n/g, '\n') ||
    (keyPath ? fs.readFileSync(keyPath, 'utf8') : '');
  if (!privateKeyPem) {
    throw new Error('OCI private key is unavailable for request signing.');
  }

  const host = `objectstorage.${cfg.region}.oraclecloud.com`;
  const encodedKey = params.objectKey
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  const path = `/n/${encodeURIComponent(cfg.objectStorageNamespace)}/b/${encodeURIComponent(cfg.objectStorageBucket)}/o/${encodedKey}`;
  const dateHeader = new Date().toUTCString();

  const authHeader = createOciObjectRequestSignature({
    method: params.method,
    host,
    path,
    dateHeader,
    tenancyOcid: process.env.OCI_TENANCY_OCID!.trim(),
    userOcid: process.env.OCI_USER_OCID!.trim(),
    fingerprint: process.env.OCI_FINGERPRINT!.trim(),
    privateKeyPem,
  });

  const ttlMs = Math.min(Math.max(params.ttlSeconds ?? 300, 30), 900) * 1000;
  return {
    objectKey: params.objectKey,
    namespace: cfg.objectStorageNamespace,
    bucket: cfg.objectStorageBucket,
    region: cfg.region,
    uploadUrl: `https://${host}${path}`,
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
    headers: {
      date: dateHeader,
      host,
      authorization: authHeader,
    },
  };
}

export function getOciStatus() {
  const cfg = getOciConfig();
  return {
    objectStorageConfigured: cfg.configured,
    contentDatabaseConfigured: cfg.contentDatabaseConfigured,
    region: cfg.region,
    bucket: cfg.objectStorageBucket,
    namespaceConfigured: Boolean(cfg.objectStorageNamespace),
    blocker: cfg.configured
      ? null
      : 'OCI_OBJECT_STORAGE_NAMESPACE, OCI_OBJECT_STORAGE_BUCKET, and OCI API signing variables are not provisioned in backend runtime env.',
  };
}
