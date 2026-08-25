import { Router } from "express"
import {
  createProductHandler,
  deleteProductHandler,
  getProductByIdHandler,
  getStoreProductsHandler,
  updateProductHandler,
} from "../product/product.controller"
import { authenticate } from "../../middleware/auth"
import { requireRole } from "../../middleware/authorize"
import { upload } from "../../config/multer"

// Notice: We export a storeRouter specifically for nested routes under stores
export const storeProductRouter = Router({ mergeParams: true })

/**
 * @swagger
 * /stores/{pk_store_id}/products:
 *   post:
 *     summary: Add a product to a store
 *     tags: [Product]
 */
storeProductRouter.post(
  "/",
  authenticate,
  requireRole("seller"),
  upload.array("images", 10), // Max 10 images
  createProductHandler
)

/**
 * @swagger
 * /stores/{pk_store_id}/products:
 *   get:
 *     summary: List all products of a store
 *     tags: [Product]
 */
storeProductRouter.get("/", getStoreProductsHandler)

// Main product router for /products prefix
const productRouter = Router()

/**
 * @swagger
 * /products/{pk_product_id}:
 *   get:
 *     summary: Get a single product
 *     tags: [Product]
 */
productRouter.get("/:pk_product_id", getProductByIdHandler)

/**
 * @swagger
 * /products/{pk_product_id}:
 *   put:
 *     summary: Update a product
 *     tags: [Product]
 */
productRouter.put(
  "/:pk_product_id",
  authenticate,
  upload.array("images", 10),
  updateProductHandler
)

/**
 * @swagger
 * /products/{pk_product_id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Product]
 */
productRouter.delete("/:pk_product_id", authenticate, deleteProductHandler)

export default productRouter
