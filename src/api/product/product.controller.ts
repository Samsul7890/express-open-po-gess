import { Request, Response } from "express"
import { createProductSchema, updateProductSchema, addAdditionalItemSchema, updateAdditionalItemSchema } from "./product.dto"
import { createProduct, deleteProduct, getProductById, getStoreProducts, updateProduct } from "./product.service"
import { sendSuccess, sendError } from "../../utils/response"

export const createProductHandler = async (req: Request, res: Response) => {
  try {
    const { error, value } = createProductSchema.validate(req.body)
    if (error) return sendError(res, "Validation Error", 400, [error.message])

    const storeId = req.params.pk_store_id as string
    const files = req.files as Express.Multer.File[] | undefined

    const additionals: { name: string; price: number }[] = []
    if (value.additionals) {
      let raw: any[]
      try {
        raw = typeof value.additionals === "string" ? JSON.parse(value.additionals) : value.additionals
      } catch (e) {
        return sendError(res, "Invalid additionals format", 400)
      }

      for (const item of raw) {
        const { error: itemErr, value: itemVal } = addAdditionalItemSchema.validate(item)
        if (itemErr) return sendError(res, "Validation Error in additionals", 400, [itemErr.message])
        additionals.push(itemVal)
      }
    }

    try {
      const product = await createProduct(storeId, req.user!.pk_user_id, value, additionals, files)
      return sendSuccess(res, product, "Product created successfully", 201)
    } catch (e: any) {
      if (e.message === "Store not found") return sendError(res, "Store not found", 404)
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const getStoreProductsHandler = async (req: Request, res: Response) => {
  try {
    const storeId = req.params.pk_store_id as string
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await getStoreProducts(storeId, page, limit)
    return sendSuccess(res, result, "Products retrieved")
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const getProductByIdHandler = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.pk_product_id as string)
    if (isNaN(productId)) return sendError(res, "Invalid product ID", 400)

    const product = await getProductById(productId)
    if (!product) return sendError(res, "Product not found", 404)

    return sendSuccess(res, product, "Product retrieved")
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const updateProductHandler = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateProductSchema.validate(req.body)
    if (error) return sendError(res, "Validation Error", 400, [error.message])

    const productId = parseInt(req.params.pk_product_id as string)
    if (isNaN(productId)) return sendError(res, "Invalid product ID", 400)

    const files = req.files as Express.Multer.File[] | undefined

    // Parse JSON-stringified arrays sent as multipart form fields
    const parseJsonField = (field: any): any[] => {
      if (!field) return []
      if (Array.isArray(field)) return field
      try { return JSON.parse(field) } catch { return [] }
    }

    // Validate and cast add_additionals items using createAdditionalSchema
    const rawAddAdditionals = parseJsonField(value.add_additionals)
    const add_additionals: { name: string; price: number }[] = []
    for (const item of rawAddAdditionals) {
      const { error: itemErr, value: itemVal } = addAdditionalItemSchema.validate(item)
      if (itemErr) return sendError(res, "Validation Error in add_additionals", 400, [itemErr.message])
      add_additionals.push(itemVal)
    }

    // Validate and cast update_additionals items using updateAdditionalSchema + id
    const rawUpdateAdditionals = parseJsonField(value.update_additionals)
    const update_additionals: { id: number; name: string; price: number }[] = []
    for (const item of rawUpdateAdditionals) {
      const { error: itemErr, value: itemVal } = updateAdditionalItemSchema.validate(item)
      if (itemErr) return sendError(res, "Validation Error in update_additionals", 400, [itemErr.message])
      update_additionals.push(itemVal)
    }

    const parsedValue = {
      product_name: value.product_name,
      description: value.description,
      price: value.price,
      deleted_galery_ids: parseJsonField(value.deleted_galery_ids).map(Number),
      deleted_additional_ids: parseJsonField(value.deleted_additional_ids).map(Number),
      add_additionals,
      update_additionals,
    }

    try {
      const product = await updateProduct(productId, req.user!.pk_user_id, parsedValue, files)
      return sendSuccess(res, product, "Product updated")
    } catch (e: any) {
      if (e.message === "Product not found") return sendError(res, "Product not found", 404)
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const deleteProductHandler = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.pk_product_id as string)
    if (isNaN(productId)) return sendError(res, "Invalid product ID", 400)

    try {
      await deleteProduct(productId, req.user!.pk_user_id)
      return sendSuccess(res, null, "Product deleted")
    } catch (e: any) {
      if (e.message === "Product not found") return sendError(res, "Product not found", 404)
      if (e.message === "Forbidden") return sendError(res, "Not the store owner", 403)
      throw e
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}
