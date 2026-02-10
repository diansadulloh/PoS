'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { Search, Edit, X, Trash2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export default function SalesPage() {
  const [business, setBusiness] = useState<any>(null)
  const [sales, setSales] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [saleItems, setSaleItems] = useState<any[]>([])
  const [actionType, setActionType] = useState<'correct' | 'cancel' | 'delete' | null>(null)
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [correctionItems, setCorrectionItems] = useState<any[]>([])
  const [page, setPage] = useState(0)
  const [displayedSales, setDisplayedSales] = useState<any[]>([])
  const [totalSales, setTotalSales] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filteredSalesCount, setFilteredSalesCount] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  const PAGE_SIZE = 10

  // Helper functions for date calculations
  const getToday = () => {
    const date = new Date()
    return date.toISOString().split('T')[0]
  }

  const getThisMonthRange = () => {
    const date = new Date()
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  }

  const getLastMonthRange = () => {
    const date = new Date()
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1)
    const end = new Date(date.getFullYear(), date.getMonth(), 0)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  }

  const handleFilterChange = (filterType: 'today' | 'thisMonth' | 'lastMonth' | 'custom') => {
    if (filterType === 'today') {
      const today = getToday()
      setStartDate(today)
      setEndDate(today)
      setPage(0)
      fetchSalesData(0, today, today)
    } else if (filterType === 'thisMonth') {
      const { start, end } = getThisMonthRange()
      setStartDate(start)
      setEndDate(end)
      setPage(0)
      fetchSalesData(0, start, end)
    } else if (filterType === 'lastMonth') {
      const { start, end } = getLastMonthRange()
      setStartDate(start)
      setEndDate(end)
      setPage(0)
      fetchSalesData(0, start, end)
    }
  }

  const fetchSalesData = async (pageNum: number = 0, start?: string, end?: string) => {
    if (!business) return

    const supabase = createClient()
    let query = supabase
      .from('sales')
      .select(`
        *,
        customers(name)
      `)
      .eq('business_id', business.id)

    // Apply date filters
    if (start) {
      query = query.gte('created_at', `${start}T00:00:00`)
    }
    if (end) {
      query = query.lte('created_at', `${end}T23:59:59`)
    }

    // Get total count with filters
    const { count } = await supabase
      .from('sales')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('created_at', start ? `${start}T00:00:00` : '1900-01-01')
      .lte('created_at', end ? `${end}T23:59:59` : '2100-12-31')

    setFilteredSalesCount(count || 0)

    // Fetch paginated data
    const { data: salesData } = await query
      .order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

    setDisplayedSales(salesData || [])
  }

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      setBusiness(businessData)

      // Get user's staff role
      const { data: staffData } = await supabase
        .from('staff')
        .select('role')
        .eq('user_id', user.id)
        .eq('business_id', businessData?.id)
        .single()

      setUserRole(staffData?.role || null)

      if (businessData) {
        // Get total count (all sales)
        const { count } = await supabase
          .from('sales')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessData.id)

        setTotalSales(count || 0)

        // Default to today's sales
        const today = getToday()
        setStartDate(today)
        setEndDate(today)
        
        // Fetch today's sales data
        const query = supabase
          .from('sales')
          .select(`
            *,
            customers(name)
          `)
          .eq('business_id', businessData.id)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`)

        const { count: filteredCount } = await supabase
          .from('sales')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessData.id)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`)

        setFilteredSalesCount(filteredCount || 0)

        const { data: salesData } = await query
          .order('created_at', { ascending: false })
          .range(0, PAGE_SIZE - 1)

        setDisplayedSales(salesData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleActionConfirm = async () => {
    if (!selectedSale || !actionType || !user || !business) return

    setProcessing(true)
    const supabase = createClient()

    try {
      // Get staff record
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', business.id)
        .single()

      if (staffError || !staffData) {
        throw new Error('Staff record not found')
      }

      if (actionType === 'delete') {
        // Only admins can delete
        if (userRole !== 'admin') {
          throw new Error('Only admins can delete transactions')
        }

        // Get current inventory transactions for this sale
        const { data: saleItems } = await supabase
          .from('sale_items')
          .select('product_id, quantity')
          .eq('sale_id', selectedSale.id)

        // Revert inventory
        if (saleItems) {
          for (const item of saleItems) {
            const { data: inventory } = await supabase
              .from('inventory')
              .select('quantity_on_hand')
              .eq('product_id', item.product_id)
              .eq('business_id', business.id)
              .single()

            await supabase
              .from('inventory')
              .update({
                quantity_on_hand: (inventory?.quantity_on_hand || 0) + item.quantity,
              })
              .eq('product_id', item.product_id)
              .eq('business_id', business.id)
          }
        }

        // Delete the sale and items
        await supabase.from('sale_items').delete().eq('sale_id', selectedSale.id)
        await supabase.from('sales').delete().eq('id', selectedSale.id)

        // Log audit trail
        await supabase.from('sales_audits').insert([
          {
            business_id: business.id,
            sale_id: selectedSale.id,
            action: 'delete',
            action_reason: reason,
            data_before: selectedSale,
            performed_by: staffData.id,
          },
        ])

        toast({
          title: 'Transaction Deleted',
          description: 'Sale has been deleted and inventory has been reverted.',
        })
      } else if (actionType === 'cancel') {
        // Update sale status to cancelled
        const { error } = await supabase
          .from('sales')
          .update({
            sale_status: 'cancelled',
            is_cancelled: true,
          })
          .eq('id', selectedSale.id)

        if (error) throw error

        // Log audit trail
        await supabase.from('sales_audits').insert([
          {
            business_id: business.id,
            sale_id: selectedSale.id,
            action: 'cancellation',
            action_reason: reason,
            data_before: selectedSale,
            performed_by: staffData.id,
          },
        ])

        toast({
          title: 'Transaction Cancelled',
          description: 'Sale has been marked as cancelled.',
        })
      } else if (actionType === 'correct') {
        // Process item corrections - update quantities
        let totalAdjustment = 0

        for (const corrItem of correctionItems) {
          const originalItem = saleItems.find((i) => i.id === corrItem.id)
          const qtyDifference = corrItem.new_qty - (originalItem?.original_qty || 0)

          // Update sale item quantity
          const { error: updateError } = await supabase
            .from('sale_items')
            .update({ quantity: corrItem.new_qty })
            .eq('id', corrItem.id)

          if (updateError) throw updateError

          // Adjust inventory based on quantity change
          if (qtyDifference !== 0) {
            const { data: inventory } = await supabase
              .from('inventory')
              .select('quantity_on_hand')
              .eq('product_id', corrItem.product_id)
              .eq('business_id', business.id)
              .single()

            const newQty = (inventory?.quantity_on_hand || 0) - qtyDifference
            await supabase
              .from('inventory')
              .update({ quantity_on_hand: Math.max(0, newQty) })
              .eq('product_id', corrItem.product_id)
              .eq('business_id', business.id)

            totalAdjustment += qtyDifference
          }
        }

        // Recalculate sale total (simplified - assumes line items have consistent pricing)
        const { data: updatedItems } = await supabase
          .from('sale_items')
          .select('*')
          .eq('sale_id', selectedSale.id)

        const newTotal = (updatedItems || []).reduce((sum: number, item: any) => sum + item.line_total, 0)

        // Update sale amount and mark as corrected
        const { error: saleError } = await supabase
          .from('sales')
          .update({
            is_corrected: true,
            total_amount: newTotal,
          })
          .eq('id', selectedSale.id)

        if (saleError) throw saleError

        // Log audit trail
        await supabase.from('sales_audits').insert([
          {
            business_id: business.id,
            sale_id: selectedSale.id,
            action: 'correction',
            action_reason: reason,
            data_before: selectedSale,
            performed_by: staffData.id,
          },
        ])

        toast({
          title: 'Transaction Corrected',
          description: `Sale has been corrected. Items adjusted: ${totalAdjustment > 0 ? '+' : ''}${totalAdjustment}`,
        })
      }

      // Refresh sales list
      const { data: salesData } = await supabase
        .from('sales')
        .select(`
          *,
          customers(name)
        `)
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })

      setSales(salesData || [])
      setSelectedSale(null)
      setActionType(null)
      setReason('')
    } catch (error) {
      console.error('[v0] Error performing action:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to perform action',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const filteredSales = displayedSales.filter(
    (sale) =>
      sale.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <>
      <AlertDialog open={actionType !== null} onOpenChange={(open) => {
        if (!open) {
          setActionType(null)
          setSelectedSale(null)
          setSaleItems([])
          setCorrectionItems([])
          setReason('')
        }
      }}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {actionType === 'delete' && 'Delete Transaction'}
              {actionType === 'cancel' && 'Cancel Transaction'}
              {actionType === 'correct' && 'Correct Transaction - Adjust Items'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'delete' && 'This will delete the transaction and revert inventory. This action cannot be undone.'}
              {actionType === 'cancel' && 'This will mark the transaction as cancelled.'}
              {actionType === 'correct' && 'Modify item quantities: add more items or reduce quantities as needed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            {selectedSale && (
              <div className="text-sm space-y-1 p-3 bg-muted rounded">
                <p><span className="font-medium">Receipt:</span> {selectedSale.receipt_number}</p>
                <p><span className="font-medium">Amount:</span> {business?.currency_code} {selectedSale.total_amount.toFixed(2)}</p>
                <p><span className="font-medium">Date:</span> {new Date(selectedSale.created_at).toLocaleDateString()}</p>
              </div>
            )}

            {actionType === 'correct' && saleItems.length > 0 && (
              <div className="space-y-3 p-3 bg-muted rounded max-h-48 overflow-y-auto">
                <p className="font-medium text-sm">Items in Transaction</p>
                {correctionItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 p-2 bg-background rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">Original qty: {item.original_qty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const updated = correctionItems.map((i) =>
                            i.id === item.id ? { ...i, new_qty: Math.max(0, i.new_qty - 1) } : i
                          )
                          setCorrectionItems(updated)
                        }}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-medium">{item.new_qty}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const updated = correctionItems.map((i) =>
                            i.id === item.id ? { ...i, new_qty: i.new_qty + 1 } : i
                          )
                          setCorrectionItems(updated)
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                placeholder="Explain why you are taking this action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActionConfirm}
              disabled={processing || !reason}
              className={actionType === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {processing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sales Register</h1>
          <p className="text-muted-foreground mt-1">View all sales transactions</p>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Quick Filter Buttons */}
            <div className="flex gap-2">
              <Button
                variant={startDate === getToday() && endDate === getToday() ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('today')}
              >
                Today
              </Button>
              <Button
                variant={
                  startDate === getThisMonthRange().start && endDate === getThisMonthRange().end
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                onClick={() => handleFilterChange('thisMonth')}
              >
                This Month
              </Button>
              <Button
                variant={
                  startDate === getLastMonthRange().start && endDate === getLastMonthRange().end
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                onClick={() => handleFilterChange('lastMonth')}
              >
                Last Month
              </Button>
            </div>

            {/* Custom Date Inputs */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setPage(0)
                    fetchSalesData(0, e.target.value, endDate)
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setPage(0)
                    fetchSalesData(0, startDate, e.target.value)
                  }}
                />
              </div>
              {(startDate || endDate) && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange('today')}
                  >
                    Reset to Today
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search sales by receipt number or customer..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sales Table */}
        <Card>
          <CardContent className="p-0">
            {filteredSales.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No sales found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Receipt #</th>
                    <th className="px-6 py-3 text-left font-semibold">Customer</th>
                    <th className="px-6 py-3 text-left font-semibold">Payment Method</th>
                    <th className="px-6 py-3 text-right font-semibold">Total</th>
                    <th className="px-6 py-3 text-left font-semibold">Date</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-3 font-mono text-xs font-medium">
                        {sale.receipt_number}
                      </td>
                      <td className="px-6 py-3">
                        {sale.customers?.name || 'Walk-in Customer'}
                      </td>
                      <td className="px-6 py-3 capitalize">{sale.payment_method}</td>
                      <td className="px-6 py-3 text-right font-semibold">
                        {business.currency_code} {sale.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          sale.sale_status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                          sale.is_corrected ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {sale.is_corrected ? 'Corrected' : sale.sale_status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              setSelectedSale(sale)
                              // Load sale items for this transaction
                              const supabase = createClient()
                              const { data: items } = await supabase
                                .from('sale_items')
                                .select(`
                                  id,
                                  quantity,
                                  product_id,
                                  products(name)
                                `)
                                .eq('sale_id', sale.id)
                              
                              const itemsWithNames = (items || []).map((item: any) => ({
                                id: item.id,
                                product_id: item.product_id,
                                product_name: item.products?.name || 'Unknown',
                                original_qty: item.quantity,
                                new_qty: item.quantity,
                              }))
                              setSaleItems(itemsWithNames)
                              setCorrectionItems(itemsWithNames)
                              setActionType('correct')
                            }}
                            disabled={sale.sale_status === 'cancelled'}
                            title="Correct transaction - modify items"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSale(sale)
                              setActionType('cancel')
                            }}
                            disabled={sale.sale_status === 'cancelled'}
                            title="Cancel transaction"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          {userRole === 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSale(sale)
                                setActionType('delete')
                              }}
                              className="text-destructive hover:text-destructive"
                              title="Delete transaction (revert inventory)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filteredSalesCount)} of {filteredSalesCount}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = page - 1
                        setPage(newPage)
                        fetchSalesData(newPage, startDate, endDate)
                      }}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = page + 1
                        setPage(newPage)
                        fetchSalesData(newPage, startDate, endDate)
                      }}
                      disabled={(page + 1) * PAGE_SIZE >= filteredSalesCount}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
    </>
  )
}
