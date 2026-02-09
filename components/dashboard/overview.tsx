'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface DashboardOverviewProps {
  business: any
}

export default function DashboardOverview({ business }: DashboardOverviewProps) {
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentSales = async () => {
      const supabase = createClient()

      try {
        const { data, error } = await supabase
          .from('sales')
          .select(`
            id,
            receipt_number,
            total_amount,
            payment_method,
            created_at,
            customers(name)
          `)
          .eq('business_id', business.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (!error) {
          setRecentSales(data || [])
        } else {
          setRecentSales([])
        }
      } catch (error) {
        console.error('[v0] Error fetching recent sales:', error)
        setRecentSales([])
      } finally {
        setLoading(false)
      }
    }

    if (business?.id) {
      fetchRecentSales()
    }
  }, [business?.id])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Sales */}
      <Card className="lg:col-span-2 border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Recent Sales</CardTitle>
          <Link href="/dashboard/sales">
            <Button variant="ghost" size="sm" className="gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : recentSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No recent sales</div>
          ) : (
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{sale.receipt_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {sale.customers?.name || 'Walk-in Customer'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{business.currency_code || 'USD'} {sale.total_amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{sale.payment_method}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/dashboard/pos">
            <Button className="w-full justify-start bg-transparent" variant="outline">
              New Sale
            </Button>
          </Link>
          <Link href="/dashboard/quotations">
            <Button className="w-full justify-start bg-transparent" variant="outline">
              Create Quotation
            </Button>
          </Link>
          <Link href="/dashboard/invoices">
            <Button className="w-full justify-start bg-transparent" variant="outline">
              Create Invoice
            </Button>
          </Link>
          <Link href="/dashboard/inventory">
            <Button className="w-full justify-start bg-transparent" variant="outline">
              Manage Inventory
            </Button>
          </Link>
          <Link href="/dashboard/cash-register">
            <Button className="w-full justify-start bg-transparent" variant="outline">
              Cash Register
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
