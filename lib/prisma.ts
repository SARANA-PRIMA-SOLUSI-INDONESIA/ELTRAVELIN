import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { getDatabaseUrl } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaClientVersion?: string;
};

// Bump this when adding new Prisma models so HMR drops stale singletons
const PRISMA_CLIENT_VERSION = "appSetting-v1";

function createPrismaClient() {
  const dbUrl = getDatabaseUrl();

  // During build, return a dummy client if DB URL not available
  if (!dbUrl) {
    console.warn("[Prisma] Database URL not available during build, returning placeholder client");
    return new PrismaClient() as PrismaClient;
  }

  const url = new URL(dbUrl);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;
  const hasAppSetting =
    !!existing && typeof (existing as { appSetting?: unknown }).appSetting !== "undefined";
  const versionOk = globalForPrisma.prismaClientVersion === PRISMA_CLIENT_VERSION;

  if (existing && hasAppSetting && versionOk) {
    return existing;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  }
  return client;
}

/**
 * Lazy proxy so Hot Reload always resolves a fresh PrismaClient
 * after schema changes (avoids stale global without new models).
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, _receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
