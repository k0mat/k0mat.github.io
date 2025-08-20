// Minimal Web Crypto helpers for optional local encryption (AES-GCM + PBKDF2)

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export type EncryptedPayload = {
  v: 1;
  alg: 'AES-GCM';
  kdf: 'PBKDF2-SHA256';
  iter: number;
  salt: string; // base64
  iv: string; // base64
  ct: string; // base64
};

function toBase64(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  // btoa ok in browser; Node: use Buffer
  if (typeof btoa === 'function') return btoa(bin);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).Buffer.from(bytes).toString('base64');
}

function fromBase64(b64: string): Uint8Array {
  if (typeof atob === 'function') {
    const bin = atob(b64);
    return Uint8Array.from(bin, c => c.charCodeAt(0));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (globalThis as any).Buffer.from(b64, 'base64');
}

async function deriveKey(passphrase: string, salt: Uint8Array, iter = 150_000) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: (salt as unknown as BufferSource), iterations: iter, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptString(plaintext: string, passphrase: string, iter = 150_000): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt, iter);
  const ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: (iv as unknown as BufferSource) }, key, textEncoder.encode(plaintext));
  return {
    v: 1,
    alg: 'AES-GCM',
    kdf: 'PBKDF2-SHA256',
    iter,
    salt: toBase64(salt.buffer),
    iv: toBase64(iv.buffer),
    ct: toBase64(ctBuf),
  };
}

export async function decryptString(payload: EncryptedPayload, passphrase: string): Promise<string> {
  const salt = fromBase64(payload.salt);
  const iv = fromBase64(payload.iv);
  const ct = fromBase64(payload.ct);
  const key = await deriveKey(passphrase, salt, payload.iter);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: (iv as unknown as BufferSource) }, key, (ct as unknown as BufferSource));
  return textDecoder.decode(pt);
}
