import type { Handler } from "@netlify/functions";
import type { PersistedSessionPayload } from "../../src/domain/home-builder/models";
import { isValidPayload, putSession } from "./_sessionStore";

const json = (statusCode: number, payload: unknown) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify(payload),
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  if (!event.body) {
    return json(400, { error: "Missing payload." });
  }

  try {
    const payload = JSON.parse(event.body) as PersistedSessionPayload;
    if (!isValidPayload(payload)) {
      return json(400, { error: "Invalid payload." });
    }

    const result = putSession(payload);
    return json(200, {
      code: result.code,
      expiresAt: result.expiresAt,
    });
  } catch {
    return json(400, { error: "Invalid JSON payload." });
  }
};
