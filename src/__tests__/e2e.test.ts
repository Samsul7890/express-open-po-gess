import request from "supertest"
import { describe, it, expect, jest, afterAll } from "@jest/globals"

jest.mock("swagger-jsdoc", () => {
  return jest.fn().mockReturnValue({})
})

import app from "../app"
import { prisma } from "../config/db"

/**
 * End-to-End Test: Full Seller → Customer Lifecycle
 *
 * Covers: Health, Auth, Store, Product, Gallery, Additional Product,
 *         Open PO, and Order modules in a single sequential flow.
 *
 * Requires: Running PostgreSQL database (Docker Compose)
 */

// Unique suffixes to avoid collisions with other test runs
const TIMESTAMP = String(Date.now()).slice(-8)
const SELLER_PHONE = `s_${TIMESTAMP}`
const CUSTOMER_PHONE = `c_${TIMESTAMP}`

// Shared state across ordered tests
let sellerCookies: string[] = []
let customerCookies: string[] = []
let sellerUserId: string
let customerUserId: string
let storeId: string
let productId: number
let galeryId: number
let additionalId: number
let poId: string
let orderId: number

// Helper to extract cookies from response
const extractCookies = (res: request.Response): string[] => {
  const setCookie = res.headers["set-cookie"]
  if (!setCookie) return []
  return Array.isArray(setCookie) ? setCookie : [setCookie]
}

afterAll(async () => {
  // Cleanup in reverse dependency order
  try {
    if (orderId) {
      await prisma.additionalPO.deleteMany({ where: { fk_order_id: orderId } })
      await prisma.orderPO.delete({ where: { pk_order_id: orderId } }).catch(() => {})
    }
    if (poId) {
      await prisma.openPO.delete({ where: { pk_po_id: poId } }).catch(() => {})
    }
    if (additionalId) {
      await prisma.additionalProduct.delete({ where: { pk_additional_id: additionalId } }).catch(() => {})
    }
    if (galeryId) {
      await prisma.galery.delete({ where: { pk_galery_id: galeryId } }).catch(() => {})
    }
    if (productId) {
      // Clean up any remaining gallery/additional entries
      await prisma.galery.deleteMany({ where: { fk_product_id: productId } })
      await prisma.additionalProduct.deleteMany({ where: { fk_product_id: productId } })
      await prisma.product.delete({ where: { pk_product_id: productId } }).catch(() => {})
    }
    if (storeId) {
      await prisma.product.deleteMany({ where: { fk_store_id: storeId } })
      await prisma.store.delete({ where: { pk_store_id: storeId } }).catch(() => {})
    }
    // Clean up users
    await prisma.user.deleteMany({
      where: {
        phone_number: { in: [SELLER_PHONE, CUSTOMER_PHONE] }
      }
    })
  } catch (e) {
    console.error("E2E Cleanup error:", e)
  }

  await prisma.$disconnect()
})

