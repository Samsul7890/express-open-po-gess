export interface OrderPO {
  pk_order_id: number
  fk_user_id: string
  fk_po_id: string
  requested_date: Date
  status: "incoming" | "confirm" | "cancel" | "done"
  qty: number
  price: number
  notes: string | null
  created_at: Date
  updated_at: Date
}

export interface AdditionalPO {
  pk_additional_po_id: number
  fk_additional_id: number
  fk_order_id: number
  price: number
}
