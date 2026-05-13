import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { PersistedSessionPayload } from "../src/domain/home-builder/models";
import { isValidPayload, putSession } from "./_sessionStore";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!req.body) {
    return res.status(400).json({ error: "Missing payload." });
  }

  try {
    const payload = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as PersistedSessionPayload;
    if (!isValidPayload(payload)) {
      return res.status(400).json({ error: "Invalid payload." });
    }

    const result = putSession(payload);
    return res.status(200).json({ code: result.code, expiresAt: result.expiresAt });
  } catch {
    return res.status(400).json({ error: "Invalid JSON payload." });
  }
}
