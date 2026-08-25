import { prisma } from "../../config/db"
import { OrderPO } from "./order.model"

export type CreateOrderInput = {
  data: Omit<OrderPO, "pk_order_id" | "status" | "created_at" | "updated_at">
  additionals: { fk_additional_id: number; price: number }[]
}

export const createOrderData = async (
  data: Omit<OrderPO, "pk_order_id" | "status" | "created_at" | "updated_at">,
  additionals: { fk_additional_id: number; price: number }[]
) => {
  return prisma.orderPO.create({
    data: {
      ...data,
      status: "incoming",
      additionals: {
        create: additionals.map(item => ({
          fk_additional_id: item.fk_additional_id,
          price: item.price,
        })),
      },
    },
    include: {
      additionals: true,
    },
  })
}

export const createMultipleOrdersData = async (orders: CreateOrderInput[]) => {
  return prisma.$transaction(
    orders.map(order =>
      prisma.orderPO.create({
        data: {
          ...order.data,
          status: "incoming",
          additionals: {
            create: order.additionals.map(item => ({
              fk_additional_id: item.fk_additional_id,
              price: item.price,
            })),
          },
        },
        include: {
          additionals: true,
        },
      })
    )
  )
}

export const getOrderByIdData = async (pk_order_id: number) => {
  return prisma.orderPO.findUnique({
    where: { pk_order_id },
    include: {
      openPO: {
        include: {
          product: {
            include: {
              Galery: true,
              AdditionalProduct: true,
            },
          },
          store: true,
        },
      },
      user: {
        select: {
          pk_user_id: true,
          name: true,
          phone_number: true,
        },
      },
      additionals: {
        include: {
          additional: true,
        },
      },
    },
  })
}

export const getOrdersByUserData = async (fk_user_id: string) => {
  return prisma.orderPO.findMany({
    where: {
      fk_user_id,
      status: { in: ["incoming", "confirm"] },
    },
    include: {
      openPO: {
        include: {
          product: {
            include: { Galery: true, AdditionalProduct: true }
          },
          store: true,
        },
      },
      additionals: {
        include: { additional: true }
      }
    },
    orderBy: { created_at: "desc" },
  })
}

