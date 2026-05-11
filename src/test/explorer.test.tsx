import { afterEach, describe, expect, it, vi } from "vitest";
import { sessionTransportAdapter, SessionTransportError } from "../lib/transport/sessionTransportAdapter";
import { makeEmptyCurrentHome } from "../domain/home-builder/logic";

const payload = {
  version: 1 as const,
  currentHome: {
    ...makeEmptyCurrentHome(),
    pokemonIds: ["pikachu"],
  },
  savedHomes: [],
  exportedAt: Date.now(),
};

describe("session transport adapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exports payload and returns restore code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ code: "MOSS-7421", expiresAt: 1770000000000 }),
      }),
    );

    const result = await sessionTransportAdapter.exportSession(payload);
    expect(result.code).toBe("MOSS-7421");
  });

  it("surfaces invalid/expired code errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "Restore code is invalid or expired." }),
      }),
    );

    await expect(sessionTransportAdapter.importSession("BAD-0000")).rejects.toBeInstanceOf(SessionTransportError);
  });
});
