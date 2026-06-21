import '@testing-library/jest-dom/vitest';
import { TextEncoder, TextDecoder } from 'node:util';
import { promisify } from 'node:util';
import { gunzip, gzip } from 'node:zlib';
import { Buffer } from 'node:buffer';

// jsdom doesn't ship TextEncoder/TextDecoder or a working
// CompressionStream. We polyfill only what the share-encoding module
// needs so the real encode/decode pipeline can be exercised under
// vitest.

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

function bufferToUint8(buf) {
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

/**
 * jsdom's built-in CompressionStream/DecompressionStream are stubs that
 * are not real TransformStreams, so `pipeThrough` and `Response(stream)`
 * don't work with them. We replace them with real TransformStreams
 * backed by node's zlib.
 */
function makeZlibTransform(kind) {
  return new TransformStream({
    async transform(chunk, controller) {
      const out =
        kind === 'compress'
          ? await gzipAsync(Buffer.from(chunk))
          : await gunzipAsync(Buffer.from(chunk));
      if (out.length > 0) controller.enqueue(bufferToUint8(out));
    },
  });
}

if (typeof globalThis.CompressionStream !== 'undefined') {
  globalThis.CompressionStream = class CompressionStream {
    constructor(format) {
      if (format && format !== 'gzip') {
        throw new Error(`Unsupported compression format: ${format}`);
      }
      return makeZlibTransform('compress');
    }
  };
}
if (typeof globalThis.DecompressionStream !== 'undefined') {
  globalThis.DecompressionStream = class DecompressionStream {
    constructor(format) {
      if (format && format !== 'gzip') {
        throw new Error(`Unsupported compression format: ${format}`);
      }
      return makeZlibTransform('decompress');
    }
  };
}
