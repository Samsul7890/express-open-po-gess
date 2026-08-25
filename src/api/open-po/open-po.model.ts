export interface OpenPO {
  pk_po_id: number
  start_date: Date | null
  end_date: Date | null
  cut_off: number
  always_ready: boolean
  fk_product_id: number
  fk_store_id: string
}
