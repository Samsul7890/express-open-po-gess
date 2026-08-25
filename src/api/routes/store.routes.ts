import { Router } from "express"
import { createStoreHandler, getMyStoresHandler, getStoreByIdHandler, updateStoreHandler, getStoresByCustomerHandler } from "../store/store.controller"
import { authenticate } from "../../middleware/auth"
import { requireRole } from "../../middleware/authorize"
import { upload } from "../../config/multer"

const router = Router()

/**
 * @swagger
 * /stores:
 *   post:
 *     summary: Create a new store (seller only)
 *     tags: [Store]
 */
router.post(
  "/",
  authenticate,
  requireRole("seller"),
  upload.fields([{ name: "banner", maxCount: 1 }, { name: "avatar", maxCount: 1 }]),
  createStoreHandler
)

/**
 * @swagger
 * /stores/my:
 *   get:
 *     summary: Get all stores owned by the authenticated seller
 *     tags: [Store]
 */
router.get("/my", authenticate, getMyStoresHandler)

/**
 * @swagger
 * /stores/customer:
 *   get:
 *     summary: Get stores where authenticated customer has completed (done) orders
 *     tags: [Store]
 */
router.get("/customer", authenticate, getStoresByCustomerHandler)

/**
 * @swagger
 * /stores/{pk_store_id}:
 *   get:
 *     summary: Get a single store by ID
 *     tags: [Store]
 */
router.get("/:pk_store_id", getStoreByIdHandler)

/**
 * @swagger
 * /stores/{pk_store_id}:
 *   put:
 *     summary: Update store details (owner only)
 *     tags: [Store]
 */
router.put(
  "/:pk_store_id",
  authenticate,
  upload.fields([{ name: "banner", maxCount: 1 }, { name: "avatar", maxCount: 1 }]),
  updateStoreHandler
)

export default router
