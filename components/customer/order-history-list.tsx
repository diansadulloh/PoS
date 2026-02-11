'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Receipt, Trash2, Clock, ShoppingBag } from 'lucide-react'
import { OrderSummaryData } from './order-summary-dialog'
import { Card, CardContent } from '@/components/ui/card'

interface OrderHistoryListProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orders: OrderSummaryData[]
  onViewOrder: (order: OrderSummaryData) => void
  onClearAllHistory: () => void
}

export default function OrderHistoryList({
  open,
  onOpenChange,
  orders,
  onViewOrder,
  onClearAllHistory,
}: OrderHistoryListProps) {
  const handleViewOrder = (order: OrderSummaryData) => {
    onViewOrder(order)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Order History
          </DialogTitle>
          <DialogDescription>
            View all your recent orders ({orders.length} {orders.length === 1 ? 'order' : 'orders'})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No order history found</p>
            </div>
          ) : (
            orders.map((order, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewOrder(order)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1 space-y-2">
                      {/* Receipt Number and Type */}
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded">
                          <Receipt className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{order.receiptNumber}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{new Date(order.timestamp).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{new Date(order.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer and Order Details */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Customer:</span>
                          <span className="ml-2 font-medium">{order.customerName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-2 font-medium capitalize">
                            {order.orderType === 'dine_in' ? 'Dine In' : 'Takeaway'}
                          </span>
                        </div>
                        {order.tableNumber && (
                          <div>
                            <span className="text-gray-500">Table:</span>
                            <span className="ml-2 font-medium">{order.tableNumber}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Items:</span>
                          <span className="ml-2 font-medium">{order.items.length}</span>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="text-xs text-gray-600">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx}>
                            {item.name} x{item.quantity}
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-gray-400">
                            +{order.items.length - 2} more items
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Total</div>
                      <div className="text-lg font-bold text-orange-600">
                        {order.currencyCode} {order.total.toFixed(2)}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewOrder(order)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {orders.length > 0 && (
            <Button
              onClick={onClearAllHistory}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All History
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
