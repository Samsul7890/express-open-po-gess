import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { env } from "./env"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect()
    console.log(`✅ PostgreSQL connected to database: ${env.db.name} via Prisma 7 Adapter`)
  } catch (error) {
    console.error("❌ Prisma connection error", error)
    process.exit(-1)
  }
}
