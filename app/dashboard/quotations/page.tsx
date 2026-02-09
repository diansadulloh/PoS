'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import QuotationForm from '@/components/quotations/quotation-form'
import { useRouter } from 'next/navigation'

export default function QuotationsPage() {
  const [business, setBusiness] = useState<any>(null)
  const [quotations, setQuotations] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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
        const [quotationsRes, customersRes, productsRes] = await Promise.all([
          supabase
            .from('quotations')
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

        setQuotations(quotationsRes.data || [])
        setCustomers(customersRes.data || [])
        setProducts(productsRes.data || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const filteredQuotations = quotations.filter(
    (quote) =>
      quote.quote_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSaveQuotation = async (formData: any) => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { line_items, ...quotationData } = formData

      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .insert([{ ...quotationData, business_id: business.id, created_by: user.id }])
        .select()
        .single()

      if (quotationError) throw quotationError

      // Insert line items
      const itemsToInsert = line_items.map((item: any) => ({
        ...item,
        quotation_id: quotation.id,
      }))

      const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      // Refresh quotations list
      const { data: quotationsData } = await supabase
        .from('quotations')
        .select(`
          *,
          customers(name)
        `)
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })

      setQuotations(quotationsData || [])
      setShowForm(false)
      alert('Quotation created successfully!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Error saving quotation:', errorMessage)
      alert(`Error creating quotation: ${errorMessage}`)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'expired':
        return <XCircle className="w-4 h-4 text-gray-600" />
      default:
        return <Clock className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      case 'expired':
        return 'bg-gray-100 text-gray-700'
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
            {'You need to create a business profile before managing quotations.'}
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
          <h1 className="text-3xl font-bold">Quotations</h1>
          <p className="text-muted-foreground mt-1">Create and send price quotations</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Create Quotation
        </Button>
      </div>

      {showForm && (
        <QuotationForm
          business={business}
          customers={customers}
          products={products}
          onSave={handleSaveQuotation}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search quotations by number or customer..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Quotations Table */}
      <Card>
        <CardContent className="p-0">
          {filteredQuotations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No quotations found</p>
              <p className="text-sm mt-2">
                {'Create your first quotation to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Quote #</th>
                    <th className="px-6 py-3 text-left font-semibold">Customer</th>
                    <th className="px-6 py-3 text-right font-semibold">Amount</th>
                    <th className="px-6 py-3 text-left font-semibold">Expiry Date</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotations.map((quote) => (
                    <tr key={quote.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-3 font-mono text-xs font-medium">
                        {quote.quote_number}
                      </td>
                      <td className="px-6 py-3">
                        {quote.customers?.name || 'No customer'}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold">
                        {business.currency_code} {quote.total_amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">
                        {quote.expiry_date
                          ? new Date(quote.expiry_date).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${getStatusColor(quote.status)}`}
                        >
                          {getStatusIcon(quote.status)}
                          {quote.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
