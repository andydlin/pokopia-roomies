import type { Handler } from "@netlify/functions";
import { getSession } from "./_sessionStore";

const json = (statusCode: number, payload: unknown) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify(payload),
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed." });
  }

  const code = event.path.split("/").pop()?.toUpperCase();
  if (!code) {
    return json(400, { error: "Missing restore code." });
  }

  const record = getSession(code);
  if (!record) {
    return json(404, { error: "Restore code is invalid or expired." });
  }

  return json(200, record.payload);
};
