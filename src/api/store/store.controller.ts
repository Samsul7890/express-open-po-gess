import { Request, Response } from "express"
import { createStore, getMyStores, getStoreById, updateStore, getStoresByCustomer } from "./store.service"
import { createStoreSchema, updateStoreSchema } from "./store.dto"
import { sendSuccess, sendError } from "../../utils/response"

export const createStoreHandler = async (req: Request, res: Response) => {
  console.log(req)
  try {
    const { error, value } = createStoreSchema.validate(req.body)
    if (error) {
      return sendError(res, "Validation Error", 400, [error.message])
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const store = await createStore(req.user!.pk_user_id, value, files)

    return sendSuccess(res, store, "Store created successfully", 201)
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const getStoreByIdHandler = async (req: Request, res: Response) => {
  try {
    const storeId = req.params.pk_store_id as string

    if (!UUID_REGEX.test(storeId)) {
      return sendError(res, "Store not found", 404)
    }

    const store = await getStoreById(storeId)

    if (!store) {
      return sendError(res, "Store not found", 404)
    }

    return sendSuccess(res, store, "Store retrieved")
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const getMyStoresHandler = async (req: Request, res: Response) => {
  try {
    const stores = await getMyStores(req.user!.pk_user_id)
    return sendSuccess(res, stores, "Stores retrieved")
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}

export const getStoresByCustomerHandler = async (req: Request, res: Response) => {
  try {
    const stores = await getStoresByCustomer(req.user!.pk_user_id)
    return sendSuccess(res, stores, "Stores retrieved")
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}


export const updateStoreHandler = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateStoreSchema.validate(req.body)
    if (error) {
      return sendError(res, "Validation Error", 400, [error.message])
    }

    const storeId = req.params.pk_store_id as string
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }

    try {
      const store = await updateStore(storeId, req.user!.pk_user_id, value, files)
      return sendSuccess(res, store, "Store updated successfully")
    } catch (error: any) {
      if (error.message === "Store not found") {
        return sendError(res, "Store not found", 404)
      }
      if (error.message === "Forbidden") {
        return sendError(res, "Not the store owner", 403)
      }
      throw error
    }
  } catch (err: any) {
    return sendError(res, "Internal Server Error", 500, [err.message])
  }
}
