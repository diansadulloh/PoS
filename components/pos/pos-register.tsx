'use client'

import React from "react"
import { CartItem } from '@/types/cart-item' // Declare CartItem variable
import { ShoppingCart } from 'lucide-react' // Declare ShoppingCart variable

import { AlertDialogCancel } from "@/components/ui/alert-dialog"

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Trash2, Plus, Receipt, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import POSCart from './pos-cart'
import ProductSelector from './product-selector'

interface POSRegisterProps {
  business: any
  refreshTrigger?: number
  pendingOrdersComponent?: React.ReactNode
}

export default function POSRegister({ business, refreshTrigger = 0, pendingOrdersComponent }: POSRegisterProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [checkoutType, setCheckoutType] = useState<'table' | 'takeaway'>('takeaway')
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [lastSaleReceipt, setLastSaleReceipt] = useState<string | null>(null)
  const [openRegister, setOpenRegister] = useState<any>(null)
  const [checkingRegister, setCheckingRegister] = useState(true)
  const { toast } = useToast()

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

  useEffect(() => {
    const checkOpenRegister = async () => {
      setCheckingRegister(true)
      const supabase = createClient()
      
      try {
        // Check if there's an open cash register for this business
        const { data: openRegisters, error } = await supabase
          .from('cash_registers')
          .select('id, register_name, status')
          .eq('business_id', business.id)
          .eq('status', 'open')
          .limit(1)

        if (error) {
          console.error('[v0] Error checking open register:', error)
          return
        }

        if (openRegisters && openRegisters.length > 0) {
          setOpenRegister(openRegisters[0])
        } else {
          setOpenRegister(null)
        }
      } finally {
        setCheckingRegister(false)
      }
    }

    if (business?.id) {
      checkOpenRegister()
    }
  }, [business?.id])

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
    // Validate product data
    if (!product || !product.id || !product.name || product.selling_price === undefined) {
      console.error('[v0] Invalid product data:', product)
      toast({
        title: 'Error',
        description: 'Invalid product data. Please try again.',
        variant: 'destructive',
      })
      return
    }

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      console.error('[v0] Invalid quantity:', quantity)
      toast({
        title: 'Error',
        description: 'Invalid quantity. Please enter a valid number.',
        variant: 'destructive',
      })
      return
    }

    console.log('[v0] Adding product to cart:', product.id, product.name, quantity)

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

  const handleConfirmSale = async () => {
    console.log('[v0] handleConfirmSale triggered')
    console.log('[v0] Processing:', processing)
    console.log('[v0] Open Register:', openRegister)
    console.log('[v0] Cart items:', cart.length)

    // Check if there's an open register
    if (!openRegister) {
      console.log('[v0] No open register')
      toast({
        title: 'No Open Register',
        description: 'Please open a cash register before processing sales. Go to Cash Register section.',
        variant: 'destructive',
      })
      return
    }

    if (cart.length === 0) {
      console.log('[v0] Cart is empty')
      toast({
        title: 'Empty Cart',
        description: 'Please add items to cart before completing sale.',
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)
    const supabase = createClient()
    const { subtotal, tax, total } = calculateTotals()

    console.log('[v0] Sale totals - Subtotal:', subtotal, 'Tax:', tax, 'Total:', total)

    try {
      const receiptNumber = `REC-${Date.now()}`

      // Get staff record for the current user
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user?.id)
        .eq('business_id', business.id)
        .single()

      if (staffError || !staffData) {
        throw new Error('Staff record not found. Please ensure your user profile is set up correctly.')
      }

      // Create sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            business_id: business.id,
            receipt_number: receiptNumber,
            customer_id: customer?.id || null,
            sale_type: checkoutType === 'table' ? 'dine_in' : 'takeaway',
            subtotal,
            tax_amount: tax,
            total_amount: total,
            payment_method: paymentMethod,
            payment_status: 'completed',
            sale_status: 'completed',
            created_by: staffData.id,
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

      // Update inventory for each item sold
      for (const item of cart) {
        const { data: inventory, error: inventoryFetchError } = await supabase
          .from('inventory')
          .select('quantity_on_hand, quantity_reserved')
          .eq('product_id', item.product_id)
          .eq('business_id', business.id)
          .single()

        if (inventoryFetchError) {
          console.error('[v0] Error fetching inventory:', inventoryFetchError)
          continue
        }

        const newQuantity = (inventory?.quantity_on_hand || 0) - item.quantity

        const { error: updateError } = await supabase
          .from('inventory')
          .update({
            quantity_on_hand: Math.max(0, newQuantity),
            last_stock_check: new Date().toISOString(),
          })
          .eq('product_id', item.product_id)
          .eq('business_id', business.id)

        if (updateError) {
          console.error('[v0] Error updating inventory for product:', item.product_id, updateError)
        }

        // Create inventory transaction record
        const { error: transError } = await supabase
          .from('inventory_transactions')
          .insert([
            {
              business_id: business.id,
              product_id: item.product_id,
              transaction_type: 'sale',
              quantity: -item.quantity,
              reference_id: saleData.id,
              reference_type: 'sale',
              created_by: staffData.id,
            },
          ])

        if (transError) {
          console.error('[v0] Error creating inventory transaction:', transError)
        }
      }

      // Show success notification
      console.log('[v0] Sale completed successfully:', saleData.id)
      setLastSaleReceipt(receiptNumber)
      
      // Close confirmation dialog only after successful sale
      setShowConfirmation(false)
      
      toast({
        title: 'Sale Completed Successfully!',
        description: `Receipt: ${receiptNumber} | Total: ${business.currency_code} ${total.toFixed(2)}`,
      })

      // Reset form
      setCart([])
      setCustomer(null)
      setPaymentMethod('cash')
      setCheckoutType('takeaway')

      // Refresh product inventory to show updated stock
      // setRefreshTrigger((prev) => prev + 1) // Removed as per lint suggestion
    } catch (error) {
      console.error('[v0] Error completing sale:', error)
      console.log('[v0] Error details:', JSON.stringify(error, null, 2))
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete sale. Please try again.'
      console.log('[v0] Error message to display:', errorMessage)
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is Empty',
        description: 'Please add items to the cart before completing the sale.',
        variant: 'destructive',
      })
      return
    }
    setShowConfirmation(true)
  }

  const { subtotal, tax, total } = calculateTotals()

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Point of Sale Register</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Left: Product Selection */}
          <div className="lg:col-span-2">
            <ProductSelector business={business} onAddProduct={handleAddProduct} refreshTrigger={refreshTrigger} />
          </div>

          {/* Top Right: Pending Orders */}
          {pendingOrdersComponent && (
            <div className="lg:col-span-1">
              {pendingOrdersComponent}
            </div>
          )}

          {/* Bottom Left: Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No items in cart</p>
                ) : (
                  <POSCart 
                    items={cart} 
                    onUpdateQuantity={handleUpdateQuantity} 
                    onRemoveItem={handleRemoveItem}
                    onUpdateDiscount={handleUpdateDiscount}
                    currency={business.currency_code}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Right: Sale Summary and Payment */}
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

                  {/* Checkout Type */}
                  <div className="mt-4">
                    <label className="text-xs font-semibold text-foreground mb-2 block">
                      Order Type
                    </label>
                    <Select value={checkoutType} onValueChange={(value: any) => setCheckoutType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="table">Table/Dine In</SelectItem>
                        <SelectItem value="takeaway">Takeaway</SelectItem>
                      </SelectContent>
                    </Select>
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
                    disabled={cart.length === 0 || processing || !openRegister}
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


          </div>
        </div>
      </div>

      {/* No Register Alert Dialog */}
      <AlertDialog open={!checkingRegister && !openRegister && cart.length > 0} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No Cash Register Open</AlertDialogTitle>
            <AlertDialogDescription>
              You need to open a cash register before processing sales.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => window.location.href = '/dashboard/cash-register'}
            >
              Go to Cash Register
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Confirm Sale
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Order Summary:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span>{cart.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{business.currency_code} {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{business.currency_code} {tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Total:</span>
                    <span>{business.currency_code} {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-foreground">Order Type:</p>
                <p>{checkoutType === 'table' ? 'Dine In (Table)' : 'Takeaway'}</p>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-foreground">Payment Method:</p>
                <p>{paymentMethod.replace('_', ' ').toUpperCase()}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSale}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? 'Processing...' : 'Confirm Sale'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
