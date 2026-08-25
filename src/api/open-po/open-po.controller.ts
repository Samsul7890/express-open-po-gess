import { Request, Response } from "express"
import { createOpenPOSchema, updateOpenPOSchema } from "./open-po.dto"
import { createOpenPO, getOpenPOById, getStoreOpenPOs, updateOpenPO } from "./open-po.service"
import { sendSuccess, sendError } from "../../utils/response"

export const createOpenPOHandler = async (req: Request, res: Response) => {
  try {
    const { error, value } = createOpenPOSchema.validate(req.body)
    if (error) return sendError(res, "Validation Error", 400, [error.message])

    const storeId = req.params.pk_store_id as string

    try {
      const po = await createOpenPO(storeId, req.user!.pk_user_id, value)
      return sendSuccess(res, po, "Pre-order configuration created", 201)
    } catch (e: any) {
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      if (e.message === "Product not found or doesn't belong to store") return sendError(res, e.message, 404)
      if (e.message.includes("Start date and end date are required")) return sendError(res, "Validation Error", 400, [e.message])
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const getStoreOpenPOsHandler = async (req: Request, res: Response) => {
  try {
    const storeId = req.params.pk_store_id as string
    const pos = await getStoreOpenPOs(storeId)
    return sendSuccess(res, pos, "Pre-orders retrieved")
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const getOpenPOByIdHandler = async (req: Request, res: Response) => {
  try {
    const poId = req.params.pk_po_id as string
    if (!poId) return sendError(res, "Invalid ID", 400)

    const po = await getOpenPOById(poId)
    if (!po) return sendError(res, "Not found", 404)

    return sendSuccess(res, po, "Open PO retrieved")
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const updateOpenPOHandler = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateOpenPOSchema.validate(req.body)
    if (error) return sendError(res, "Validation Error", 400, [error.message])

    const poId = req.params.pk_po_id as string
    if (!poId) return sendError(res, "Invalid ID", 400)

    try {
      const po = await updateOpenPO(poId, req.user!.pk_user_id, value)
      return sendSuccess(res, po, "Open PO updated")
    } catch (e: any) {
      if (e.message === "Not found") return sendError(res, "Not found", 404)
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      if (e.message.includes("Start date and end date are required")) return sendError(res, "Validation Error", 400, [e.message])
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const closeOpenPOHandler = async (req: Request, res: Response) => {
  try {
    const poId = req.params.pk_po_id as string
    if (!poId) return sendError(res, "Invalid ID", 400)

    const closePayload = {
      always_ready: false,
      end_date: new Date().toISOString(),
    }

    try {
      const po = await updateOpenPO(poId, req.user!.pk_user_id, closePayload)
      return sendSuccess(res, po, "Open PO closed")
    } catch (e: any) {
      if (e.message === "Not found") return sendError(res, "Not found", 404)
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}
