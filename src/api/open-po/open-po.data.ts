import { prisma } from "../../config/db"
import { OpenPO } from "./open-po.model"

export const createOpenPOData = async (data: Omit<OpenPO, "pk_po_id">) => {
  return prisma.openPO.create({ data })
}

export const getOpenPOsByStoreIdData = async (fk_store_id: string) => {
  const now = new Date()
  return prisma.openPO.findMany({
    where: {
      fk_store_id,
      OR: [
        { always_ready: true },
        { always_ready: false, end_date: { gt: now } },
      ],
    },
    include: {
      product: {
        include: {
          Galery: true,
          AdditionalProduct: true,
        },
      },
    },
  })
}

export const getOpenPOByIdData = async (pk_po_id: string) => {
  return prisma.openPO.findUnique({
    where: { pk_po_id },
    include: {
      product: {
        include: {
          Galery: true,
          AdditionalProduct: true,
        },
      },
      store: true,
    },
  })
}

export const updateOpenPOData = async (pk_po_id: string, data: Partial<OpenPO>) => {
  return prisma.openPO.update({ where: { pk_po_id }, data: data as any })
}

export const deleteOpenPOData = async (pk_po_id: string) => {
  return prisma.openPO.delete({ where: { pk_po_id } })
}
