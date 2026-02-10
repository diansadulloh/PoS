'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface PendingOrdersProps {
  business: any
  refreshTrigger?: number
}

interface PendingOrder {
  id: string
  receipt_number: string
  customer_id: string | null
  customers?: { name: string; phone: string }
  sale_type: string
  table_id: string | null
  restaurant_tables?: { table_number: number; section: string }
  subtotal: number
  total_amount: number
  notes: string | null
  created_at: string
  sale_items?: Array<{
    product_id: string
    quantity: number
    unit_price: number
    products?: { name: string }
  }>
}

const ITEMS_PER_PAGE = 3

export default function PendingOrders({ business, refreshTrigger = 0 }: PendingOrdersProps) {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [action, setAction] = useState<'complete' | 'cancel'>('complete')
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()

  // Calculate pagination
  const totalPages = Math.ceil(pendingOrders.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const displayedOrders = pendingOrders.slice(startIndex, endIndex)

  useEffect(() => {
    fetchPendingOrders()
  }, [business, refreshTrigger])

  const fetchPendingOrders = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customers(name, phone),
          restaurant_tables(table_number, section),
          sale_items(
            product_id,
            quantity,
            unit_price,
            products(name)
          )
        `)
        .eq('business_id', business.id)
        .eq('sale_status', 'pending')
        .order('created_at', { ascending: true })

      if (error) throw error
      setPendingOrders(data || [])
      setCurrentPage(1) // Reset to first page when data is fetched
    } catch (error) {
      console.error('[v0] Error fetching pending orders:', error)
      toast({
        title: 'Error',
        description: 'Failed to load pending orders',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteOrder = async (order: PendingOrder) => {
    setSelectedOrder(order)
    setAction('complete')
    setShowConfirmDialog(true)
  }

  const handleCancelOrder = async (order: PendingOrder) => {
    setSelectedOrder(order)
    setAction('cancel')
    setShowConfirmDialog(true)
  }

  const confirmAction = async () => {
    if (!selectedOrder) return

    setProcessing(true)
    try {
      const supabase = createClient()
      const newStatus = action === 'complete' ? 'completed' : 'cancelled'

      const { error } = await supabase
        .from('sales')
        .update({
          sale_status: newStatus,
          payment_status: action === 'complete' ? 'completed' : 'pending',
        })
        .eq('id', selectedOrder.id)

      if (error) throw error

      // If completing a dine-in order, mark table as available
      if (action === 'complete' && selectedOrder.sale_type === 'dine_in' && selectedOrder.table_id) {
        await supabase
          .from('restaurant_tables')
          .update({ status: 'available' })
          .eq('id', selectedOrder.table_id)
      }

      toast({
        title: action === 'complete' ? 'Order Completed' : 'Order Cancelled',
        description: `Order ${selectedOrder.receipt_number} has been ${action === 'complete' ? 'completed' : 'cancelled'}`,
      })

      setShowConfirmDialog(false)
      setSelectedOrder(null)
      await fetchPendingOrders()
    } catch (error) {
      console.error('[v0] Error updating order:', error)
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-gray-500">
          Loading pending orders...
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Pending Customer Orders
            {pendingOrders.length > 0 && (
              <Badge className="ml-auto bg-orange-600">{pendingOrders.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No pending orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="max-h-96 overflow-y-auto">
                {displayedOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-3 bg-orange-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{order.receipt_number}</p>
                        <p className="text-xs text-gray-600">
                          {order.customers?.name || 'Guest'} {order.customers?.phone && `(${order.customers.phone})`}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {order.sale_type === 'dine_in' ? `Table ${order.restaurant_tables?.table_number}` : 'Takeaway'}
                      </Badge>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded p-2 mb-2 text-xs space-y-1">
                      {order.sale_items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.products?.name} x{item.quantity}</span>
                          <span className="font-medium">{(item.unit_price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-1 font-semibold flex justify-between">
                        <span>Total:</span>
                        <span>{order.total_amount.toFixed(0)}</span>
                      </div>
                    </div>

                    {order.notes && (
                      <p className="text-xs text-gray-700 mb-2 p-2 bg-white rounded border-l-2 border-orange-600">
                        <strong>Notes:</strong> {order.notes}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCompleteOrder(order)}
                        disabled={processing}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelOrder(order)}
                        disabled={processing}
                        className="flex-1"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === 'complete' ? 'Complete Order' : 'Cancel Order'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === 'complete'
                ? `Mark order ${selectedOrder?.receipt_number} as completed?`
                : `Cancel order ${selectedOrder?.receipt_number}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={processing}
              className={action === 'cancel' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {processing ? 'Processing...' : action === 'complete' ? 'Complete' : 'Cancel Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
