import request from "supertest"
import app from "../app"
import { prisma } from "../config/db"

beforeAll(async () => {
  // Clean up any leftover test data before starting
  await prisma.user.deleteMany({
    where: { phone_number: "1234567890Test" }
  }).catch(() => {})
})

afterAll(async () => {
  // Clean up test user
  await prisma.user.deleteMany({
    where: { phone_number: "1234567890Test" }
  })
  
  await prisma.$disconnect()
})

describe("Auth Routes", () => {
  const testUser = {
    phoneNumber: "1234567890Test",
    password: "password123",
    role: "seller",
    name: "Test User",
    email: "testuser@example.com",
  }

  let cookies: string[] = []

  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser)
    
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.user.name).toBe(testUser.name)
    
    // Token is set via httpOnly cookie, not in body
    const setCookie = res.headers["set-cookie"]
    expect(setCookie).toBeDefined()
    cookies = Array.isArray(setCookie) ? setCookie : [setCookie]
  })

  it("should login the user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      phoneNumber: testUser.phoneNumber,
      password: testUser.password,
    })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    
    // Token is set via httpOnly cookie, not in body
    const setCookie = res.headers["set-cookie"]
    expect(setCookie).toBeDefined()
    cookies = Array.isArray(setCookie) ? setCookie : [setCookie]
  })

  it("should get authenticated user profile", async () => {
    if (cookies.length === 0) return

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookies)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe(testUser.name)
  })

  it("should update the user profile", async () => {
    if (cookies.length === 0) return

    const res = await request(app)
      .put("/api/auth/updateUser")
      .set("Cookie", cookies)
      .send({
        phoneNumber: testUser.phoneNumber,
        name: "Updated Test User",
        email: "updatedtestuser@example.com"
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.user.name).toBe("Updated Test User")
    
    // Capture fresh cookie from profile update
    const setCookie = res.headers["set-cookie"]
    if (setCookie) {
      cookies = Array.isArray(setCookie) ? setCookie : [setCookie]
    }
  })

  it("should logout the user", async () => {
    const res = await request(app).post("/api/auth/logout")
    
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe("Logout successful")
  })
})
