import { prisma } from "../../config/db"
import { AdditionalProduct } from "./additional-product.model"

export const createAdditionalData = async (data: Omit<AdditionalProduct, "pk_additional_id">) => {
  return prisma.additionalProduct.create({ data })
}

export const getAdditionalByIdData = async (pk_additional_id: number) => {
  return prisma.additionalProduct.findUnique({ where: { pk_additional_id } })
}

export const updateAdditionalData = async (pk_additional_id: number, data: Partial<AdditionalProduct>) => {
  return prisma.additionalProduct.update({ where: { pk_additional_id }, data })
}

export const deleteAdditionalData = async (pk_additional_id: number) => {
  return prisma.additionalProduct.delete({ where: { pk_additional_id } })
}
