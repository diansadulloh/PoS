'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SalesPage() {
  const [business, setBusiness] = useState<any>(null)
  const [sales, setSales] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
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
        .single()

      setBusiness(businessData)

      if (businessData) {
        const { data: salesData } = await supabase
          .from('sales')
          .select(`
            *,
            customers(name)
          `)
          .eq('business_id', businessData.id)
          .order('created_at', { ascending: false })

        setSales(salesData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const filteredSales = sales.filter(
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Register</h1>
        <p className="text-muted-foreground mt-1">View all sales transactions</p>
      </div>

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
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
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
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                          {sale.sale_status}
                        </span>
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
