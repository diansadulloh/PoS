'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import OrderSummaryDialog, { OrderSummaryData } from './order-summary-dialog'

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cartItems: any[]
  cartTotal: number
  business: any
  onCheckoutComplete?: () => void
}

export default function CheckoutDialog({
  open,
  onOpenChange,
  cartItems,
  cartTotal,
  business,
  onCheckoutComplete,
}: CheckoutDialogProps) {
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('takeaway')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [availableTables, setAvailableTables] = useState<any[]>([])
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [loadingTables, setLoadingTables] = useState(false)
  const [showOrderSummary, setShowOrderSummary] = useState(false)
  const [orderSummary, setOrderSummary] = useState<OrderSummaryData | null>(null)
  const { toast } = useToast()
  const createdByUserId = 'some_user_id'; // Declare the variable here

  // Fetch available tables when order type changes to dine_in
  useEffect(() => {
    if (orderType === 'dine_in' && open) {
      fetchAvailableTables()
    }
  }, [orderType, open])

  const fetchAvailableTables = async () => {
    setLoadingTables(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('id, table_number, section, seat_capacity, status')
        .eq('business_id', business.id)
        .eq('status', 'available')
        .order('table_number')

      if (error) throw error
      setAvailableTables(data || [])
    } catch (error) {
      console.error('[v0] Error fetching tables:', error)
      toast({
        title: 'Error',
        description: 'Failed to load available tables',
        variant: 'destructive',
      })
    } finally {
      setLoadingTables(false)
    }
  }

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your name',
        variant: 'destructive',
      })
      return
    }

    if (orderType === 'dine_in' && !selectedTableId) {
      toast({
        title: 'Error',
        description: 'Please select a table',
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)

    try {
      const supabase = createClient()

      // Create or get customer
      let customerId: string | null = null
      if (customerPhone.trim()) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('business_id', business.id)
          .eq('phone', customerPhone.trim())
          .single()

        if (existingCustomer) {
          customerId = existingCustomer.id
        } else {
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert([
              {
                business_id: business.id,
                name: customerName,
                phone: customerPhone,
                is_active: true,
              },
            ])
            .select()
            .single()

          if (customerError) throw customerError
          customerId = newCustomer.id
        }
      }

      // Generate receipt number
      const receiptNumber = `REC-${Date.now()}`

      // Get current user or find a valid staff member for guest orders
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      let createdByStaffId = null
      if (currentUser) {
        // If user is logged in, find their staff record
        const { data: staffData } = await supabase
          .from('staff')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('business_id', business.id)
          .single()
        
        createdByStaffId = staffData?.id || null
      } else {
        // For guest orders from homepage, find any staff member from the business
        const { data: staffData } = await supabase
          .from('staff')
          .select('id')
          .eq('business_id', business.id)
          .limit(1)
          .single()
        
        if (staffData?.id) {
          createdByStaffId = staffData.id
        } else {
          // If no staff found, throw an error
          throw new Error('No staff member found for this business. Please contact support.')
        }
      }

      console.log('[v0] Using created_by staff id:', createdByStaffId)

      // Create sale record with PENDING status for customer orders (staff will process)
      const salePayload: any = {
        business_id: business.id,
        receipt_number: receiptNumber,
        customer_id: customerId,
        sale_type: orderType,
        subtotal: cartTotal,
        tax_amount: 0,
        total_amount: cartTotal,
        payment_method: 'cash',
        payment_status: 'pending',
        sale_status: 'pending',
        created_by: createdByStaffId,
      }

      if (orderType === 'dine_in' && selectedTableId) {
        salePayload.table_id = selectedTableId
      }

      if (notes.trim()) {
        salePayload.notes = notes
      }

      console.log('[v0] Inserting sale with payload:', salePayload)

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([salePayload])
        .select()
        .single()

      if (saleError) {
        console.error('[v0] Sale insert error:', saleError)
        throw new Error(`Failed to create sale: ${saleError.message}`)
      }
      console.log('[v0] Sale created successfully:', saleData.id)

      // Create sale items
      const saleItems = cartItems.map((item) => ({
        sale_id: saleData.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.selling_price,
        line_total: item.selling_price * item.quantity,
        tax_amount: 0,
        tax_rate: 0,
        discount_amount: 0,
        discount_percent: 0,
      }))

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)

      if (itemsError) throw itemsError
      console.log('[v0] Sale items created')

      // Update table status if dine_in
      let tableNumber = ''
      if (orderType === 'dine_in' && selectedTableId) {
        const selectedTable = availableTables.find((t) => t.id === selectedTableId)
        tableNumber = selectedTable ? `Table ${selectedTable.table_number}` : ''
        
        await supabase
          .from('restaurant_tables')
          .update({ status: 'occupied' })
          .eq('id', selectedTableId)
      }

      // Prepare order summary data
      const summaryData: OrderSummaryData = {
        receiptNumber,
        customerName,
        customerPhone: customerPhone || undefined,
        orderType,
        tableNumber: tableNumber || undefined,
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.selling_price,
          total: item.selling_price * item.quantity,
        })),
        subtotal: cartTotal,
        total: cartTotal,
        notes: notes || undefined,
        timestamp: new Date().toISOString(),
        currencyCode: business?.currency_code || 'IDR',
      }

      // Clear old order history and save new one to localStorage
      try {
        // Clear any existing order history first
        localStorage.removeItem('lastOrderSummary')
        console.log('[v0] Cleared old order history')
        
        // Save new order summary
        localStorage.setItem('lastOrderSummary', JSON.stringify(summaryData))
        console.log('[v0] New order summary saved to localStorage')
      } catch (error) {
        console.error('[v0] Failed to save order to localStorage:', error)
      }

      // Set order summary and show dialog
      setOrderSummary(summaryData)
      setShowOrderSummary(true)

      // Reset form and close checkout dialog
      setCustomerName('')
      setCustomerPhone('')
      setNotes('')
      setSelectedTableId('')
      setOrderType('takeaway')
      onOpenChange(false)

      // Call callback if provided
      if (onCheckoutComplete) {
        onCheckoutComplete()
      }
    } catch (error) {
      console.error('[v0] Checkout error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to place order. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Complete Your Order
          </DialogTitle>
          <DialogDescription>
            Review your order and provide your details to proceed with checkout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Items: {cartItems.length}</span>
              <span className="font-semibold">
                {business?.currency_code} {cartTotal.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-gray-500 max-h-24 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between py-1">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{business?.currency_code} {(item.selling_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              id="customer-name"
              name="customerName"
              placeholder="Your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={processing}
            />
          </div>

          {/* Customer Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone (Optional)</label>
            <Input
              id="customer-phone"
              name="customerPhone"
              type="tel"
              placeholder="Your phone number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              disabled={processing}
            />
          </div>

          {/* Order Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Order Type</label>
            <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dine_in">Dine In (Table)</SelectItem>
                <SelectItem value="takeaway">Takeaway</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table Selection - only show for dine_in */}
          {orderType === 'dine_in' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Table {loadingTables && <span className="text-xs text-gray-500">(Loading...)</span>}
              </label>
              <Select value={selectedTableId} onValueChange={setSelectedTableId} disabled={loadingTables}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an available table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.length === 0 ? (
                    <SelectItem value="no-tables" disabled>
                      No tables available
                    </SelectItem>
                  ) : (
                    availableTables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        Table {table.table_number} {table.section ? `(${table.section})` : ''} - {table.seat_capacity} seats
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Special Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Special Requests (Optional)</label>
            <Input
              id="special-notes"
              name="specialNotes"
              placeholder="Any special requests?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={processing}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
            onClick={handleCheckout}
            disabled={processing}
          >
            {processing && <Loader2 className="w-4 h-4 animate-spin" />}
            {processing ? 'Processing...' : 'Place Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Order Summary Dialog */}
    <OrderSummaryDialog
      open={showOrderSummary}
      onOpenChange={setShowOrderSummary}
      orderData={orderSummary}
    />
    </>
  )
}
