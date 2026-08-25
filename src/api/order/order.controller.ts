import { Request, Response } from "express"
import { createOrderSchema, updateOrderStatusSchema, updateOrderSchema } from "./order.dto"
import { createOrder, getMyOrders, getMyDoneOrders, getOrderById, getStoreAgenda, getStoreAgendaGrouped, updateOrderStatus, updateOrderDetails, getStoreHistoryOrders, getStoreDashboard } from "./order.service"
import { sendSuccess, sendError } from "../../utils/response"

export const createOrderHandler = async (req: Request, res: Response) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body)
    if (error) return sendError(res, "Validation Error", 400, [error.message])

    const storeId = req.params.pk_store_id as string
    if (!storeId) return sendError(res, "Invalid Store ID", 400)

    try {
      const order = await createOrder(req.user!.pk_user_id, storeId, value)
      return sendSuccess(res, order, "Order placed successfully", 201)
    } catch (e: any) {
      if (e.message.startsWith("Open PO not found")) return sendError(res, e.message, 404)
      if (e.message.includes("cut-off time has passed") || e.message.includes("outside the allowed")) {
        return sendError(res, "Validation Error", 400, [e.message])
      }
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const getMyOrdersHandler = async (req: Request, res: Response) => {
  try {
    const orders = await getMyOrders(req.user!.pk_user_id)
    return sendSuccess(res, orders, "Orders retrieved")
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const getMyDoneOrdersHandler = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const data = await getMyDoneOrders(req.user!.pk_user_id, page, pageSize)
    return sendSuccess(res, data, "Done orders retrieved")
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const getOrderByIdHandler = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.pk_order_id as string)
    if (isNaN(orderId)) return sendError(res, "Invalid Order ID", 400)

    try {
      const order = await getOrderById(orderId, req.user!.pk_user_id)
      return sendSuccess(res, order, "Order retrieved")
    } catch (e: any) {
      if (e.message === "Order not found") return sendError(res, "Order not found", 404)
      if (e.message === "Forbidden") return sendError(res, "Access denied", 403)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const getStoreAgendaHandler = async (req: Request, res: Response) => {
  try {
    const storeId = req.params.pk_store_id as string
    const date = req.query.date as string | undefined
    const status = req.query.status as "incoming" | "confirm" | "cancel" | "done" | undefined

    try {
      const data = await getStoreAgenda(storeId, req.user!.pk_user_id, date, status)
      return sendSuccess(res, data, "Orders retrieved")
    } catch (e: any) {
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const getStoreAgendaGroupedHandler = async (req: Request, res: Response) => {
  try {
    const storeId = req.params.pk_store_id as string
    try {
      const data = await getStoreAgendaGrouped(storeId, req.user!.pk_user_id)
      return sendSuccess(res, data, "Agenda retrieved")
    } catch (e: any) {
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const updateOrderStatusHandler = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateOrderStatusSchema.validate(req.body)
    if (error) return sendError(res, "Validation Error", 400, [error.message])

    const orderId = parseInt(req.params.pk_order_id as string)
    if (isNaN(orderId)) return sendError(res, "Invalid Order ID", 400)

    try {
      const order = await updateOrderStatus(orderId, req.user!.pk_user_id, value.status)
      return sendSuccess(res, order, "Order status updated")
    } catch (e: any) {
      if (e.message === "Order not found") return sendError(res, "Order not found", 404)
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const updateOrderHandler = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateOrderSchema.validate(req.body)
    if (error) return sendError(res, "Validation Error", 400, [error.message])

    const orderId = parseInt(req.params.pk_order_id as string)
    if (isNaN(orderId)) return sendError(res, "Invalid Order ID", 400)

    try {
      const order = await updateOrderDetails(orderId, req.user!.pk_user_id, req.user!.role, value)
      return sendSuccess(res, order, "Order updated successfully")
    } catch (e: any) {
      if (e.message === "Order not found") return sendError(res, "Order not found", 404)
      if (e.message === "Forbidden") return sendError(res, "Access denied", 403)
      if (e.message.includes("Cannot update") || e.message.includes("only update incoming")) return sendError(res, e.message, 400)
      if (e.message.includes("cut-off time has passed") || e.message.includes("outside the allowed")) {
        return sendError(res, "Validation Error", 400, [e.message])
      }
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const getStoreHistoryOrdersHandler = async (req: Request, res: Response) => {
  try {
    const storeId = req.params.pk_store_id as string
    const page = parseInt(req.query.page as string) || 1
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 10, 50)
    const status = req.query.status as "done" | "cancel" | undefined
    const dateFrom = req.query.dateFrom as string | undefined
    const dateTo = req.query.dateTo as string | undefined
    const search = req.query.search as string | undefined

    if (status && !["done", "cancel"].includes(status)) {
      return sendError(res, "Invalid status. Must be 'done' or 'cancel'", 400)
    }

    try {
      const data = await getStoreHistoryOrders(
        storeId,
        req.user!.pk_user_id,
        page,
        pageSize,
        status,
        dateFrom,
        dateTo,
        search
      )
      return sendSuccess(res, data, "History orders retrieved")
    } catch (e: any) {
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      if (e.message.includes("exceeds maximum")) return sendError(res, e.message, 400)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const getStoreDashboardHandler = async (req: Request, res: Response) => {
  try {
    const storeId = req.params.pk_store_id as string
    try {
      const data = await getStoreDashboard(storeId, req.user!.pk_user_id)
      return sendSuccess(res, data, "Dashboard data retrieved")
    } catch (e: any) {
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}
