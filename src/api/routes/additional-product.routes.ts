import { Router } from "express"
import { createAdditionalHandler, deleteAdditionalHandler, updateAdditionalHandler } from "../additional-product/additional-product.controller"
import { authenticate } from "../../middleware/auth"
import { requireRole } from "../../middleware/authorize"

// Nested router under products
export const productAdditionalRouter = Router({ mergeParams: true })

/**
 * @swagger
 * /products/{pk_product_id}/additional:
 *   post:
 *     summary: Add an additional option to a product
 *     tags: [Additional Product]
 */
productAdditionalRouter.post(
  "/",
  authenticate,
  requireRole("seller"),
  createAdditionalHandler
)

// Main router for standalone routes
const additionalRouter = Router()

/**
 * @swagger
 * /additional-products/{pk_additional_id}:
 *   put:
 *     summary: Update an additional product
 *     tags: [Additional Product]
 */
additionalRouter.put(
  "/:pk_additional_id",
  authenticate,
  requireRole("seller"),
  updateAdditionalHandler
)

/**
 * @swagger
 * /additional-products/{pk_additional_id}:
 *   delete:
 *     summary: Delete an additional product
 *     tags: [Additional Product]
 */
additionalRouter.delete(
  "/:pk_additional_id",
  authenticate,
  requireRole("seller"),
  deleteAdditionalHandler
)

export default additionalRouter
