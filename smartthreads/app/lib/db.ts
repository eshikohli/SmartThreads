import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  // Ensure explicit sslmode=verify-full to suppress deprecation warning
  const url = connectionString?.includes("sslmode=")
    ? connectionString
    : `${connectionString}${connectionString?.includes("?") ? "&" : "?"}sslmode=verify-full`;

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
