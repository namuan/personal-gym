import { normaliseExercise } from './planModel.js';

/**
 * Share-via-URL codec.
 *
 * Wire format (v1):
 *   1. JSON envelope: { v: 1, exercises: Exercise[] }
 *   2. UTF-8 bytes.
 *   3. gzip via platform CompressionStream.
 *   4. base64url (no padding).
 *
 * The decoded payload is always normalised through `normaliseExercise`
 * so the rest of the app can trust the shape.
 */

const SCHEMA_VERSION = 1;

export class SharePayloadError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SharePayloadError';
    this.code = code;
  }
}

export const SHARE_ERROR_CODES = Object.freeze({
  EMPTY: 'EMPTY',
  INVALID_BASE64: 'INVALID_BASE64',
  INVALID_GZIP: 'INVALID_GZIP',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_SCHEMA: 'INVALID_SCHEMA',
  UNSUPPORTED_VERSION: 'UNSUPPORTED_VERSION',
});

/* ------------------------------------------------------------------ *
 * CompressionStream / DecompressionStream helpers
 *
 * `getCompressionStream` and `getDecompressionStream` are the seam
 * used by tests (jsdom lacks these) to substitute real implementations.
 * In production they read the browser globals.
 * ------------------------------------------------------------------ */

export function getCompressionStream(format = 'gzip') {
  if (typeof globalThis.CompressionStream === 'undefined') {
    throw new SharePayloadError(
      'INVALID_GZIP',
      'Compression is not supported in this browser.',
    );
  }
  return new globalThis.CompressionStream(format);
}

export function getDecompressionStream(format = 'gzip') {
  if (typeof globalThis.DecompressionStream === 'undefined') {
    throw new SharePayloadError(
      'INVALID_GZIP',
      'Decompression is not supported in this browser.',
    );
  }
  return new globalThis.DecompressionStream(format);
}

/**
 * Drain a ReadableStream of Uint8Array chunks into a single Uint8Array.
 * Uses the platform `Response` constructor (which understands streams in
 * all supported browsers). For environments where `Response(stream)` is
 * not available, the test polyfill can override this helper.
 */
export async function drainStream(stream) {
  if (typeof Response !== 'undefined') {
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  }
  // Fallback: pull chunks manually.
  const reader = stream.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/**
 * Create a ReadableStream that yields the given bytes as a single chunk.
 * This avoids depending on `new Blob([bytes]).stream()`, which is missing
 * in jsdom and a few older Safari versions.
 */
export function bytesToReadableStream(bytes) {
  if (typeof ReadableStream !== 'undefined') {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(bytes));
        controller.close();
      },
    });
  }
  // Async iterator fallback.
  return {
    getReader() {
      let done = false;
      return {
        read: async () => {
          if (done) return { value: undefined, done: true };
          done = true;
          return { value: new Uint8Array(bytes), done: false };
        },
      };
    },
  };
}

async function compressGzip(bytes) {
  try {
    const stream = bytesToReadableStream(bytes).pipeThrough(
      getCompressionStream('gzip'),
    );
    return await drainStream(stream);
  } catch (err) {
    if (err instanceof SharePayloadError) throw err;
    throw new SharePayloadError('INVALID_GZIP', err?.message ?? 'Compression failed.');
  }
}

async function decompressGzip(bytes) {
  try {
    const stream = bytesToReadableStream(bytes).pipeThrough(
      getDecompressionStream('gzip'),
    );
    return await drainStream(stream);
  } catch (err) {
    if (err instanceof SharePayloadError) throw err;
    throw new SharePayloadError(
      'INVALID_GZIP',
      'The share link is invalid or corrupted.',
    );
  }
}

/* ------------------------------------------------------------------ *
 * base64url helpers
 * ------------------------------------------------------------------ */

const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(input) {
  if (!input || typeof input !== 'string') {
    throw new SharePayloadError('INVALID_BASE64', 'The share link is invalid or corrupted.');
  }
  if (!BASE64URL_RE.test(input)) {
    throw new SharePayloadError('INVALID_BASE64', 'The share link is invalid or corrupted.');
  }
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  let binary;
  try {
    binary = atob(b64);
  } catch {
    throw new SharePayloadError('INVALID_BASE64', 'The share link is invalid or corrupted.');
  }
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

/**
 * Encode a plan (or just an array of exercises) into a base64url string
 * suitable for putting after `#data=` in a share URL.
 */
export async function encodePlanToPayload(planInput) {
  const exercises = Array.isArray(planInput)
    ? planInput
    : (planInput?.exercises ?? []);
  const envelope = { v: SCHEMA_VERSION, exercises };
  const json = JSON.stringify(envelope);
  const jsonBytes = new TextEncoder().encode(json);
  const gz = await compressGzip(jsonBytes);
  return bytesToBase64Url(gz);
}

/**
 * Decode a base64url string into a normalised { v, exercises } object.
 * Throws SharePayloadError on any failure.
 */
export async function decodePayloadToPlan(payload) {
  if (!payload || typeof payload !== 'string') {
    throw new SharePayloadError('EMPTY', 'The share link is invalid or corrupted.');
  }
  const gz = base64UrlToBytes(payload);
  if (gz.length === 0) {
    throw new SharePayloadError('EMPTY', 'The share link is invalid or corrupted.');
  }
  const jsonBytes = await decompressGzip(gz);
  let parsed;
  try {
    parsed = JSON.parse(new TextDecoder().decode(jsonBytes));
  } catch {
    throw new SharePayloadError('INVALID_JSON', 'The share link is invalid or corrupted.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new SharePayloadError(
      'INVALID_SCHEMA',
      'This share link was created with a newer version of the app.',
    );
  }
  if (!Number.isInteger(parsed.v)) {
    throw new SharePayloadError(
      'INVALID_SCHEMA',
      'The share link is invalid or corrupted.',
    );
  }
  if (parsed.v > SCHEMA_VERSION) {
    throw new SharePayloadError(
      'UNSUPPORTED_VERSION',
      'This share link was created with a newer version of the app.',
    );
  }
  if (parsed.v < SCHEMA_VERSION) {
    throw new SharePayloadError(
      'UNSUPPORTED_VERSION',
      'The share link is invalid or corrupted.',
    );
  }
  if (!Array.isArray(parsed.exercises)) {
    throw new SharePayloadError(
      'INVALID_SCHEMA',
      'The share link is invalid or corrupted.',
    );
  }
  const exercises = parsed.exercises.map((e) => normaliseExercise(e));
  return { v: parsed.v, exercises };
}

/**
 * Compose a share URL from origin, base, and a payload.
 * Pure: never reads window.
 */
export function buildShareUrl({ origin, base, payload }) {
  const trimmedBase = (base ?? '').replace(/\/+$/, '');
  const prefix = `${origin}${trimmedBase ? trimmedBase : ''}`;
  return `${prefix}/share#data=${payload}`;
}

/**
 * Pull the payload string out of a `#data=...` hash. Returns null if the
 * hash does not carry a share payload. Never throws.
 */
export function extractPayloadFromHash(hash) {
  if (!hash || typeof hash !== 'string') return null;
  if (!hash.startsWith('#data=')) return null;
  const raw = hash.slice('#data='.length);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
