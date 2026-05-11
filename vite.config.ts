import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

type PortableSessionPayload = {
  version: number;
  currentHome: unknown;
  savedHomes: unknown[];
  exportedAt: number;
};

type PortableSessionRecord = {
  code: string;
  payload: PortableSessionPayload;
  expiresAt: number;
};

const sessionStore = new Map<string, PortableSessionRecord>();
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const createCode = () => {
  const prefix = Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `${prefix}-${suffix}`;
};

const readBody = (request: any) =>
  new Promise<string>((resolve) => {
    let body = "";
    request.on("data", (chunk: unknown) => {
      body += String(chunk);
    });
    request.on("end", () => resolve(body));
  });

const sessionApiPlugin = () => ({
  name: "pokopia-session-api",
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (!req.url) return next();

      if (req.method === "POST" && req.url === "/api/session-export") {
        try {
          const rawBody = await readBody(req);
          const payload = JSON.parse(rawBody) as Partial<PortableSessionPayload>;
          if (!Array.isArray(payload.savedHomes)) {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "Invalid payload." }));
            return;
          }

          const code = createCode();
          const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 14;
          sessionStore.set(code, {
            code,
            payload: {
              version: payload.version ?? 1,
              currentHome: payload.currentHome ?? null,
              savedHomes: payload.savedHomes,
              exportedAt: typeof payload.exportedAt === "number" ? payload.exportedAt : Date.now(),
            },
            expiresAt,
          });

          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ code, expiresAt }));
          return;
        } catch {
          res.statusCode = 400;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "Invalid JSON payload." }));
          return;
        }
      }

      if (req.method === "GET" && req.url.startsWith("/api/session-import/")) {
        const code = decodeURIComponent(req.url.slice("/api/session-import/".length)).toUpperCase();
        const record = sessionStore.get(code);
        if (!record || Date.now() > record.expiresAt) {
          res.statusCode = 404;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "Restore code is invalid or expired." }));
          return;
        }

        res.statusCode = 200;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(record.payload));
        return;
      }

      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), sessionApiPlugin()],
  server: {
    watch: {
      // External volumes can drop fs events; polling keeps HMR reliable.
      usePolling: true,
      interval: 120,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    css: true,
  },
});
