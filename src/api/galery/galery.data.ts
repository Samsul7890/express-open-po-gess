import { prisma } from "../../config/db"
import { Galery } from "./galery.model"

export const createGaleryData = async (data: Omit<Galery, "pk_galery_id">) => {
  return prisma.galery.create({
    data,
  })
}

export const getGaleryByIdData = async (pk_galery_id: number) => {
  return prisma.galery.findUnique({
    where: { pk_galery_id },
  })
}

export const deleteGaleryData = async (pk_galery_id: number) => {
  return prisma.galery.delete({
    where: { pk_galery_id },
  })
}
