'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, AlertCircle, CheckCircle, Clock, RefreshCw, Eye } from 'lucide-react'
import InvoiceForm from '@/components/invoices/invoice-form'
import InvoiceActions from '@/components/invoices/invoice-actions'
import { useRouter } from 'next/navigation'

export default function InvoicesPage() {
  const [business, setBusiness] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const fetchInvoices = async (businessId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('invoices')
      .select(`
        *,
        customers(name)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    return data || []
  }

  const handleRefreshInvoices = async () => {
    if (!business) return
    setRefreshing(true)
    try {
      const updatedInvoices = await fetchInvoices(business.id)
      setInvoices(updatedInvoices)
    } finally {
      setRefreshing(false)
    }
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

      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

      setBusiness(businessData)

      if (businessData) {
        const [invoicesRes, customersRes, productsRes] = await Promise.all([
          supabase
            .from('invoices')
            .select(`
              *,
              customers(name)
            `)
            .eq('business_id', businessData.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('customers')
            .select('*')
            .eq('business_id', businessData.id)
            .eq('is_active', true)
            .order('name'),
          supabase
            .from('products')
            .select('*')
            .eq('business_id', businessData.id)
            .eq('is_active', true)
            .order('name'),
        ])

        setInvoices(invoicesRes.data || [])
        setCustomers(customersRes.data || [])
        setProducts(productsRes.data || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSaveInvoice = async (formData: any) => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // Get staff record for the current user
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', business.id)
        .single()

      if (staffError || !staffData) {
        throw new Error('Staff record not found. Please ensure your user profile is set up correctly.')
      }

      const { line_items, ...invoiceData } = formData

      // Insert invoice
      const invoicePayload = { 
        ...invoiceData, 
        business_id: business.id, 
        created_by: staffData.id 
      }
      
      console.log('[v0] Invoice payload:', invoicePayload)

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoicePayload])
        .select()
        .single()

      if (invoiceError) {
        console.error('[v0] Invoice error details:', invoiceError)
        throw new Error(`Failed to create invoice: ${invoiceError.message}`)
      }

      console.log('[v0] Invoice created successfully:', invoice)

      // Refresh invoices list
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select(`
          *,
          customers(name)
        `)
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })

      setInvoices(invoicesData || [])
      setShowForm(false)
      alert('Invoice created successfully!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Error saving invoice:', errorMessage)
      alert(`Error creating invoice: ${errorMessage}`)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'partial':
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <Clock className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700'
      case 'overdue':
        return 'bg-red-100 text-red-700'
      case 'partial':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">No Business Profile</h2>
          <p className="text-muted-foreground">
            {'You need to create a business profile before managing invoices.'}
          </p>
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Create Business Profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">Create and manage customer invoices</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefreshInvoices}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {showForm && (
        <InvoiceForm
          business={business}
          customers={customers}
          products={products}
          onSave={handleSaveInvoice}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices by number or customer..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No invoices found</p>
              <p className="text-sm mt-2">
                {'Create your first invoice to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Invoice #</th>
                    <th className="px-6 py-3 text-left font-semibold">Customer</th>
                    <th className="px-6 py-3 text-right font-semibold">Amount</th>
                    <th className="px-6 py-3 text-right font-semibold">Paid</th>
                    <th className="px-6 py-3 text-right font-semibold">Balance</th>
                    <th className="px-6 py-3 text-left font-semibold">Due Date</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => {
                    const balance = (invoice.total_amount || 0) - (invoice.paid_amount || 0)
                    return (
                      <tr key={invoice.id} className="border-b hover:bg-muted/50">
                        <td className="px-6 py-3 font-mono text-xs font-medium">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-6 py-3">
                          {invoice.customers?.name || 'No customer'}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold">
                          {business.currency_code} {invoice.total_amount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-3 text-right text-green-600">
                          {business.currency_code} {invoice.paid_amount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold">
                          {business.currency_code} {balance.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">
                          {invoice.due_date
                            ? new Date(invoice.due_date).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${getStatusColor(invoice.status)}`}
                          >
                            {getStatusIcon(invoice.status)}
                            {invoice.status || 'draft'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <InvoiceActions
                            invoice={invoice}
                            onInvoiceUpdate={handleRefreshInvoices}
                            onInvoiceDelete={handleRefreshInvoices}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
