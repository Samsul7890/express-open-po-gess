import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { env } from "./env"

// Bypass strict SSL validation for Supabase connections on Vercel
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

const dbUrl = env.databaseUrl
const isRemoteDb = dbUrl.includes("supabase") || dbUrl.includes("pooler") || dbUrl.includes("sslmode=require") || !dbUrl.includes("localhost")

const pool = new Pool({
  connectionString: dbUrl,
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


