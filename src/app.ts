import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import swaggerUi from "swagger-ui-express"
import "./config/passport"
import { swaggerSpec } from "./config/swagger"
import { errorHandler } from "./middleware/errorHandler"
import router from "./api/routes"
import { env } from "./config/env"

const app = express()

// ─── Core Middleware ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true)
      
      // Allow localhost, any Vercel preview URL, or the exact FRONTEND_URL
      if (
        origin === env.frontendUrl || 
        origin.endsWith('.vercel.app') || 
        origin.includes('localhost')
      ) {
        return callback(null, true)
      }
      
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })
)
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Swagger Docs ────────────────────────────────────────────────────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: { persistAuthorization: true },
}))

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api", router)

// ─── Static Files ────────────────────────────────────────────────────────────
app.use("/uploads", express.static("uploads"))

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" })
})

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler)

export default app
