import { Router } from "express"
import {
  createOrderHandler,
  getMyOrdersHandler,
  getMyDoneOrdersHandler,
  getOrderByIdHandler,
  getStoreAgendaHandler,
  getStoreAgendaGroupedHandler,
  updateOrderStatusHandler,
  updateOrderHandler,
  getStoreHistoryOrdersHandler,
  getStoreDashboardHandler,
} from "../order/order.controller"
import { authenticate } from "../../middleware/auth"
import { requireRole } from "../../middleware/authorize"

const router = Router()

/**
 * @swagger
 * /orders/open-po/{pk_store_id}:
 *   post:
 *     summary: Place an order for an Open PO
 *     tags: [Order]
 */
router.post("/open-po/:pk_store_id", authenticate, createOrderHandler)

/**
 * @swagger
 * /orders/my:
 *   get:
 *     summary: Get all orders made by the logged-in customer
 *     tags: [Order]
 */
router.get("/my", authenticate, getMyOrdersHandler)

/**
 * @swagger
 * /orders/my/done:
 *   get:
 *     summary: Get completed/cancelled orders for the logged-in customer (paginated)
 *     tags: [Order]
 */
router.get("/my/done", authenticate, getMyDoneOrdersHandler)

/**
 * @swagger
 * /orders/store/{pk_store_id}/agenda:
 *   get:
 *     summary: Get orders agenda for a store (Seller only)
 *     tags: [Order]
 */
router.get("/store/:pk_store_id/agenda", authenticate, requireRole("seller"), getStoreAgendaHandler)

/**
 * @swagger
 * /orders/store/{pk_store_id}/agenda/grouped:
 *   get:
 *     summary: Get agenda grouped by OpenPO for a store (Seller only)
 *     tags: [Order]
 */
router.get("/store/:pk_store_id/agenda/grouped", authenticate, requireRole("seller"), getStoreAgendaGroupedHandler)

/**
 * @swagger
 * /orders/store/{pk_store_id}/history:
 *   get:
 *     summary: Get paginated done/cancel orders for a store with date range filter and omset (Seller only)
 *     tags: [Order]
 *     parameters:
 *       - in: query
 *         name: page
 *       - in: query
 *         name: pageSize
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [done, cancel]
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 */
router.get("/store/:pk_store_id/history", authenticate, requireRole("seller"), getStoreHistoryOrdersHandler)

/**
 * @swagger
 * /orders/store/{pk_store_id}/dashboard:
 *   get:
 *     summary: Get dashboard statistics, weekly activity chart, and recent activities for a store (Seller only)
 *     tags: [Order]
 */
router.get("/store/:pk_store_id/dashboard", authenticate, requireRole("seller"), getStoreDashboardHandler)

/**
 * @swagger
 * /orders/{pk_order_id}:
 *   get:
 *     summary: Get a specific order
 *     tags: [Order]
 */
router.get("/:pk_order_id", authenticate, getOrderByIdHandler)

/**
 * @swagger
 * /orders/{pk_order_id}/status:
 *   patch:
 *     summary: Update the status of an order (Seller only)
 *     tags: [Order]
 */
router.patch("/:pk_order_id/status", authenticate, requireRole("seller"), updateOrderStatusHandler)

/**
 * @swagger
 * /orders/{pk_order_id}/fields:
 *   patch:
 *     summary: Update order details (qty, notes, requested_date, cancel)
 *     tags: [Order]
 */
router.patch("/:pk_order_id/fields", authenticate, updateOrderHandler)

export default router
