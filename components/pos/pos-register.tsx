'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus, Receipt } from 'lucide-react'
import POSCart from './pos-cart'
import ProductSelector from './product-selector'

interface POSRegisterProps {
  business: any
}

interface CartItem {
  id: string
  product_id: string
  name: string
  quantity: number
  unit_price: number
  tax_rate: number
  discount_percent: number
  line_total: number
}

export default function POSRegister({ business }: POSRegisterProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const calculateTotals = () => {
    let subtotal = 0
    let totalTax = 0

    cart.forEach((item) => {
      const lineSubtotal = item.quantity * item.unit_price
      const discountAmount = (lineSubtotal * item.discount_percent) / 100
      const taxableAmount = lineSubtotal - discountAmount
      const tax = (taxableAmount * item.tax_rate) / 100

      subtotal += lineSubtotal - discountAmount
      totalTax += tax
    })

    return {
      subtotal,
      tax: totalTax,
      total: subtotal + totalTax,
    }
  }

  const handleAddProduct = (product: any, quantity: number) => {
    const existingItem = cart.find((item) => item.product_id === product.id)

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      )
    } else {
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        product_id: product.id,
        name: product.name,
        quantity,
        unit_price: product.selling_price,
        tax_rate: product.tax_rate || 0,
        discount_percent: 0,
        line_total: quantity * product.selling_price,
      }
      setCart([...cart, newItem])
    }
  }

  const handleRemoveItem = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId))
  }

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId)
    } else {
      setCart(
        cart.map((item) =>
          item.id === itemId
            ? { ...item, quantity }
            : item
        )
      )
    }
  }

  const handleUpdateDiscount = (itemId: string, discount: number) => {
    setCart(
      cart.map((item) =>
        item.id === itemId
          ? { ...item, discount_percent: Math.min(100, Math.max(0, discount)) }
          : item
      )
    )
  }

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }

    setProcessing(true)
    const supabase = createClient()
    const { subtotal, tax, total } = calculateTotals()

    try {
      const receiptNumber = `REC-${Date.now()}`

      // Create sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            business_id: business.id,
            receipt_number: receiptNumber,
            customer_id: customer?.id || null,
            sale_type: 'retail',
            subtotal,
            tax_amount: tax,
            total_amount: total,
            payment_method: paymentMethod,
            payment_status: 'completed',
            sale_status: 'completed',
            created_by: user?.id,
          },
        ])
        .select()
        .single()

      if (saleError) throw saleError

      // Add sale items
      const saleItems = cart.map((item) => ({
        sale_id: saleData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: (item.quantity * item.unit_price * item.tax_rate) / 100,
        discount_percent: item.discount_percent,
        discount_amount: (item.quantity * item.unit_price * item.discount_percent) / 100,
        line_total: item.line_total,
      }))

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems)

      if (itemsError) throw itemsError

      // Print receipt
      alert(`Sale completed! Receipt: ${receiptNumber}`)
      setCart([])
      setCustomer(null)
      setPaymentMethod('cash')
    } catch (error) {
      console.error('Error completing sale:', error)
      alert('Error completing sale. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const { subtotal, tax, total } = calculateTotals()

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Point of Sale Register</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <div className="lg:col-span-2">
            <ProductSelector business={business} onAddProduct={handleAddProduct} />
          </div>

          {/* Cart and Payment */}
          <div className="space-y-4">
            {/* Cart Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Sale Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-3">
                    {cart.length} {cart.length === 1 ? 'item' : 'items'} in cart
                  </p>

                  {/* Totals */}
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{business.currency_code} {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span className="font-medium">{business.currency_code} {tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{business.currency_code} {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="mt-4">
                    <label className="text-xs font-semibold text-foreground mb-2 block">
                      Payment Method
                    </label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Complete Sale Button */}
                  <Button
                    onClick={handleCompleteSale}
                    disabled={cart.length === 0 || processing}
                    className="w-full mt-4"
                    size="lg"
                  >
                    {processing ? 'Processing...' : 'Complete Sale'}
                  </Button>

                  {cart.length > 0 && (
                    <Button
                      onClick={() => setCart([])}
                      variant="outline"
                      className="w-full mt-2"
                    >
                      Clear Cart
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cart Items */}
            {cart.length > 0 && (
              <POSCart
                items={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onUpdateDiscount={handleUpdateDiscount}
                currency={business.currency_code}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
