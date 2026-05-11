import type { LocalSessionAdapter, PersistedSessionPayload } from "../../domain/home-builder/models";

const STORAGE_KEY = "pokopia.home-builder.session.v1";
const CURRENT_VERSION = 1;

const parsePayload = (raw: string | null): PersistedSessionPayload | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSessionPayload>;
    if (parsed.version !== CURRENT_VERSION) return null;
    if (!Array.isArray(parsed.savedHomes)) return null;

    return {
      version: CURRENT_VERSION,
      currentHome: parsed.currentHome ?? null,
      savedHomes: parsed.savedHomes,
      exportedAt: typeof parsed.exportedAt === "number" ? parsed.exportedAt : Date.now(),
    };
  } catch {
    return null;
  }
};

export const localSessionAdapter: LocalSessionAdapter = {
  load() {
    if (typeof window === "undefined") return null;
    return parsePayload(window.localStorage.getItem(STORAGE_KEY));
  },
  save(payload) {
    if (typeof window === "undefined") return;
    const persisted: PersistedSessionPayload = {
      version: CURRENT_VERSION,
      currentHome: payload.currentHome,
      savedHomes: payload.savedHomes,
      exportedAt: payload.exportedAt,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};
