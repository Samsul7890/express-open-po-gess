import { prisma } from "../../config/db"
import { Store } from "./store.model"

export const createStoreData = async (data: Omit<Store, "pk_store_id">) => {
  return prisma.store.create({
    data,
  })
}

export const getStoreByIdData = async (pk_store_id: string) => {
  return prisma.store.findUnique({
    where: { pk_store_id },
    include: {
      Product: {
        include: {
          Galery: true,
        },
      },
    },
  })
}

export const getStoresByOwnerData = async (owner: string) => {
  return prisma.store.findMany({
    where: { owner },
  })
}

export const updateStoreData = async (pk_store_id: string, data: Partial<Store>) => {
  return prisma.store.update({
    where: { pk_store_id },
    data,
  })
}

export const createCustomerStoreData = async (fk_user_id: string, fk_store_id: string) => {
  return prisma.customerStore.upsert({
    where: {
      fk_user_id_fk_store_id: {
        fk_user_id,
        fk_store_id,
      },
    },
    create: {
      fk_user_id,
      fk_store_id,
    },
    update: {},
  })
}

export const getStoresByCustomerData = async (fk_user_id: string) => {
  const customerStores = await prisma.customerStore.findMany({
    where: { fk_user_id },
    include: {
      store: true,
    },
    orderBy: {
      created_at: "desc",
    },
  })

  return customerStores.map((cs) => ({
    pk_store_id: cs.store.pk_store_id,
    store_name: cs.store.store_name,
    image_path: cs.store.avatar_path || cs.store.banner_path || null,
    avatar_path: cs.store.avatar_path,
    banner_path: cs.store.banner_path,
  }))
}

