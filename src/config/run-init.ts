import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { prisma } from "./db"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const initDb = async () => {
  try {
    const sqlPath = path.join(__dirname, "init.sql")
    const sql = fs.readFileSync(sqlPath, "utf8")
    
    console.log("Running initialization SQL script...")
    await prisma.$executeRawUnsafe(sql)
    console.log("Database initialized successfully.")
    process.exit(0)
  } catch (error) {
    console.error("Failed to initialize database:", error)
    process.exit(1)
  }
}

initDb()
