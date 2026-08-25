import { createAdditionalData, deleteAdditionalData, getAdditionalByIdData, updateAdditionalData } from "./additional-product.data"
import { getProductByIdData } from "../product/product.data"
import { getStoreByIdData } from "../store/store.data"

export const createAdditional = async (productId: number, ownerId: string, additionalData: any) => {
  const product = await getProductByIdData(productId)
  if (!product) throw new Error("Product not found")

  const store = await getStoreByIdData(product.fk_store_id)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")

  return await createAdditionalData({
    name: additionalData.name,
    price: Number(additionalData.price),
    fk_product_id: productId,
  })
}

export const updateAdditional = async (additionalId: number, ownerId: string, additionalData: any) => {
  const additional = await getAdditionalByIdData(additionalId)
  if (!additional) throw new Error("Not found")

  const product = await getProductByIdData(additional.fk_product_id)
  if (!product) throw new Error("Product not found")

  const store = await getStoreByIdData(product.fk_store_id)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")

  return await updateAdditionalData(additionalId, additionalData)
}

export const deleteAdditional = async (additionalId: number, ownerId: string) => {
  const additional = await getAdditionalByIdData(additionalId)
  if (!additional) throw new Error("Not found")

  const product = await getProductByIdData(additional.fk_product_id)
  if (!product) throw new Error("Product not found")

  const store = await getStoreByIdData(product.fk_store_id)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")

  return await deleteAdditionalData(additionalId)
}
