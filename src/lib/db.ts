import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Only create Prisma client if DATABASE_URL is available
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not set, Prisma client not initialized");
    // Return a mock client for build time
    return new PrismaClient({
      log: ["error"],
    });
  }

  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
