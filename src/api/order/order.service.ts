import { createMultipleOrdersData, createOrderData, getOrderByIdData, getOrdersByStoreData, getOrdersByUserData, getOrdersByUserDoneData, updateOrderStatusData, updateOrderData, updateOrderDataWithAdditionals, getStoreAgendaGroupedData, getStoreHistoryOrdersData, getStoreDashboardData, CreateOrderInput } from "./order.data"
import { getOpenPOByIdData } from "../open-po/open-po.data"
import { getStoreByIdData, createCustomerStoreData } from "../store/store.data"

export const createOrder = async (userId: string, storeId: string, data: any) => {
  const isArray = Array.isArray(data)
  const items = isArray ? data : [data]

  const preparedOrders: CreateOrderInput[] = []

  for (const item of items) {
    const poId = item.pk_po_id
    if (!poId) throw new Error("Invalid PO ID in order payload")

    const po = await getOpenPOByIdData(poId)
    if (!po || po.fk_store_id !== storeId) throw new Error(`Open PO not found for ID ${poId}`)

    const requestedDate = new Date(item.requested_date)

    if (!po.always_ready) {
      if (po.start_date && po.end_date) {
        if (requestedDate < po.start_date || requestedDate > po.end_date) {
          throw new Error("Requested date is outside the allowed Open PO window")
        }
      }

      const cutOffDate = new Date(requestedDate)
      cutOffDate.setDate(cutOffDate.getDate() - po.cut_off)
      if (new Date() > cutOffDate) {
        throw new Error(`Order cut-off time has passed. Must be ${po.cut_off} days before requested date.`)
      }
    }

    const price = po.product.price

    const additionalIds: number[] = item.additional_ids || []
    const additionals = additionalIds.map(addId => {
      const foundAdd = po.product.AdditionalProduct.find((ap: any) => ap.pk_additional_id === addId)
      return {
        fk_additional_id: addId,
        price: foundAdd ? foundAdd.price : 0,
      }
    })

    preparedOrders.push({
      data: {
        fk_user_id: userId,
        fk_po_id: poId,
        requested_date: requestedDate,
        qty: Number(item.qty),
        price,
        notes: item.notes || null,
      },
      additionals,
    })
  }

  if (isArray) {
    return await createMultipleOrdersData(preparedOrders)
  } else {
    return await createOrderData(preparedOrders[0].data, preparedOrders[0].additionals)
  }
}

export const getMyOrders = async (userId: string) => {
  return await getOrdersByUserData(userId)
}

export const getMyDoneOrders = async (userId: string, page: number, pageSize: number) => {
  return await getOrdersByUserDoneData(userId, page, pageSize)
}

export const getOrderById = async (orderId: number, userId: string) => {
  const order = await getOrderByIdData(orderId)
  if (!order) throw new Error("Order not found")

  // Can view if it's the customer OR the store owner
  if (order.fk_user_id !== userId && order.openPO.store.owner !== userId) {
    throw new Error("Forbidden")
  }

  return order
}

export const getStoreAgenda = async (
  storeId: string,
  ownerId: string,
  date?: string,
  status?: "incoming" | "confirm" | "cancel" | "done"
) => {
  const store = await getStoreByIdData(storeId)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")

  const queryDate = date ? new Date(date) : undefined
  const orders = await getOrdersByStoreData(storeId, queryDate, status)

  // Calculate summary
  const summary = {
    total_orders: orders.length,
    total_income: 0,
  }

  orders.forEach(order => {
    if (order.status !== "cancel") {
      let orderTotal = order.price * order.qty
      order.additionals.forEach(add => {
        orderTotal += add.price * order.qty
      })
      summary.total_income += orderTotal
    }
  })

  return { summary, orders }
}

export const getStoreAgendaGrouped = async (storeId: string, ownerId: string) => {
  const store = await getStoreByIdData(storeId)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")
  return await getStoreAgendaGroupedData(storeId)
}