describe("E2E: Full Lifecycle", () => {
  // ────────────────────────────────────────────────────────────
  // 1. Health Check
  // ────────────────────────────────────────────────────────────
  describe("1. Health", () => {
    it("GET /api/health → 200", async () => {
      const res = await request(app).get("/api/health")

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe("OK")
      expect(res.body.timestamp).toBeDefined()
    })

    it("GET /api/unknown → 404", async () => {
      const res = await request(app).get("/api/unknown-route-xyz")

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })
  })

  // ────────────────────────────────────────────────────────────
  // 2. Auth — Seller
  // ────────────────────────────────────────────────────────────
  describe("2. Auth (Seller)", () => {
    it("POST /api/auth/register → 201 (seller)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        phoneNumber: SELLER_PHONE,
        password: "password123",
        role: "seller",
        name: "E2E Seller",
        email: `e2e_seller_${TIMESTAMP}@test.com`,
      })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe("Registration successful")
      expect(res.body.data.user.name).toBe("E2E Seller")
      expect(res.body.data.user.role).toBe("seller")
      expect(res.body.data.user.pk_user_id).toBeDefined()

      sellerUserId = res.body.data.user.pk_user_id
      sellerCookies = extractCookies(res)
      expect(sellerCookies.length).toBeGreaterThan(0)
    })

    it("POST /api/auth/register → 400 (duplicate phone)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        phoneNumber: SELLER_PHONE,
        password: "password123",
        role: "seller",
        name: "Dupe",
      })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it("POST /api/auth/login → 200 (seller)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        phoneNumber: SELLER_PHONE,
        password: "password123",
      })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.user.pk_user_id).toBe(sellerUserId)

      sellerCookies = extractCookies(res)
    })

    it("POST /api/auth/login → 401 (wrong password)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        phoneNumber: SELLER_PHONE,
        password: "wrongpassword",
      })

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it("GET /api/auth/me → 200 (authenticated)", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", sellerCookies)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.pk_user_id).toBe(sellerUserId)
      expect(res.body.data.role).toBe("seller")
    })

    it("GET /api/auth/me → 401 (no token)", async () => {
      const res = await request(app).get("/api/auth/me")

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it("PUT /api/auth/updateUser → 200", async () => {
      const res = await request(app)
        .put("/api/auth/updateUser")
        .set("Cookie", sellerCookies)
        .send({
          phoneNumber: SELLER_PHONE,
          name: "E2E Seller Updated",
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.user.name).toBe("E2E Seller Updated")

      // Capture refreshed cookie
      const newCookies = extractCookies(res)
      if (newCookies.length > 0) sellerCookies = newCookies
    })

    it("POST /api/auth/logout → 200", async () => {
      const res = await request(app).post("/api/auth/logout")

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe("Logout successful")
    })

    // Re-login to get fresh cookie for subsequent tests
    it("POST /api/auth/login → re-login for subsequent tests", async () => {
      const res = await request(app).post("/api/auth/login").send({
        phoneNumber: SELLER_PHONE,
        password: "password123",
      })

      expect(res.status).toBe(200)
      sellerCookies = extractCookies(res)
    })
  })

  // ────────────────────────────────────────────────────────────
  // 3. Store
  // ────────────────────────────────────────────────────────────
  describe("3. Store", () => {
    it("POST /api/stores → 201 (create store)", async () => {
      const res = await request(app)
        .post("/api/stores")
        .set("Cookie", sellerCookies)
        .field("store_name", "E2E Test Store")
        .field("phone_number", "081234567890")

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.store_name).toBe("E2E Test Store")
      expect(res.body.data.owner).toBe(sellerUserId)
      expect(res.body.data.pk_store_id).toBeDefined()

      storeId = res.body.data.pk_store_id
    })

    it("POST /api/stores → 401 (no auth)", async () => {
      const res = await request(app)
        .post("/api/stores")
        .field("store_name", "Unauthorized Store")

      expect(res.status).toBe(401)
    })

    it("GET /api/stores/my → 200 (my stores)", async () => {
      const res = await request(app)
        .get("/api/stores/my")
        .set("Cookie", sellerCookies)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)
    })

    it("GET /api/stores/:pk_store_id → 200 (public)", async () => {
      const res = await request(app).get(`/api/stores/${storeId}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.pk_store_id).toBe(storeId)
      expect(res.body.data.store_name).toBe("E2E Test Store")
    })

    it("GET /api/stores/:pk_store_id → 404 (not found)", async () => {
      const res = await request(app).get("/api/stores/00000000-0000-0000-0000-000000000000")

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it("PUT /api/stores/:pk_store_id → 200 (update store)", async () => {
      const res = await request(app)
        .put(`/api/stores/${storeId}`)
        .set("Cookie", sellerCookies)
        .field("store_name", "E2E Store Renamed")

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.store_name).toBe("E2E Store Renamed")
    })
  })

  // ────────────────────────────────────────────────────────────
  // 4. Product
  // ────────────────────────────────────────────────────────────
  describe("4. Product", () => {
    it("POST /api/stores/:pk_store_id/products → 201", async () => {
      const res = await request(app)
        .post(`/api/stores/${storeId}/products`)
        .set("Cookie", sellerCookies)
        .field("product_name", "E2E Nastar")
        .field("description", "Delicious cookies")
        .field("price", "85000")

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.product_name).toBe("E2E Nastar")
      expect(res.body.data.price).toBe(85000)
      expect(res.body.data.fk_store_id).toBe(storeId)

      productId = res.body.data.pk_product_id
    })

    it("GET /api/stores/:pk_store_id/products → 200 (list)", async () => {
      const res = await request(app).get(`/api/stores/${storeId}/products`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.products).toBeDefined()
      expect(res.body.data.products.length).toBeGreaterThanOrEqual(1)
      expect(res.body.data.pagination).toBeDefined()
    })

    it("GET /api/products/:pk_product_id → 200", async () => {
      const res = await request(app).get(`/api/products/${productId}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.pk_product_id).toBe(productId)
      expect(res.body.data.product_name).toBe("E2E Nastar")
    })

    it("GET /api/products/999999 → 404", async () => {
      const res = await request(app).get("/api/products/999999")

      expect(res.status).toBe(404)
    })

    it("PUT /api/products/:pk_product_id → 200 (update)", async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set("Cookie", sellerCookies)
        .field("product_name", "E2E Nastar Premium")
        .field("price", "95000")

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.product_name).toBe("E2E Nastar Premium")
      expect(res.body.data.price).toBe(95000)
    })
  })

  // ────────────────────────────────────────────────────────────
  // 5. Gallery
  // ────────────────────────────────────────────────────────────
  describe("5. Gallery", () => {
    it("POST /api/products/:pk_product_id/galery → 201 (upload)", async () => {
      // Create a minimal valid JPEG buffer (smallest valid JPEG)
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
        0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
        0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
        0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
        0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
        0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
        0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x7B, 0x94,
        0x11, 0x00, 0xFF, 0xD9,
      ])

      const res = await request(app)
        .post(`/api/products/${productId}/galery`)
        .set("Cookie", sellerCookies)
        .attach("image", jpegBuffer, "test-image.jpg")

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.galery_path).toBeDefined()
      expect(res.body.data.fk_product_id).toBe(productId)

      galeryId = res.body.data.pk_galery_id
    })

    it("POST /api/products/:pk_product_id/galery → 401 (no auth)", async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/galery`)

      expect(res.status).toBe(401)
    })
  })

  // ────────────────────────────────────────────────────────────
  // 6. Additional Product
  // ────────────────────────────────────────────────────────────
  describe("6. Additional Product", () => {
    it("POST /api/products/:pk_product_id/additional → 201", async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/additional`)
        .set("Cookie", sellerCookies)
        .send({ name: "Extra Cheese", price: 5000 })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe("Extra Cheese")
      expect(res.body.data.price).toBe(5000)
      expect(res.body.data.fk_product_id).toBe(productId)

      additionalId = res.body.data.pk_additional_id
    })

    it("PUT /api/additional-products/:pk_additional_id → 200", async () => {
      const res = await request(app)
        .put(`/api/additional-products/${additionalId}`)
        .set("Cookie", sellerCookies)
        .send({ name: "Premium Cheese", price: 7500 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe("Premium Cheese")
      expect(res.body.data.price).toBe(7500)
    })
  })

  // ────────────────────────────────────────────────────────────
  // 7. Open PO
  // ────────────────────────────────────────────────────────────
  describe("7. Open PO", () => {
    it("POST /api/stores/:pk_store_id/open-po → 201 (always_ready)", async () => {
      const res = await request(app)
        .post(`/api/stores/${storeId}/open-po`)
        .set("Cookie", sellerCookies)
        .send({
          fk_product_id: productId,
          cut_off: 2,
          always_ready: true,
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.always_ready).toBe(true)
      expect(res.body.data.cut_off).toBe(2)
      expect(res.body.data.fk_product_id).toBe(productId)
      expect(res.body.data.fk_store_id).toBe(storeId)

      poId = res.body.data.pk_po_id
    })

    it("POST /api/stores/:pk_store_id/open-po → 400 (missing dates when not always_ready)", async () => {
      const res = await request(app)
        .post(`/api/stores/${storeId}/open-po`)
        .set("Cookie", sellerCookies)
        .send({
          fk_product_id: productId,
          cut_off: 2,
          always_ready: false,
          // Missing start_date and end_date
        })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it("GET /api/stores/:pk_store_id/open-po → 200 (list)", async () => {
      const res = await request(app).get(`/api/stores/${storeId}/open-po`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)
    })

    it("GET /api/open-po/:pk_po_id → 200", async () => {
      const res = await request(app).get(`/api/open-po/${poId}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.pk_po_id).toBe(poId)
    })

    it("PUT /api/open-po/:pk_po_id → 200 (update cut_off)", async () => {
      const res = await request(app)
        .put(`/api/open-po/${poId}`)
        .set("Cookie", sellerCookies)
        .send({ cut_off: 3 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.cut_off).toBe(3)
    })
  })

  // ────────────────────────────────────────────────────────────
  // 8. Auth — Customer
  // ────────────────────────────────────────────────────────────
  describe("8. Auth (Customer)", () => {
    it("POST /api/auth/register → 201 (customer)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        phoneNumber: CUSTOMER_PHONE,
        password: "customer123",
        role: "customer",
        name: "E2E Customer",
      })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.user.role).toBe("customer")

      customerUserId = res.body.data.user.pk_user_id
      customerCookies = extractCookies(res)
    })
  })

  // ────────────────────────────────────────────────────────────
  // 9. Order PO
  // ────────────────────────────────────────────────────────────
  describe("9. Order", () => {
    it("POST /api/orders/open-po/:pk_po_id → 201 (place order)", async () => {
      // Use a date far in the future to avoid cut-off issues
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      const res = await request(app)
        .post(`/api/orders/open-po/${storeId}`)
        .set("Cookie", customerCookies)
        .send({
          pk_po_id: poId,
          requested_date: futureDate.toISOString(),
          qty: 2,
          notes: "Extra crispy please",
          additional_ids: [additionalId],
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.qty).toBe(2)
      expect(res.body.data.notes).toBe("Extra crispy please")
      expect(res.body.data.status).toBe("incoming")
      expect(res.body.data.fk_user_id).toBe(customerUserId)
      expect(res.body.data.fk_po_id).toBe(poId)

      orderId = res.body.data.pk_order_id
    })

    it("POST /api/orders/open-po/:pk_store_id → 404 (PO not found)", async () => {
      const res = await request(app)
        .post(`/api/orders/open-po/${storeId}`)
        .set("Cookie", customerCookies)
        .send({
          pk_po_id: "00000000-0000-0000-0000-000000000000",
          requested_date: new Date(Date.now() + 30 * 86400000).toISOString(),
          qty: 1,
        })

      expect(res.status).toBe(404)
    })

    it("GET /api/orders/my → 200 (customer orders)", async () => {
      const res = await request(app)
        .get("/api/orders/my")
        .set("Cookie", customerCookies)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)

      // Verify the order we placed is in the list
      const ourOrder = res.body.data.find((o: any) => o.pk_order_id === orderId)
      expect(ourOrder).toBeDefined()
    })

    it("GET /api/orders/:pk_order_id → 200 (customer can view own order)", async () => {
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Cookie", customerCookies)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.pk_order_id).toBe(orderId)
    })

    it("GET /api/orders/:pk_order_id → 200 (seller can view order)", async () => {
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Cookie", sellerCookies)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.pk_order_id).toBe(orderId)
    })

    it("GET /api/orders/store/:pk_store_id/agenda → 200 (seller agenda)", async () => {
      const res = await request(app)
        .get(`/api/orders/store/${storeId}/agenda`)
        .set("Cookie", sellerCookies)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.summary).toBeDefined()
      expect(res.body.data.summary.total_orders).toBeGreaterThanOrEqual(1)
      expect(res.body.data.orders).toBeDefined()
    })

    it("GET /api/orders/store/:pk_store_id/agenda → 403 (customer denied)", async () => {
      const res = await request(app)
        .get(`/api/orders/store/${storeId}/agenda`)
        .set("Cookie", customerCookies)

      expect(res.status).toBe(403)
    })

    it("PATCH /api/orders/:pk_order_id/status → 200 (seller confirms)", async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set("Cookie", sellerCookies)
        .send({ status: "confirm" })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe("confirm")
    })

    it("PATCH /api/orders/:pk_order_id/status → 200 (seller marks done)", async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set("Cookie", sellerCookies)
        .send({ status: "done" })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe("done")
    })

    it("GET /api/stores/customer → 200 (customer retrieves stores after order is done)", async () => {
      const res = await request(app)
        .get("/api/stores/customer")
        .set("Cookie", customerCookies)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)
      const storeItem = res.body.data.find((s: any) => s.pk_store_id === storeId)
      expect(storeItem).toBeDefined()
      expect(storeItem.store_name).toBeDefined()
    })
  })

  // ────────────────────────────────────────────────────────────
  // 10. Cleanup (Delete cascade)
  // ────────────────────────────────────────────────────────────
  describe("10. Cleanup (Delete operations)", () => {
    it("DELETE /api/galery/:pk_galery_id → 200", async () => {
      const res = await request(app)
        .delete(`/api/galery/${galeryId}`)
        .set("Cookie", sellerCookies)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      // Mark as cleaned so afterAll doesn't try to delete again
      galeryId = 0
    })

    it("DELETE /api/additional-products/:pk_additional_id → 200", async () => {
      // First clean up the AdditionalPO join records that reference this additional
      await prisma.additionalPO.deleteMany({
        where: { fk_additional_id: additionalId }
      })

      const res = await request(app)
        .delete(`/api/additional-products/${additionalId}`)
        .set("Cookie", sellerCookies)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      additionalId = 0
    })

    it("DELETE /api/open-po/:pk_po_id → 200", async () => {
      // First clean up any orders that reference this PO
      await prisma.additionalPO.deleteMany({ where: { order: { fk_po_id: poId } } })
      await prisma.orderPO.deleteMany({ where: { fk_po_id: poId } })
      orderId = 0

      const res = await request(app)
        .delete(`/api/open-po/${poId}`)
        .set("Cookie", sellerCookies)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      poId = ""
    })

    it("DELETE /api/products/:pk_product_id → 200", async () => {
      const res = await request(app)
        .delete(`/api/products/${productId}`)
        .set("Cookie", sellerCookies)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      productId = 0
    })
  })
})
