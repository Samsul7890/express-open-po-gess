import { Request, Response } from "express"
import { createGaleryImage, deleteGaleryImage } from "./galery.service"
import { sendSuccess, sendError } from "../../utils/response"

export const uploadGaleryImageHandler = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.pk_product_id as string)
    if (isNaN(productId)) return sendError(res, "Invalid product ID", 400)

    const file = req.file

    try {
      const galery = await createGaleryImage(productId, req.user!.pk_user_id, file)
      return sendSuccess(res, galery, "Gallery image added", 201)
    } catch (e: any) {
      if (e.message === "No file provided") return sendError(res, "No file provided", 400)
      if (e.message === "Product not found") return sendError(res, "Product not found", 404)
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const deleteGaleryImageHandler = async (req: Request, res: Response) => {
  try {
    const galeryId = parseInt(req.params.pk_galery_id as string)
    if (isNaN(galeryId)) return sendError(res, "Invalid gallery ID", 400)

    try {
      await deleteGaleryImage(galeryId, req.user!.pk_user_id)
      return sendSuccess(res, null, "Image removed from DB and deleted from disk")
    } catch (e: any) {
      if (e.message === "Image not found") return sendError(res, "Image not found", 404)
      if (e.message === "Product not found") return sendError(res, "Product not found", 404) // Edge case
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}
