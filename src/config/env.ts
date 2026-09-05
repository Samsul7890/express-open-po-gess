import Joi from "joi"
import dotenv from "dotenv"

dotenv.config()

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "production", "test").default("development"),
  PORT: Joi.number().default(3000),

  // Database Vercel + Supabase Integration Variables
  POSTGRES_URL: Joi.string().optional(),
  POSTGRES_PRISMA_URL: Joi.string().optional(),
  POSTGRES_URL_NON_POOLING: Joi.string().optional(),
  POSTGRES_USER: Joi.string().optional(),
  POSTGRES_HOST: Joi.string().optional(),
  POSTGRES_PASSWORD: Joi.string().optional(),
  POSTGRES_DATABASE: Joi.string().optional(),
  DATABASE_URL: Joi.string().optional(),
  DIRECT_URL: Joi.string().optional(),

  // Individual DB fields
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().optional(),
  DB_PASSWORD: Joi.string().optional(),
  DB_NAME: Joi.string().optional(),

  // Supabase API Keys (Vercel + Supabase integration style)
  SUPABASE_URL: Joi.string().uri().optional(),
  NEXT_PUBLIC_SUPABASE_URL: Joi.string().uri().optional(),
  SUPABASE_SECRET_KEY: Joi.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: Joi.string().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Joi.string().optional(),
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

const resolvedDatabaseUrl =
  value.POSTGRES_PRISMA_URL || value.POSTGRES_URL || value.DATABASE_URL

if (!resolvedDatabaseUrl) {
  throw new Error("Missing database connection URL. Please set POSTGRES_PRISMA_URL, POSTGRES_URL, or DATABASE_URL.")
}

const resolvedDirectUrl =
  value.POSTGRES_URL_NON_POOLING || value.DIRECT_URL || resolvedDatabaseUrl

const resolvedSupabaseUrl =
  value.SUPABASE_URL || value.NEXT_PUBLIC_SUPABASE_URL

const resolvedSupabaseSecretKey =
  value.SUPABASE_SECRET_KEY || value.SUPABASE_SERVICE_ROLE_KEY

const resolvedSupabasePublishableKey =
  value.SUPABASE_PUBLISHABLE_KEY || value.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const env = {
  nodeEnv: value.NODE_ENV as string,
  port: value.PORT as number,
  databaseUrl: resolvedDatabaseUrl as string,
  directUrl: resolvedDirectUrl as string,
  db: {
    host: (value.POSTGRES_HOST || value.DB_HOST) as string | undefined,
    port: value.DB_PORT as number,
    user: (value.POSTGRES_USER || value.DB_USER) as string | undefined,
    password: (value.POSTGRES_PASSWORD || value.DB_PASSWORD) as string | undefined,
    name: (value.POSTGRES_DATABASE || value.DB_NAME) as string | undefined,
  },
  supabase: {
    url: resolvedSupabaseUrl as string,
    serviceRoleKey: resolvedSupabaseSecretKey as string,
    publishableKey: resolvedSupabasePublishableKey as string | undefined,
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


