import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { env } from "./env"

const isRemoteDb = process.env.DATABASE_URL?.includes("supabase") || process.env.DATABASE_URL?.includes("sslmode=require")

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isRemoteDb ? { ssl: { rejectUnauthorized: false } } : {}),
})
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect()
    console.log(`✅ Supabase PostgreSQL connected via Prisma Adapter`)
  } catch (error) {
    console.error("❌ Prisma connection error", error)
    process.exit(-1)
  }
}

