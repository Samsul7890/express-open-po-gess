import app from "./app"
import { connectDB } from "./config/db"
import { env } from "./config/env"

const start = async (): Promise<void> => {
  try {
    await connectDB()

    app.listen(env.port, () => {
      console.log(`🚀 Server running on http://localhost:${env.port}`)
      console.log(`📄 Swagger docs at http://localhost:${env.port}/api/docs`)
    })
  } catch (err) {
    console.error("Failed to start server:", err)
    process.exit(1)
  }
}

start()
