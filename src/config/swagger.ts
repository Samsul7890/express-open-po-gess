import swaggerJsdoc from "swagger-jsdoc"
import { env } from "./env"

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Buka PO Gess API",
      version: "1.0.0",
      description: "Pre-Order management platform API for small culinary businesses",
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/api/routes/*.ts"],
}

export const swaggerSpec = swaggerJsdoc(options)
