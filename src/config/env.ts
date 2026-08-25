import Joi from "joi"
import dotenv from "dotenv"

dotenv.config()

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "production", "test").default("development"),
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

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
  db: {
    host: value.DB_HOST as string,
    port: value.DB_PORT as number,
    user: value.DB_USER as string,
    password: value.DB_PASSWORD as string,
    name: value.DB_NAME as string,
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
