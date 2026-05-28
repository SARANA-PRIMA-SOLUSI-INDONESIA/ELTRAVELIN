import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { getDatabaseUrl } from "./env";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

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

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
