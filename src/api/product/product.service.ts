import { createProductData, deleteProductData, getProductByIdData, getProductsByStoreIdData, updateProductData } from "./product.data"
import { getStoreByIdData } from "../store/store.data"
import { prisma } from "../../config/db"
import { uploadToSupabase, deleteFromSupabase } from "../../services/storage.service"

export const createProduct = async (
  storeId: string,
  ownerId: string,
  productData: any,
  additionals: { name: string; price: number }[],
  files?: Express.Multer.File[]
) => {
  const store = await getStoreByIdData(storeId)
  if (!store) throw new Error("Store not found")
  if (store.owner !== ownerId) throw new Error("Forbidden")

  const uploadedGaleryPaths: string[] = []
  if (files && files.length > 0) {
    for (const file of files) {
      const url = await uploadToSupabase(file, "products")
      uploadedGaleryPaths.push(url)
    }
  }

  const galeryData = uploadedGaleryPaths.map(path => ({
    galery_path: path
  }))

  const additionalData = additionals && additionals.length > 0 ? additionals.map(a => ({
    name: a.name,
    price: Number(a.price)
  })) : []

  const newProduct = await prisma.product.create({
    data: {
      product_name: productData.product_name,
      description: productData.description || null,
      price: Number(productData.price),
      fk_store_id: storeId,
      Galery: {
        create: galeryData
      },
      AdditionalProduct: {
        create: additionalData
      }
    }
  })

  return await getProductByIdData(newProduct.pk_product_id)
}

export const getStoreProducts = async (storeId: string, page: number, limit: number) => {
  const skip = (page - 1) * limit
  const { products, total } = await getProductsByStoreIdData(storeId, skip, limit)
  
  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export const getProductById = async (productId: number) => {
  return await getProductByIdData(productId)
}

export const updateProduct = async (
  productId: number,
  ownerId: string,
  productData: {
    product_name?: string
    description?: string | null
    price?: number
    deleted_galery_ids?: number[]
    deleted_additional_ids?: number[]
    add_additionals?: { name: string; price: number }[]
    update_additionals?: { id: number; name: string; price: number }[]
  },
  files?: Express.Multer.File[]
) => {
  const product = await getProductByIdData(productId)
  if (!product) throw new Error("Product not found")

  const store = await getStoreByIdData(product.fk_store_id)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")

  // Upload new gallery files to Supabase
  const uploadedGaleryPaths: string[] = []
  if (files && files.length > 0) {
    for (const file of files) {
      const url = await uploadToSupabase(file, "products")
      uploadedGaleryPaths.push(url)
    }
  }

  // Collect gallery rows to delete so we can remove files from Supabase after transaction
  let galeryPathsToDelete: string[] = []

  if (productData.deleted_galery_ids && productData.deleted_galery_ids.length > 0) {
    const toDelete = await prisma.galery.findMany({
      where: { pk_galery_id: { in: productData.deleted_galery_ids }, fk_product_id: productId },
      select: { galery_path: true }
    })
    galeryPathsToDelete = toDelete.map(g => g.galery_path)
  }

  // Run all DB mutations in a single transaction
  await prisma.$transaction(async (tx) => {
    // 1. Core product fields
    const updateData: any = {}
    if (productData.product_name !== undefined) updateData.product_name = productData.product_name
    if (productData.description !== undefined) updateData.description = productData.description
    if (productData.price !== undefined) updateData.price = Number(productData.price)

    if (Object.keys(updateData).length > 0) {
      await tx.product.update({ where: { pk_product_id: productId }, data: updateData })
    }

    // 2. Delete gallery rows
    if (productData.deleted_galery_ids && productData.deleted_galery_ids.length > 0) {
      await tx.galery.deleteMany({
        where: { pk_galery_id: { in: productData.deleted_galery_ids }, fk_product_id: productId }
      })
    }

    // 3. Add new gallery images
    if (uploadedGaleryPaths.length > 0) {
      await tx.galery.createMany({
        data: uploadedGaleryPaths.map(path => ({
          galery_path: path,
          fk_product_id: productId
        }))
      })
    }

    // 4. Delete additionals
    if (productData.deleted_additional_ids && productData.deleted_additional_ids.length > 0) {
      await tx.additionalProduct.deleteMany({
        where: { pk_additional_id: { in: productData.deleted_additional_ids }, fk_product_id: productId }
      })
    }

    // 5. Add new additionals
    if (productData.add_additionals && productData.add_additionals.length > 0) {
      await tx.additionalProduct.createMany({
        data: productData.add_additionals.map(a => ({
          name: a.name,
          price: Number(a.price),
          fk_product_id: productId
        }))
      })
    }

    // 6. Update existing additionals
    if (productData.update_additionals && productData.update_additionals.length > 0) {
      await Promise.all(
        productData.update_additionals.map(a =>
          tx.additionalProduct.update({
            where: { pk_additional_id: a.id, fk_product_id: productId },
            data: { name: a.name, price: Number(a.price) }
          })
        )
      )
    }
  })

  // Delete remote files AFTER transaction succeeds
  for (const path of galeryPathsToDelete) {
    await deleteFromSupabase(path)
  }

  return await getProductByIdData(productId)
}

export const deleteProduct = async (productId: number, ownerId: string) => {
  const product = await getProductByIdData(productId)
  if (!product) throw new Error("Product not found")

  const store = await getStoreByIdData(product.fk_store_id)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")

  // Collect gallery paths to delete from storage
  const galeryPaths = product.Galery?.map(g => g.galery_path) || []

  const deleted = await deleteProductData(productId)

  for (const path of galeryPaths) {
    await deleteFromSupabase(path)
  }
  
  return deleted
}

