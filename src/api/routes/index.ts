import { Router, Request, Response } from "express"
import authRoutes from "./auth.routes"
import storeRoutes from "./store.routes"
import productRoutes, { storeProductRouter } from "./product.routes"
import galeryRoutes, { productGaleryRouter } from "./galery.routes"
import additionalRoutes, { productAdditionalRouter } from "./additional-product.routes"
import openPORoutes, { storeOpenPORouter } from "./open-po.routes"
import orderRoutes from "./order.routes"

const router = Router()

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "OK", timestamp: new Date().toISOString() })
})

router.use("/auth", authRoutes)
router.use("/stores", storeRoutes)
router.use("/stores/:pk_store_id/products", storeProductRouter)
router.use("/stores/:pk_store_id/open-po", storeOpenPORouter)
router.use("/products", productRoutes)
router.use("/products/:pk_product_id/galery", productGaleryRouter)
router.use("/products/:pk_product_id/additional", productAdditionalRouter)
router.use("/galery", galeryRoutes)
router.use("/additional-products", additionalRoutes)
router.use("/open-po", openPORoutes)
router.use("/orders", orderRoutes)

export default router
