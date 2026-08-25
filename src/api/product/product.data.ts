import { prisma } from "../../config/db"
import { Product } from "./product.model"

export const createProductData = async (data: Omit<Product, "pk_product_id" | "Galery" | "AdditionalProduct">) => {
  return prisma.product.create({
    data,
  })
}

export const getProductsByStoreIdData = async (
  fk_store_id: string,
  skip: number,
  take: number
) => {
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { fk_store_id, deleted_at: null },
      include: {
        Galery: true,
        AdditionalProduct: true,
      },
      skip,
      take,
    }),
    prisma.product.count({ where: { fk_store_id, deleted_at: null } }),
  ])
  return { products, total }
}

export const getProductByIdData = async (pk_product_id: number) => {
  return prisma.product.findFirst({
    where: { pk_product_id, deleted_at: null },
    include: {
      Galery: true,
      AdditionalProduct: true,
    },
  })
}

export const updateProductData = async (pk_product_id: number, data: Partial<Omit<Product, "pk_product_id" | "Galery" | "AdditionalProduct">>) => {
  return prisma.product.update({
    where: { pk_product_id },
    data,
    include: {
      Galery: true,
    },
  })
}

export const deleteProductData = async (pk_product_id: number) => {
  return prisma.product.update({
    where: { pk_product_id },
    data: { deleted_at: new Date() },
    include: {
      Galery: true,
    },
  })
}