export const updateOrderStatus = async (
  orderId: number,
  ownerId: string,
  status: "incoming" | "confirm" | "cancel" | "done"
) => {
  const order = await getOrderByIdData(orderId)
  if (!order) throw new Error("Order not found")

  const store = await getStoreByIdData(order.openPO.fk_store_id)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")

  const updatedOrder = await updateOrderStatusData(orderId, status)

  if (status === "done") {
    await createCustomerStoreData(order.fk_user_id, order.openPO.fk_store_id)
  }

  return updatedOrder
}

export const updateOrderDetails = async (
  orderId: number,
  userId: string,
  userRole: string,
  data: { qty?: number; notes?: string | null; requested_date?: string | Date; status?: "cancel" }
) => {
  const order = await getOrderByIdData(orderId)
  if (!order) throw new Error("Order not found")

  if (order.status === "cancel" || order.status === "done") {
    throw new Error("Cannot update a cancelled or completed order")
  }

  // Authorization Check
  if (userRole === "customer") {
    if (order.fk_user_id !== userId) throw new Error("Forbidden")
    if (order.status !== "incoming") throw new Error("Customers can only update incoming orders")
  } else if (userRole === "seller") {
    if (order.openPO.store.owner !== userId) throw new Error("Forbidden")
  } else {
    throw new Error("Forbidden")
  }

  
  const { additional_ids, deleted_additional_ids, ...rest } = data as any
  const toDelete: number[] | undefined = deleted_additional_ids

  if (rest.requested_date) {
    const requestedDate = new Date(rest.requested_date)
    const po = order.openPO

    if (!po.always_ready) {
      if (po.start_date && po.end_date) {
        if (requestedDate < po.start_date || requestedDate > po.end_date && userRole !== "seller") {
          throw new Error("Requested date is outside the allowed Open PO window")
        }
      }

      const cutOffDate = new Date(requestedDate)
      cutOffDate.setDate(cutOffDate.getDate() - po.cut_off)
      if (new Date() > cutOffDate && userRole !== "seller") {
        throw new Error(`Order cut-off time has passed. Must be ${po.cut_off} days before requested date.`)
      }
    }
    rest.requested_date = requestedDate
  }

  let preparedAdditionals: { fk_additional_id: number; price: number }[] | undefined = undefined
  if (additional_ids !== undefined) {
    const po = order.openPO
    preparedAdditionals = (additional_ids as number[]).map((addId: number) => {
      const foundAdd = po.product.AdditionalProduct?.find((ap: any) => ap.pk_additional_id === addId)
      return {
        fk_additional_id: addId,
        price: foundAdd ? foundAdd.price : 0,
      }
    })
  }

  const updatedOrder = await updateOrderDataWithAdditionals(orderId, rest, preparedAdditionals, toDelete)

  if (rest.status === "done") {
    await createCustomerStoreData(order.fk_user_id, order.openPO.fk_store_id)
  }

  return updatedOrder
}

export const getStoreHistoryOrders = async (
  storeId: string,
  ownerId: string,
  page: number,
  pageSize: number,
  status?: "done" | "cancel",
  dateFrom?: string,
  dateTo?: string,
  search?: string
) => {
  const store = await getStoreByIdData(storeId)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")

  let parsedFrom: Date | undefined
  let parsedTo: Date | undefined

  if (dateFrom) {
    parsedFrom = new Date(dateFrom)
    parsedFrom.setHours(0, 0, 0, 0)
  }
  if (dateTo) {
    parsedTo = new Date(dateTo)
    parsedTo.setHours(23, 59, 59, 999)
  }

  // Enforce max 1-month range
  if (parsedFrom && parsedTo) {
    const diffMs = parsedTo.getTime() - parsedFrom.getTime()
    const maxMs = 31 * 24 * 60 * 60 * 1000
    if (diffMs > maxMs) throw new Error("Date range exceeds maximum of 1 month")
  }

  return await getStoreHistoryOrdersData(storeId, page, pageSize, status, parsedFrom, parsedTo, search)
}

export const getStoreDashboard = async (storeId: string, ownerId: string) => {
  const store = await getStoreByIdData(storeId)
  if (!store || store.owner !== ownerId) throw new Error("Forbidden")
  return await getStoreDashboardData(storeId)
}
