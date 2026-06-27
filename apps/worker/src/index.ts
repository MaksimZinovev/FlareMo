import { Hono } from "hono";
import { cors } from "hono/cors";
import { isAccessTokenConfigured, type HonoBindings } from "./context";
import { appApi } from "./routes/app-api";
import { memosApi } from "./routes/memos-api";

const app = new Hono<HonoBindings>();

app.use(
  "/api/*",
  cors({
    origin: "*",
    allowHeaders: ["content-type", "authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use("/api/*", async (c, next) => {
  if (c.req.method === "OPTIONS" || isPublicApiPath(c.req.path) || !isAccessTokenConfigured(c)) {
    return next();
  }

  const expectedToken = c.env.FLAREMO_ACCESS_TOKEN;
  const actualToken = getBearerToken(c.req.header("authorization"));
  if (!expectedToken || !actualToken || !timingSafeTokenEqual(actualToken, expectedToken)) {
    return c.json({ error: { message: "Unauthorized" } }, 401);
  }

  return next();
});

app.route("/api/app", appApi);
app.route("/api/v1", memosApi);

app.notFound((c) => {
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: { message: "Not found" } }, 404);
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;

function isPublicApiPath(path: string) {
  return path === "/api/app/health" || path === "/api/app/auth";
}

function getBearerToken(authorization: string | undefined) {
  const [scheme, token] = authorization?.split(/\s+/, 2) ?? [];
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }
  return token;
}

function timingSafeTokenEqual(actual: string, expected: string) {
  const encoder = new TextEncoder();
  const actualBytes = encoder.encode(actual);
  const expectedBytes = encoder.encode(expected);
  if (actualBytes.byteLength !== expectedBytes.byteLength) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < actualBytes.byteLength; index += 1) {
    diff |= (actualBytes.at(index) ?? 0) ^ (expectedBytes.at(index) ?? 0);
  }
  return diff === 0;
}
