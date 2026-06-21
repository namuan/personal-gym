import { describe, it, expect, vi } from 'vitest';

// jsdom doesn't ship IndexedDB; stub the repository so the share module
// can be imported in isolation by UI tests.
vi.mock('../data/planRepository.js', () => ({
  getActivePlan: async () => null,
  savePlan: async (plan) => plan,
  clearPlan: async () => {},
  newId: () => 'test-id',
  makeBlankExercise: () => ({
    id: 'test-id',
    name: '',
    sets: 3,
    reps: 10,
    instructions: '',
    restSeconds: 60,
  }),
}));

import {
  encodePlanToPayload,
  decodePayloadToPlan,
  SharePayloadError,
  buildShareUrl,
  extractPayloadFromHash,
} from '../data/shareCodec.js';

function sampleExercises() {
  return [
    {
      id: 'a',
      name: 'Push-ups',
      sets: 3,
      reps: 10,
      instructions: 'Keep your core tight',
      restSeconds: 60,
      order: 0,
    },
    {
      id: 'b',
      name: 'Squats',
      sets: 4,
      reps: 12,
      instructions: '',
      restSeconds: 90,
      order: 1,
    },
  ];
}

describe('shareCodec — base64url', () => {
  it('encodePlanToPayload produces a base64url string with no padding', async () => {
    const payload = await encodePlanToPayload({ exercises: sampleExercises() });
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(payload).not.toMatch(/[+/=]/);
  });

  it('encodePlanToPayload + decodePayloadToPlan round-trips normalised exercises', async () => {
    const original = { exercises: sampleExercises() };
    const payload = await encodePlanToPayload(original);
    const decoded = await decodePayloadToPlan(payload);
    expect(decoded.v).toBe(1);
    expect(decoded.exercises).toHaveLength(2);
    expect(decoded.exercises[0]).toMatchObject({
      id: 'a',
      name: 'Push-ups',
      sets: 3,
      reps: 10,
      restSeconds: 60,
    });
    expect(decoded.exercises[1].name).toBe('Squats');
  });

  it('encodePlanToPayload normalises the envelope (no createdAt/updatedAt)', async () => {
    const payload = await encodePlanToPayload({
      id: 'active',
      exercises: sampleExercises(),
      createdAt: 1,
      updatedAt: 2,
    });
    // If envelope leaked, JSON would contain "createdAt" pre-gzip. The
    // string is opaque after encoding, so we round-trip and inspect the
    // decoded object — the decoder never returns createdAt/updatedAt.
    const decoded = await decodePayloadToPlan(payload);
    expect(decoded.createdAt).toBeUndefined();
    expect(decoded.updatedAt).toBeUndefined();
    expect(decoded.id).toBeUndefined();
  });
});

describe('shareCodec — decoder error codes', () => {
  it('throws SharePayloadError(EMPTY) on empty string', async () => {
    await expect(decodePayloadToPlan('')).rejects.toMatchObject({
      name: 'SharePayloadError',
      code: 'EMPTY',
    });
  });

  it('throws SharePayloadError(INVALID_BASE64) on illegal characters', async () => {
    await expect(decodePayloadToPlan('***not-base64***')).rejects.toBeInstanceOf(
      SharePayloadError,
    );
    await expect(decodePayloadToPlan('***not-base64***')).rejects.toMatchObject({
      code: 'INVALID_BASE64',
    });
  });

  it('throws SharePayloadError(INVALID_GZIP) on valid base64 that is not gzip', async () => {
    // base64url of plain "hello world" — no gzip magic bytes.
    const b64 = Buffer.from('hello world', 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    await expect(decodePayloadToPlan(b64)).rejects.toMatchObject({
      code: 'INVALID_GZIP',
    });
  });

  it('throws SharePayloadError(INVALID_JSON) on valid gzip wrapping non-JSON', async () => {
    const gz = await new Promise((resolve, reject) => {
      // eslint-disable-next-line node/no-unsupported-features/node-builtins
      import('node:zlib').then(({ gzip }) =>
        gzip(Buffer.from('not json'), (_, out) =>
          out ? resolve(out) : reject(new Error('gzip failed')),
        ),
      );
    });
    const b64 = Buffer.from(gz)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    await expect(decodePayloadToPlan(b64)).rejects.toMatchObject({
      code: 'INVALID_JSON',
    });
  });

  it('throws SharePayloadError(UNSUPPORTED_VERSION) on v=2', async () => {
    const json = JSON.stringify({ v: 2, exercises: [] });
    const gz = await new Promise((resolve, reject) => {
      import('node:zlib').then(({ gzip }) =>
        gzip(Buffer.from(json, 'utf8'), (_, out) =>
          out ? resolve(out) : reject(new Error('gzip failed')),
        ),
      );
    });
    const b64 = Buffer.from(gz)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    await expect(decodePayloadToPlan(b64)).rejects.toMatchObject({
      code: 'UNSUPPORTED_VERSION',
    });
  });

  it('throws SharePayloadError(INVALID_SCHEMA) on v=1 with missing exercises', async () => {
    const json = JSON.stringify({ v: 1 });
    const gz = await new Promise((resolve, reject) => {
      import('node:zlib').then(({ gzip }) =>
        gzip(Buffer.from(json, 'utf8'), (_, out) =>
          out ? resolve(out) : reject(new Error('gzip failed')),
        ),
      );
    });
    const b64 = Buffer.from(gz)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    await expect(decodePayloadToPlan(b64)).rejects.toMatchObject({
      code: 'INVALID_SCHEMA',
    });
  });
});

describe('shareCodec — URL helpers', () => {
  it('buildShareUrl composes origin, base, route, and payload', () => {
    const url = buildShareUrl({
      origin: 'https://x.test',
      base: '/p/',
      payload: 'abc',
    });
    expect(url).toBe('https://x.test/p/share#data=abc');
  });

  it('buildShareUrl does not read window', () => {
    const g = globalThis;
    const originalWindow = g.window;
    // Replace window with a throwing proxy; if the function reads it,
    // the test will fail.
    g.window = new Proxy(
      {},
      {
        get() {
          throw new Error('window should not be read');
        },
      },
    );
    try {
      const url = buildShareUrl({
        origin: 'https://x.test',
        base: '/',
        payload: 'abc',
      });
      expect(url).toBe('https://x.test/share#data=abc');
    } finally {
      g.window = originalWindow;
    }
  });

  it('extractPayloadFromHash returns the substring after #data= URL-decoded', () => {
    const hash = '#data=eyJ2IjoxLCJleGVyY2lzZXMiOltdfQ';
    expect(extractPayloadFromHash(hash)).toBe('eyJ2IjoxLCJleGVyY2lzZXMiOltdfQ');
  });

  it('extractPayloadFromHash decodes percent-encoded payloads', () => {
    const hash = '#data=' + encodeURIComponent('a/b+c=');
    expect(extractPayloadFromHash(hash)).toBe('a/b+c=');
  });

  it('extractPayloadFromHash returns null for empty or unrelated hashes', () => {
    expect(extractPayloadFromHash('')).toBeNull();
    expect(extractPayloadFromHash('#')).toBeNull();
    expect(extractPayloadFromHash('#foo=bar')).toBeNull();
    expect(extractPayloadFromHash(null)).toBeNull();
    expect(extractPayloadFromHash(undefined)).toBeNull();
  });

  it('extractPayloadFromHash never throws on garbage', () => {
    expect(() => extractPayloadFromHash('###%%%')).not.toThrow();
  });
});
