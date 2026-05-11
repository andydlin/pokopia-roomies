import type { PersistedSessionPayload, SessionTransportAdapter } from "../../domain/home-builder/models";

export class SessionTransportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionTransportError";
  }
}

const parseErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
};

const validateImportedPayload = (payload: Partial<PersistedSessionPayload>): PersistedSessionPayload => {
  if (!Array.isArray(payload.savedHomes)) {
    throw new SessionTransportError("Invalid restore payload.");
  }

  return {
    version: 1,
    currentHome: payload.currentHome ?? null,
    savedHomes: payload.savedHomes,
    exportedAt: typeof payload.exportedAt === "number" ? payload.exportedAt : Date.now(),
  };
};

export const sessionTransportAdapter: SessionTransportAdapter = {
  async exportSession(payload) {
    const response = await fetch("/api/session-export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new SessionTransportError(await parseErrorMessage(response));
    }

    const data = (await response.json()) as { code?: string; expiresAt?: number | null };
    if (!data.code) {
      throw new SessionTransportError("Export failed to return a restore code.");
    }

    return {
      code: data.code,
      expiresAt: data.expiresAt ?? null,
    };
  },

  async importSession(code) {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      throw new SessionTransportError("Enter a restore code.");
    }

    const response = await fetch(`/api/session-import/${encodeURIComponent(normalizedCode)}`);

    if (!response.ok) {
      throw new SessionTransportError(await parseErrorMessage(response));
    }

    const payload = (await response.json()) as Partial<PersistedSessionPayload>;
    return validateImportedPayload(payload);
  },
};
