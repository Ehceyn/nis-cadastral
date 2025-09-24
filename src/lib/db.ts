import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client. Prefer DIRECT_URL when running in development to avoid
// connecting via a pooled URL that may be inaccessible from the dev server.
const createPrismaClient = () => {
  // Prefer direct DB URL in development if provided (useful for local testing)
  const preferredDbUrl =
    process.env.NODE_ENV === "development" && process.env.DIRECT_URL
      ? process.env.DIRECT_URL
      : process.env.DATABASE_URL;

  if (!preferredDbUrl) {
    console.warn(
      "DATABASE_URL / DIRECT_URL not set, Prisma client not initialized"
    );
    // Return a minimal Prisma client so builds don't fail at import time
    return new PrismaClient({
      log: ["error"],
    });
  }

  // Pass the chosen URL to Prisma via the `datasources` option so runtime uses it
  return new PrismaClient({
    datasources: { db: { url: preferredDbUrl } },
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
