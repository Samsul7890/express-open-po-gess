import { Request, Response } from "express"
import { createAdditional, deleteAdditional, updateAdditional } from "./additional-product.service"
import { createAdditionalSchema, updateAdditionalSchema } from "./additional-product.dto"
import { sendSuccess, sendError } from "../../utils/response"

export const createAdditionalHandler = async (req: Request, res: Response) => {
  try {
    const { error, value } = createAdditionalSchema.validate(req.body)
    if (error) return sendError(res, "Validation Error", 400, [error.message])

    const productId = parseInt(req.params.pk_product_id as string)
    if (isNaN(productId)) return sendError(res, "Invalid product ID", 400)

    try {
      const additional = await createAdditional(productId, req.user!.pk_user_id, value)
      return sendSuccess(res, additional, "Additional product created", 201)
    } catch (e: any) {
      if (e.message === "Product not found") return sendError(res, "Product not found", 404)
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const updateAdditionalHandler = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateAdditionalSchema.validate(req.body)
    if (error) return sendError(res, "Validation Error", 400, [error.message])

    const additionalId = parseInt(req.params.pk_additional_id as string)
    if (isNaN(additionalId)) return sendError(res, "Invalid ID", 400)

    try {
      const additional = await updateAdditional(additionalId, req.user!.pk_user_id, value)
      return sendSuccess(res, additional, "Additional product updated")
    } catch (e: any) {
      if (e.message === "Not found") return sendError(res, "Not found", 404)
      if (e.message === "Product not found") return sendError(res, "Product not found", 404)
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const deleteAdditionalHandler = async (req: Request, res: Response) => {
  try {
    const additionalId = parseInt(req.params.pk_additional_id as string)
    if (isNaN(additionalId)) return sendError(res, "Invalid ID", 400)

    try {
      await deleteAdditional(additionalId, req.user!.pk_user_id)
      return sendSuccess(res, null, "Additional product deleted")
    } catch (e: any) {
      if (e.message === "Not found") return sendError(res, "Not found", 404)
      if (e.message === "Product not found") return sendError(res, "Product not found", 404)
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}
