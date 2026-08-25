import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcrypt"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const SALT_ROUNDS = 10

  // ── Seller ──────────────────────────────────────────────
  const sellerPassword = await bcrypt.hash("seller123", SALT_ROUNDS)
  const seller = await prisma.user.upsert({
    where: { email: "seller@openpo.dev" },
    update: {},
    create: {
      name: "Seed Seller",
      email: "seller@openpo.dev",
      phone_number: "08111111111",
      role: "seller",
      password: sellerPassword,
    },
  })

  // ── Customer ─────────────────────────────────────────────
  const customerPassword = await bcrypt.hash("customer123", SALT_ROUNDS)
  const customer = await prisma.user.upsert({
    where: { email: "customer@openpo.dev" },
    update: {},
    create: {
      name: "Seed Customer",
      email: "customer@openpo.dev",
      phone_number: "08222222222",
      role: "customer",
      password: customerPassword,
    },
  })

  console.log("✅ Seeded users:")
  console.log(`   🏪 Seller   → ${seller.phone_number}  | password: seller123`)
  console.log(`   👤 Customer → ${customer.phone_number} | password: customer123`)
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
