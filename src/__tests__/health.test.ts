import request from "supertest"
import { describe, it, expect, jest } from "@jest/globals"

jest.mock("swagger-jsdoc", () => {
  return jest.fn().mockReturnValue({})
})

import app from "../app"

describe("GET /api/health", () => {
  it("should return 200 OK with success true", async () => {
    const res = await request(app).get("/api/health")
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe("OK")
    expect(res.body.timestamp).toBeDefined()
  })

  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/unknown-route-xyz")
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})