export const getOrdersByUserDoneData = async (
  fk_user_id: string,
  page: number = 1,
  pageSize: number = 10
) => {
  const skip = (page - 1) * pageSize
  const [orders, total] = await Promise.all([
    prisma.orderPO.findMany({
      where: {
        fk_user_id,
        status: { in: ["done", "cancel"] },
      },
      include: {
        openPO: {
          include: {
            product: {
              include: { Galery: true }
            },
            store: true,
          },
        },
        additionals: {
          include: { additional: true }
        }
      },
      orderBy: { created_at: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.orderPO.count({
      where: {
        fk_user_id,
        status: { in: ["done", "cancel"] },
      },
    }),
  ])
  return { orders, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export const getOrdersByStoreData = async (
  storeId: string,
  date?: Date,
  status?: "incoming" | "confirm" | "cancel" | "done"
) => {
  const whereClause: any = {
    openPO: {
      fk_store_id: storeId,
    },
  }

  if (date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    whereClause.requested_date = {
      gte: startOfDay,
      lte: endOfDay,
    }
  }

  if (status) {
    whereClause.status = status
  }

  return prisma.orderPO.findMany({
    where: whereClause,
    include: {
      openPO: {
        include: {
          product: true,
        },
      },
      user: {
        select: {
          name: true,
          phone_number: true,
        },
      },
      additionals: {
        include: { additional: true }
      }
    },
    orderBy: { requested_date: "asc" },
  })
}

export const getStoreAgendaGroupedData = async (storeId: string) => {
  const openPOs = await prisma.openPO.findMany({
    where: {
      fk_store_id: storeId,
      OrderPO: {
        some: {
          status: { in: ["incoming", "confirm"] },
        },
      },
    },
    include: {
      product: {
        include: {
          Galery: true,
          AdditionalProduct: true,
        },
      },
      store: true,
      OrderPO: {
        where: {
          status: { not: "cancel" },
        },
        include: {
          user: {
            select: {
              pk_user_id: true,
              name: true,
              phone_number: true,
            },
          },
          additionals: {
            include: {
              additional: true,
            },
          },
          openPO: {
            include: {
              product: {
                include: {
                  Galery: true,
                  AdditionalProduct: true,
                },
              },
              store: true,
            },
          },
        },
        orderBy: {
          requested_date: "asc",
        },
      },
    },
  })

  openPOs.sort((a, b) => {
    if (!a.end_date && !b.end_date) return 0
    if (!a.end_date) return 1
    if (!b.end_date) return -1
    return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
  })

  const statusWeight: Record<string, number> = {
    incoming: 1,
    confirm: 2,
    done: 3,
    cancel: 4,
  }

  for (const po of openPOs) {
    po.OrderPO.sort((a, b) => {
      const weightA = statusWeight[a.status] ?? 99
      const weightB = statusWeight[b.status] ?? 99
      if (weightA !== weightB) {
        return weightA - weightB
      }
      return new Date(a.requested_date).getTime() - new Date(b.requested_date).getTime()
    })
  }

  return openPOs
}

export const updateOrderStatusData = async (
  pk_order_id: number,
  status: "incoming" | "confirm" | "cancel" | "done"
) => {
  return prisma.orderPO.update({
    where: { pk_order_id },
    data: { status },
  })
}

export const updateOrderData = async (
  pk_order_id: number,
  data: {
    qty?: number
    notes?: string | null
    requested_date?: Date | string
    status?: "incoming" | "confirm" | "cancel" | "done"
  }
) => {
  return prisma.orderPO.update({
    where: { pk_order_id },
    data,
  })
}

export const updateOrderDataWithAdditionals = async (
  pk_order_id: number,
  data: {
    qty?: number
    notes?: string | null
    requested_date?: Date | string
    status?: "incoming" | "confirm" | "cancel" | "done"
  },
  additionals?: { fk_additional_id: number; price: number }[],
  deletedAdditionals?: number[]
) => {
  return prisma.$transaction(async (tx) => {
    if (additionals !== undefined) {
      await tx.additionalPO.deleteMany({
        where: { fk_order_id: pk_order_id },
      })
      if (additionals.length > 0) {
        await tx.additionalPO.createMany({
          data: additionals.map((item) => ({
            fk_order_id: pk_order_id,
            fk_additional_id: item.fk_additional_id,
            price: item.price,
          })),
        })
      }
    } else if (deletedAdditionals !== undefined && deletedAdditionals.length > 0) {
      await tx.additionalPO.deleteMany({
        where: {
          fk_order_id: pk_order_id,
          OR: [
            { fk_additional_id: { in: deletedAdditionals } },
            { pk_additional_po_id: { in: deletedAdditionals } },
          ],
        },
      })
    }

    return tx.orderPO.update({
      where: { pk_order_id },
      data,
      include: {
        openPO: {
          include: {
            product: {
              include: { Galery: true, AdditionalProduct: true },
            },
            store: true,
          },
        },
        user: {
          select: { name: true, phone_number: true },
        },
        additionals: {
          include: { additional: true },
        },
      },
    })
  })
}

/**
 * Get paginated done/cancel orders for a store with optional date range and status filter.
 * Max date range: 1 month. Defaults to last 1 month.
 * Also computes omset (total revenue from done orders).
 */
export const getStoreHistoryOrdersData = async (
  storeId: string,
  page: number = 1,
  pageSize: number = 10,
  status?: "done" | "cancel",
  dateFrom?: Date,
  dateTo?: Date,
  search?: string
) => {
  const skip = (page - 1) * pageSize

  // Default: last 1 month
  const now = new Date()
  const defaultFrom = new Date(now)
  defaultFrom.setMonth(defaultFrom.getMonth() - 1)
  defaultFrom.setHours(0, 0, 0, 0)

  const effectiveDateFrom = dateFrom ?? defaultFrom
  const effectiveDateTo = dateTo ?? now

  const whereClause: any = {
    openPO: {
      fk_store_id: storeId,
    },
    status: status ? status : { in: ["done", "cancel"] as const },
    created_at: {
      gte: effectiveDateFrom,
      lte: effectiveDateTo,
    },
  }

  if (search) {
    whereClause.user = {
      name: { contains: search, mode: "insensitive" },
    }
  }

  const [orders, total] = await Promise.all([
    prisma.orderPO.findMany({
      where: whereClause,
      include: {
        openPO: {
          include: {
            product: {
              include: { Galery: true, AdditionalProduct: true },
            },
            store: true,
          },
        },
        user: {
          select: { pk_user_id: true, name: true, phone_number: true },
        },
        additionals: {
          include: { additional: true },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.orderPO.count({ where: whereClause }),
  ])

  // Compute omset: sum of (price + additionals) * qty for done orders only
  const allDoneOrders = await prisma.orderPO.findMany({
    where: {
      openPO: { fk_store_id: storeId },
      status: "done",
      created_at: { gte: effectiveDateFrom, lte: effectiveDateTo },
    },
    select: {
      price: true,
      qty: true,
      additionals: { select: { price: true } },
    },
  })

  const omset = allDoneOrders.reduce((sum, order) => {
    const addTotal = order.additionals.reduce((a, add) => a + add.price, 0)
    return sum + (order.price + addTotal) * order.qty
  }, 0)

  const totalDone = await prisma.orderPO.count({
    where: {
      openPO: { fk_store_id: storeId },
      status: "done",
      created_at: { gte: effectiveDateFrom, lte: effectiveDateTo },
    },
  })

  const totalCancel = await prisma.orderPO.count({
    where: {
      openPO: { fk_store_id: storeId },
      status: "cancel",
      created_at: { gte: effectiveDateFrom, lte: effectiveDateTo },
    },
  })

  return {
    orders,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    omset,
    totalDone,
    totalCancel,
    dateFrom: effectiveDateFrom,
    dateTo: effectiveDateTo,
  }
}

export const getStoreDashboardData = async (storeId: string) => {
  // 1. Upcoming & Active Orders & Confirmation Count
  const activeOrders = await prisma.orderPO.findMany({
    where: {
      openPO: { fk_store_id: storeId },
      status: { in: ["incoming", "confirm"] },
    },
    select: {
      status: true,
      price: true,
      qty: true,
      additionals: { select: { price: true } },
    },
  })

  let total_revenue_upcoming = 0
  let waiting_confirmation_count = 0

  for (const order of activeOrders) {
    if (order.status === "incoming") {
      waiting_confirmation_count++
    }
    const addTotal = order.additionals.reduce((sum, a) => sum + a.price, 0)
    total_revenue_upcoming += (order.price + addTotal) * order.qty
  }

  // 2. Weekly Stats (Last 7 Days)
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const weeklyOrders = await prisma.orderPO.findMany({
    where: {
      openPO: { fk_store_id: storeId },
      created_at: { gte: sevenDaysAgo },
      status: { not: "cancel" },
    },
    select: {
      created_at: true,
      price: true,
      qty: true,
      additionals: { select: { price: true } },
    },
  })

  const daysMap: { [key: string]: { day: string; date: string; revenue: number; orders_count: number } } = {}
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split("T")[0]
    daysMap[dateStr] = {
      day: dayNames[d.getDay()],
      date: dateStr,
      revenue: 0,
      orders_count: 0,
    }
  }

  for (const order of weeklyOrders) {
    const dateStr = new Date(order.created_at).toISOString().split("T")[0]
    if (daysMap[dateStr]) {
      const addTotal = order.additionals.reduce((sum, a) => sum + a.price, 0)
      daysMap[dateStr].revenue += (order.price + addTotal) * order.qty
      daysMap[dateStr].orders_count += 1
    }
  }

  const weekly_stats = Object.values(daysMap)

  // 3. Recent Activities (Last 10 orders)
  const recentOrders = await prisma.orderPO.findMany({
    where: {
      openPO: { fk_store_id: storeId },
    },
    include: {
      openPO: {
        include: {
          product: {
            include: { Galery: true },
          },
        },
      },
      user: {
        select: { name: true },
      },
      additionals: { select: { price: true } },
    },
    orderBy: { created_at: "desc" },
    take: 10,
  })

  const recent_activities = recentOrders.map((order) => {
    const addTotal = order.additionals.reduce((sum, a) => sum + a.price, 0)
    const total_price = (order.price + addTotal) * order.qty
    return {
      pk_order_id: order.pk_order_id,
      product_name: order.openPO?.product?.product_name || "—",
      customer_name: order.user?.name || "—",
      galery_path: order.openPO?.product?.Galery?.[0]?.galery_path || null,
      status: order.status,
      created_at: order.created_at,
      total_price,
      qty: order.qty,
    }
  })


  const activePO = await prisma.openPO.count({
    where: {
      fk_store_id: storeId,
      OR: [
        { always_ready: true },
        { always_ready: false, end_date: { gt: now } },
      ],
    },
  })
  let active_orders_count = activePO


  return {
    total_revenue_upcoming,
    waiting_confirmation_count,
    active_orders_count,
    weekly_stats,
    recent_activities,
  }
}

