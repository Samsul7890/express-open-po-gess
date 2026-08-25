import fs from "fs"
import path from "path"
import { createStoreData, getStoreByIdData, getStoresByOwnerData, updateStoreData, getStoresByCustomerData } from "./store.data"
import { Store } from "./store.model"

const deleteFile = (filePath: string) => {
  const fullPath = path.join(process.cwd(), filePath)
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath)
  }
}

export const createStore = async (
  ownerId: string,
  storeData: any,
  files?: { banner?: Express.Multer.File[]; avatar?: Express.Multer.File[] }
) => {
  let banner_path = null
  let avatar_path = null

  if (files?.banner && files.banner.length > 0) {
    banner_path = `uploads/${files.banner[0].filename}`
  }

  if (files?.avatar && files.avatar.length > 0) {
    avatar_path = `uploads/${files.avatar[0].filename}`
  }

  const newStore = await createStoreData({
    store_name: storeData.store_name,
    phone_number: storeData.phone_number || null,
    banner_path,
    avatar_path,
    owner: ownerId,
  })

  return newStore
}

export const getStoreById = async (storeId: string) => {
  return await getStoreByIdData(storeId)
}

export const getMyStores = async (ownerId: string) => {
  return await getStoresByOwnerData(ownerId)
}

export const getStoresByCustomer = async (userId: string) => {
  return await getStoresByCustomerData(userId)
}

export const updateStore = async (
  storeId: string,
  ownerId: string,
  storeData: any,
  files?: { banner?: Express.Multer.File[]; avatar?: Express.Multer.File[] }
) => {
  const existingStore = await getStoreByIdData(storeId)

  if (!existingStore) {
    throw new Error("Store not found")
  }

  if (existingStore.owner !== ownerId) {
    throw new Error("Forbidden")
  }

  let banner_path = existingStore.banner_path
  let avatar_path = existingStore.avatar_path

  if (files?.banner && files.banner.length > 0) {
    // Delete old banner
    if (existingStore.banner_path) {
      deleteFile(existingStore.banner_path)
    }
    banner_path = `uploads/${files.banner[0].filename}`
  }

  if (files?.avatar && files.avatar.length > 0) {
    // Delete old avatar
    if (existingStore.avatar_path) {
      deleteFile(existingStore.avatar_path)
    }
    avatar_path = `uploads/${files.avatar[0].filename}`
  }

  const updatedStore = await updateStoreData(storeId, {
    store_name: storeData.store_name,
    phone_number: storeData.phone_number,
    banner_path,
    avatar_path,
  })

  return updatedStore
}

