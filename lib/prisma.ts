import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { getDatabaseUrl } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaClientVersion?: string;
};

// Bump this when adding new Prisma models so HMR drops stale singletons
const PRISMA_CLIENT_VERSION = "appSetting-v1";

function getConnectionLimit() {
  // Vercel/serverless: keep pool tiny (many instances share one MySQL max_connections).
  // Local/dev: slightly higher is fine for HMR + parallel page loads.
  if (process.env.PRISMA_CONNECTION_LIMIT) {
    const n = Number(process.env.PRISMA_CONNECTION_LIMIT);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  }
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1"
    ? 1
    : 3;
}

function createPrismaClient() {
  const dbUrl = getDatabaseUrl();

  // During build, return a dummy client if DB URL not available
  if (!dbUrl) {
    console.warn(
      "[Prisma] Database URL not available during build, returning placeholder client"
    );
    return new PrismaClient() as PrismaClient;
  }

  const url = new URL(dbUrl);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: getConnectionLimit(),
    // Fail faster than default so requests don't hang 10s when DB is saturated
    acquireTimeout: 5000,
    connectTimeout: 5000,
  });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;
  const hasAppSetting =
    !!existing &&
    typeof (existing as { appSetting?: unknown }).appSetting !== "undefined";
  const versionOk = globalForPrisma.prismaClientVersion === PRISMA_CLIENT_VERSION;

  if (existing && hasAppSetting && versionOk) {
    return existing;
  }

  // Always cache on globalThis — required on Vercel so each serverless
  // isolate reuses one client/pool instead of opening new connections per query.
  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  return client;
}

/**
 * Lazy proxy so Hot Reload can recreate the client after schema changes
 * (version bump / missing model), while still sharing one instance per process.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, _receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
