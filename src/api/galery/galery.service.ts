import fs from "fs"
import path from "path"
import { createGaleryData, deleteGaleryData, getGaleryByIdData } from "./galery.data"
import { getProductByIdData } from "../product/product.data"
import { getStoreByIdData } from "../store/store.data"

const deleteFile = (filePath: string) => {
  const fullPath = path.join(process.cwd(), filePath)
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath)
  }
}

export const createGaleryImage = async (
  productId: number,
  ownerId: string,
  file?: Express.Multer.File
) => {
  if (!file) throw new Error("No file provided")

  const product = await getProductByIdData(productId)
  if (!product) throw new Error("Product not found")

  const store = await getStoreByIdData(product.fk_store_id)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")

  return await createGaleryData({
    galery_path: `uploads/${file.filename}`,
    fk_product_id: productId,
  })
}

export const deleteGaleryImage = async (
  galeryId: number,
  ownerId: string
) => {
  const galery = await getGaleryByIdData(galeryId)
  if (!galery) throw new Error("Image not found")

  const product = await getProductByIdData(galery.fk_product_id)
  if (!product) throw new Error("Product not found")

  const store = await getStoreByIdData(product.fk_store_id)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")

  const deleted = await deleteGaleryData(galeryId)
  deleteFile(deleted.galery_path)
  
  return deleted
}
