import { Router } from "express"
import { deleteGaleryImageHandler, uploadGaleryImageHandler } from "../galery/galery.controller"
import { authenticate } from "../../middleware/auth"
import { requireRole } from "../../middleware/authorize"
import { upload } from "../../config/multer"

// Router for nested routes under products
export const productGaleryRouter = Router({ mergeParams: true })

/**
 * @swagger
 * /products/{pk_product_id}/galery:
 *   post:
 *     summary: Upload an image to a product gallery
 *     tags: [Galery]
 */
productGaleryRouter.post(
  "/",
  authenticate,
  requireRole("seller"),
  upload.single("image"),
  uploadGaleryImageHandler
)

// Main router for standalone /galery routes
const galeryRouter = Router()

/**
 * @swagger
 * /galery/{pk_galery_id}:
 *   delete:
 *     summary: Remove a gallery image
 *     tags: [Galery]
 */
galeryRouter.delete("/:pk_galery_id", authenticate, requireRole("seller"), deleteGaleryImageHandler)

export default galeryRouter
