import { Galery } from "../galery/galery.model"
import { AdditionalProduct } from "../additional-product/additional-product.model"

export interface Product {
  pk_product_id: number
  product_name: string
  description: string | null
  price: number
  fk_store_id: string
  Galery?: Galery[]
  AdditionalProduct?: AdditionalProduct[]
}
