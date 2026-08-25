import { createOpenPOData, deleteOpenPOData, getOpenPOByIdData, getOpenPOsByStoreIdData, updateOpenPOData } from "./open-po.data"
import { getStoreByIdData } from "../store/store.data"
import { getProductByIdData } from "../product/product.data"

export const createOpenPO = async (storeId: string, ownerId: string, data: any) => {
  const store = await getStoreByIdData(storeId)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")

  const product = await getProductByIdData(data.fk_product_id)
  if (!product || product.fk_store_id !== storeId) throw new Error("Product not found or doesn't belong to store")

  if (!data.always_ready && (!data.start_date || !data.end_date)) {
    throw new Error("Start date and end date are required if not always ready")
  }

  // When always_ready, default start_date to now so close PO works later
  const startDate = data.start_date
    ? new Date(data.start_date)
    : data.always_ready
    ? new Date()
    : null

  return await createOpenPOData({
    start_date: startDate,
    end_date: data.end_date ? new Date(data.end_date) : null,
    cut_off: Number(data.cut_off),
    always_ready: data.always_ready || false,
    fk_product_id: data.fk_product_id,
    fk_store_id: storeId,
  })
}

export const getStoreOpenPOs = async (storeId: string) => {
  return await getOpenPOsByStoreIdData(storeId)
}

export const getOpenPOById = async (poId: string) => {
  return await getOpenPOByIdData(poId)
}

export const updateOpenPO = async (poId: string, ownerId: string, data: any) => {
  const po = await getOpenPOByIdData(poId)
  if (!po) throw new Error("Not found")

  const store = await getStoreByIdData(po.fk_store_id)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")

  const updateData: any = {}
  if (data.start_date !== undefined) updateData.start_date = data.start_date ? new Date(data.start_date) : null
  if (data.end_date !== undefined) updateData.end_date = data.end_date ? new Date(data.end_date) : null
  if (data.cut_off !== undefined) updateData.cut_off = Number(data.cut_off)
  if (data.always_ready !== undefined) updateData.always_ready = data.always_ready

  // Re-check validation
  const always_ready = data.always_ready !== undefined ? data.always_ready : po.always_ready
  const start_date = updateData.start_date !== undefined ? updateData.start_date : po.start_date
  const end_date = updateData.end_date !== undefined ? updateData.end_date : po.end_date
  
  if (!always_ready && (!start_date || !end_date)) {
    throw new Error("Start date and end date are required if not always ready")
  }

  return await updateOpenPOData(poId, updateData)
}

export const deleteOpenPO = async (poId: string, ownerId: string) => {
  const po = await getOpenPOByIdData(poId)
  if (!po) throw new Error("Not found")

  const store = await getStoreByIdData(po.fk_store_id)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")

  return await deleteOpenPOData(poId)
}
