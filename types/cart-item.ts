export interface CartItem {
  id: string
  product_id: string
  name: string
  quantity: number
  unit_price: number
  tax_rate: number
  discount_percent: number
  line_total: number
}
