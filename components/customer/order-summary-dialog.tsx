'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, Receipt, Trash2 } from 'lucide-react'

export interface OrderSummaryData {
  receiptNumber: string
  customerName: string
  customerPhone?: string
  orderType: 'dine_in' | 'takeaway'
  tableNumber?: string
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  total: number
  notes?: string
  timestamp: string
  currencyCode: string
}

interface OrderSummaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderData: OrderSummaryData | null
  onClearHistory?: () => void
  showClearButton?: boolean
}

export default function OrderSummaryDialog({
  open,
  onOpenChange,
  orderData,
  onClearHistory,
  showClearButton = false,
}: OrderSummaryDialogProps) {
  if (!orderData) return null

  const handleClearHistory = () => {
    if (onClearHistory) {
      onClearHistory()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-6 h-6" />
            Order Placed Successfully!
          </DialogTitle>
          <DialogDescription>
            Your order has been received and is being prepared
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt Number */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Receipt className="w-4 h-4 text-green-700" />
              <span className="text-xs font-medium text-green-700">Receipt Number</span>
            </div>
            <p className="text-xl font-bold text-green-900">{orderData.receiptNumber}</p>
          </div>

          {/* Customer Details */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Customer Details</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{orderData.customerName}</span>
              </div>
              {orderData.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{orderData.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">
                  {orderData.orderType === 'dine_in' ? 'Dine In' : 'Takeaway'}
                </span>
              </div>
              {orderData.tableNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Table:</span>
                  <span className="font-medium">{orderData.tableNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Order Items</h3>
            <div className="bg-white border rounded-lg divide-y">
              {orderData.items.map((item) => (
                <div key={item.id} className="p-3 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {orderData.currencyCode} {item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {orderData.currencyCode} {item.total.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Special Notes */}
          {orderData.notes && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <h3 className="text-xs font-semibold text-yellow-800 mb-1">Special Requests</h3>
              <p className="text-sm text-yellow-900">{orderData.notes}</p>
            </div>
          )}

          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">
                {orderData.currencyCode} {orderData.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span className="text-orange-600">
                {orderData.currencyCode} {orderData.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-center text-gray-500">
            Order placed on {new Date(orderData.timestamp).toLocaleString()}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {showClearButton && (
            <Button
              onClick={handleClearHistory}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </Button>
          )}
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
