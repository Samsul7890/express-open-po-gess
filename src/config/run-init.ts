import fs from "fs"
import path from "path"
import { prisma } from "./db"


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
