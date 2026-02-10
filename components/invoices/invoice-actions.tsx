'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Eye, DollarSign, X, Trash2, Loader2 } from 'lucide-react'

interface InvoiceActionsProps {
  invoice: any
  onInvoiceUpdate?: () => void
  onInvoiceDelete?: () => void
}

export default function InvoiceActions({
  invoice,
  onInvoiceUpdate,
  onInvoiceDelete,
}: InvoiceActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(invoice.status)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoice.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: `Invoice status updated to ${newStatus}`,
      })

      setSelectedStatus(newStatus)
      setShowStatusDialog(false)
      onInvoiceUpdate?.()
    } catch (error: any) {
      console.error('[v0] Error updating invoice status:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update invoice status',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from('invoices').delete().eq('id', invoice.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      })

      setShowDeleteDialog(false)
      onInvoiceDelete?.()
    } catch (error: any) {
      console.error('[v0] Error deleting invoice:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete invoice',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'cancelled' })
        .eq('id', invoice.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Invoice cancelled successfully',
      })

      setShowStatusDialog(false)
      onInvoiceUpdate?.()
    } catch (error: any) {
      console.error('[v0] Error cancelling invoice:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel invoice',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowViewDialog(true)}>
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
            <DollarSign className="w-4 h-4 mr-2" />
            Update Status
          </DropdownMenuItem>

          {invoice.status !== 'cancelled' && (
            <DropdownMenuItem onClick={handleCancel} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Cancel Invoice
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600"
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Details Dialog */}
      <AlertDialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Invoice Details</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold">Invoice #{invoice.invoice_number}</h3>
              <p className="text-sm text-muted-foreground">
                Created on {new Date(invoice.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{invoice.customers?.name || 'No customer'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{invoice.status || 'draft'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invoice Date</p>
                <p className="font-medium">
                  {invoice.invoice_date
                    ? new Date(invoice.invoice_date).toLocaleDateString()
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>

            {/* Amounts */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{invoice.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Discount</span>
                  <span>-{invoice.discount_amount?.toFixed(2)}</span>
                </div>
              )}
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{invoice.tax_amount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg border-t pt-3">
                <span>Total</span>
                <span>{invoice.total_amount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Paid Amount</span>
                <span>{invoice.paid_amount?.toFixed(2) || '0.00'}</span>
              </div>
              {(invoice.total_amount || 0) > (invoice.paid_amount || 0) && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Balance Due</span>
                  <span>
                    {((invoice.total_amount || 0) - (invoice.paid_amount || 0)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}
          </div>

          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Status Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Invoice Status</AlertDialogTitle>
            <AlertDialogDescription>
              Change the status of invoice #{invoice.invoice_number}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            {['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={loading || status === selectedStatus}
                className={`w-full text-left px-4 py-3 rounded-md border transition-colors ${
                  status === selectedStatus
                    ? 'bg-orange-50 border-orange-300'
                    : 'border-gray-200 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{status}</span>
                  {loading && status === selectedStatus && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice #{invoice.invoice_number}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete Invoice
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
