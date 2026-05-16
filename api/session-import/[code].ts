import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSession } from "../_sessionStore.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const code = (typeof req.query.code === "string" ? req.query.code : "").toUpperCase();
  if (!code) {
    return res.status(400).json({ error: "Missing restore code." });
  }

  const record = getSession(code);
  if (!record) {
    return res.status(404).json({ error: "Restore code is invalid or expired." });
  }

  return res.status(200).json(record.payload);
}
