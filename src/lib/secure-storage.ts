// Encrypted client-side storage for sensitive health data.
// - PIN is verified via PBKDF2 hash stored in localStorage.
// - An AES-GCM key derived from the PIN encrypts each sensitive value.
// - The key lives in memory only; on lock it is wiped.
// - A synchronous plaintext cache backs useLocalStorage so React stays sync.

const PIN_META_KEY = "sec:pin-meta";
const ENC_PREFIX = "enc:v1:";
const PROTECTED_PREFIX = "sante:";

type PinMeta = {
  saltB64: string; // PBKDF2 salt for verification hash
  hashB64: string; // PBKDF2 verification hash of the PIN
  keySaltB64: string; // PBKDF2 salt for AES key derivation
  iterations: number;
};

let aesKey: CryptoKey | null = null;
const plaintextCache = new Map<string, string>(); // key -> JSON string
const listeners = new Set<() => void>();
const pendingWrites = new Set<Promise<void>>();

// Avertir l'utilisateur si des écritures chiffrées sont en cours à la fermeture
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (e) => {
    if (pendingWrites.size > 0) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pbkdf2(
  pin: string,
  salt: Uint8Array,
  iterations: number,
  bits: number,
): Promise<Uint8Array> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin) as BufferSource,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const buf = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    baseKey,
    bits,
  );
  return new Uint8Array(buf);
}

async function deriveAesKey(pin: string, keySalt: Uint8Array, iterations: number) {
  const raw = await pbkdf2(pin, keySalt, iterations, 256);
  return crypto.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export function isPinSet(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem(PIN_META_KEY);
}

export function isUnlocked(): boolean {
  return aesKey !== null;
}

export async function setupPin(pin: string): Promise<void> {
  const verifySalt = crypto.getRandomValues(new Uint8Array(16));
  const keySalt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 150_000;
  const verifyHash = await pbkdf2(pin, verifySalt, iterations, 256);
  const meta: PinMeta = {
    saltB64: b64encode(verifySalt),
    hashB64: b64encode(verifyHash),
    keySaltB64: b64encode(keySalt),
    iterations,
  };
  window.localStorage.setItem(PIN_META_KEY, JSON.stringify(meta));
  aesKey = await deriveAesKey(pin, keySalt, iterations);
  await migratePlaintextValues();
  await loadAllIntoCache();
  notify();
}

export async function unlockWithPin(pin: string): Promise<boolean> {
  const raw = window.localStorage.getItem(PIN_META_KEY);
  if (!raw) return false;
  let meta: PinMeta;
  try {
    meta = JSON.parse(raw) as PinMeta;
  } catch {
    return false;
  }
  const salt = b64decode(meta.saltB64);
  const expected = b64decode(meta.hashB64);
  const got = await pbkdf2(pin, salt, meta.iterations, 256);
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ expected[i];
  if (diff !== 0) return false;
  aesKey = await deriveAesKey(pin, b64decode(meta.keySaltB64), meta.iterations);
  await loadAllIntoCache();
  notify();
  return true;
}

export function lock(): void {
  aesKey = null;
  plaintextCache.clear();
  notify();
}

export async function resetAll(): Promise<void> {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && (k.startsWith(PROTECTED_PREFIX) || k === PIN_META_KEY)) keys.push(k);
  }
  keys.forEach((k) => window.localStorage.removeItem(k));
  aesKey = null;
  plaintextCache.clear();
  notify();
}

async function encryptString(plain: string): Promise<string> {
  if (!aesKey) throw new Error("locked");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    aesKey,
    new TextEncoder().encode(plain) as BufferSource,
  );
  return ENC_PREFIX + b64encode(iv) + ":" + b64encode(new Uint8Array(ct));
}

async function decryptString(payload: string): Promise<string | null> {
  if (!aesKey) return null;
  if (!payload.startsWith(ENC_PREFIX)) return null;
  const rest = payload.slice(ENC_PREFIX.length);
  const [ivB64, ctB64] = rest.split(":");
  if (!ivB64 || !ctB64) return null;
  try {
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64decode(ivB64) as BufferSource },
      aesKey,
      b64decode(ctB64) as BufferSource,
    );
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}

async function loadAllIntoCache() {
  plaintextCache.clear();
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(PROTECTED_PREFIX)) keys.push(k);
  }
  for (const k of keys) {
    const raw = window.localStorage.getItem(k);
    if (!raw) continue;
    if (raw.startsWith(ENC_PREFIX)) {
      const pt = await decryptString(raw);
      if (pt !== null) plaintextCache.set(k, pt);
    } else {
      plaintextCache.set(k, raw);
      try {
        const enc = await encryptString(raw);
        window.localStorage.setItem(k, enc);
      } catch {
        /* ignore */
      }
    }
  }
}

async function migratePlaintextValues() {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(PROTECTED_PREFIX)) keys.push(k);
  }
  for (const k of keys) {
    const raw = window.localStorage.getItem(k);
    if (!raw || raw.startsWith(ENC_PREFIX)) continue;
    try {
      const enc = await encryptString(raw);
      window.localStorage.setItem(k, enc);
    } catch {
      /* ignore */
    }
  }
}

export function isProtectedKey(k: string): boolean {
  return k.startsWith(PROTECTED_PREFIX);
}

export function getCached(key: string): string | null {
  return plaintextCache.has(key) ? plaintextCache.get(key)! : null;
}

export function setCachedAndPersist(key: string, value: string): void {
  plaintextCache.set(key, value);
  if (!aesKey) return;
  const p: Promise<void> = encryptString(value)
    .then((enc) => {
      window.localStorage.setItem(key, enc);
    })
    .catch(() => {/* ignore quota errors */})
    .finally(() => pendingWrites.delete(p));
  pendingWrites.add(p);
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  listeners.forEach((fn) => fn());
}
