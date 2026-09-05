import Joi from "joi"
import dotenv from "dotenv"

dotenv.config()

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "production", "test").default("development"),
  PORT: Joi.number().default(3000),

  // Database — single connection string (used by Prisma + pg pool)
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().optional(),

  // Individual DB fields kept optional for local introspection/logging
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().optional(),
  DB_PASSWORD: Joi.string().optional(),
  DB_NAME: Joi.string().optional(),

  // Supabase (for Storage, Auth helpers, Realtime)
  SUPABASE_URL: Joi.string().uri().optional(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().optional(),
  SUPABASE_STORAGE_BUCKET: Joi.string().default("open-po-gess"),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default("7d"),

  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().required(),

  FRONTEND_URL: Joi.string().uri().default("http://localhost:5173"),
})
  .unknown(true)
  .required()

const { error, value } = envSchema.validate(process.env)

if (error) {
  throw new Error(`Environment validation error: ${error.message}`)
}

export const env = {
  nodeEnv: value.NODE_ENV as string,
  port: value.PORT as number,
  databaseUrl: value.DATABASE_URL as string,
  directUrl: value.DIRECT_URL as string | undefined,
  db: {
    host: value.DB_HOST as string | undefined,
    port: value.DB_PORT as number,
    user: value.DB_USER as string | undefined,
    password: value.DB_PASSWORD as string | undefined,
    name: value.DB_NAME as string | undefined,
  },
  supabase: {
    url: value.SUPABASE_URL as string,
    serviceRoleKey: value.SUPABASE_SERVICE_ROLE_KEY as string,
    storageBucket: value.SUPABASE_STORAGE_BUCKET as string,
  },
  jwt: {
    secret: value.JWT_SECRET as string,
    expiresIn: value.JWT_EXPIRES_IN as string,
  },
  google: {
    clientId: value.GOOGLE_CLIENT_ID as string,
    clientSecret: value.GOOGLE_CLIENT_SECRET as string,
    callbackUrl: value.GOOGLE_CALLBACK_URL as string,
  },
  frontendUrl: value.FRONTEND_URL as string,
}

