import { Router } from "express"
import {
  createOpenPOHandler,
  closeOpenPOHandler,
  getOpenPOByIdHandler,
  getStoreOpenPOsHandler,
  updateOpenPOHandler,
} from "../open-po/open-po.controller"
import { authenticate } from "../../middleware/auth"
import { requireRole } from "../../middleware/authorize"

// Nested router under stores
export const storeOpenPORouter = Router({ mergeParams: true })

/**
 * @swagger
 * /stores/{pk_store_id}/open-po:
 *   post:
 *     summary: Create an Open PO for a store
 *     tags: [Open PO]
 */
storeOpenPORouter.post("/", authenticate, requireRole("seller"), createOpenPOHandler)

/**
 * @swagger
 * /stores/{pk_store_id}/open-po:
 *   get:
 *     summary: Get all Open POs for a store
 *     tags: [Open PO]
 */
storeOpenPORouter.get("/", getStoreOpenPOsHandler)

// Main router for standalone routes
const openPORouter = Router()

/**
 * @swagger
 * /open-po/{pk_po_id}:
 *   get:
 *     summary: Get a specific Open PO
 *     tags: [Open PO]
 */
openPORouter.get("/:pk_po_id", getOpenPOByIdHandler)

/**
 * @swagger
 * /open-po/{pk_po_id}:
 *   put:
 *     summary: Update an Open PO
 *     tags: [Open PO]
 */
openPORouter.put("/:pk_po_id", authenticate, requireRole("seller"), updateOpenPOHandler)

/**
 * @swagger
 * /open-po/{pk_po_id}/close:
 *   post:
 *     summary: Close an Open PO (sets always_ready=false, end_date=now)
 *     tags: [Open PO]
 */
openPORouter.post("/:pk_po_id/close", authenticate, requireRole("seller"), closeOpenPOHandler)

export default openPORouter
