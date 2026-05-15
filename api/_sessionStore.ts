import type { PersistedSessionPayload } from "../src/domain/home-builder/models.js";

export type PortableSessionRecord = {
  code: string;
  payload: PersistedSessionPayload;
  createdAt: number;
  expiresAt: number;
};

type SessionStore = Map<string, PortableSessionRecord>;

declare global {
  // eslint-disable-next-line no-var
  var __POKOPIA_SESSION_STORE__: SessionStore | undefined;
}

const getStore = (): SessionStore => {
  if (!globalThis.__POKOPIA_SESSION_STORE__) {
    globalThis.__POKOPIA_SESSION_STORE__ = new Map<string, PortableSessionRecord>();
  }
  return globalThis.__POKOPIA_SESSION_STORE__;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomCode = () => {
  const prefix = Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `${prefix}-${suffix}`;
};

export const createUniqueCode = (): string => {
  const store = getStore();
  for (let index = 0; index < 8; index += 1) {
    const code = randomCode();
    if (!store.has(code)) return code;
  }
  return `${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0")}`;
};

export const putSession = (payload: PersistedSessionPayload) => {
  const now = Date.now();
  const code = createUniqueCode();
  const expiresAt = now + 1000 * 60 * 60 * 24 * 14;

  getStore().set(code, { code, payload, createdAt: now, expiresAt });
  return { code, expiresAt };
};

export const getSession = (code: string): PortableSessionRecord | null => {
  const record = getStore().get(code.toUpperCase()) ?? null;
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    getStore().delete(code.toUpperCase());
    return null;
  }
  return record;
};

export const isValidPayload = (payload: unknown): payload is PersistedSessionPayload => {
  if (!payload || typeof payload !== "object") return false;
  const asPayload = payload as Partial<PersistedSessionPayload>;
  return Array.isArray(asPayload.savedHomes) && typeof asPayload.exportedAt === "number";
};
