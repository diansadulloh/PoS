'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Download, Users, TrendingUp, DollarSign, Award } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'

interface CustomerData {
  id: string
  name: string
  email: string
  phone: string
  total_purchases: number
  total_spent: number
  last_purchase_date: string
  created_at: string
}

export default function CustomerReportPage() {
  const [business, setBusiness] = useState<any>(null)
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [stats, setStats] = useState({
    totalCustomers: 0,
    newCustomersThisMonth: 0,
    averageLifetimeValue: 0,
    retentionRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { t } = useLanguage()

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
        // Fetch all customers
        const { data: customersData } = await supabase
          .from('customers')
          .select('*')
          .eq('business_id', businessData.id)
          .order('created_at', { ascending: false })

        // For each customer, get their purchase data
        const customersWithStats: CustomerData[] = await Promise.all(
          (customersData || []).map(async (customer) => {
            const { data: sales } = await supabase
              .from('sales')
              .select('total_amount, sale_date')
              .eq('business_id', businessData.id)
              .eq('customer_id', customer.id)
              .order('sale_date', { ascending: false })

            const totalPurchases = sales?.length || 0
            const totalSpent = sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0
            const lastPurchaseDate = sales?.[0]?.sale_date || null

            return {
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              total_purchases: totalPurchases,
              total_spent: totalSpent,
              last_purchase_date: lastPurchaseDate,
              created_at: customer.created_at,
            }
          })
        )

        // Sort by total spent (descending)
        customersWithStats.sort((a, b) => b.total_spent - a.total_spent)
        setCustomers(customersWithStats)

        // Calculate stats
        const totalCustomers = customersWithStats.length
        
        // New customers this month
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        const newCustomersThisMonth = customersWithStats.filter(
          (c) => new Date(c.created_at) >= startOfMonth
        ).length

        // Average lifetime value
        const totalRevenue = customersWithStats.reduce((sum, c) => sum + c.total_spent, 0)
        const averageLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

        // Simple retention rate: customers who made a purchase in last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const activeCustomers = customersWithStats.filter(
          (c) => c.last_purchase_date && new Date(c.last_purchase_date) >= thirtyDaysAgo
        ).length
        const retentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0

        setStats({
          totalCustomers,
          newCustomersThisMonth,
          averageLifetimeValue,
          retentionRate,
        })
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleExport = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'Total Purchases', 'Total Spent', 'Last Purchase', 'Customer Since']
    const rows = customers.map((customer) => [
      customer.name,
      customer.email,
      customer.phone || '',
      customer.total_purchases.toString(),
      customer.total_spent.toFixed(2),
      customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString() : 'Never',
      new Date(customer.created_at).toLocaleDateString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customer-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">{t('noBusinessFound')}</h2>
          <p className="text-muted-foreground">{t('createBusinessFirst')}</p>
          <Button onClick={() => router.push('/dashboard/settings')}>
            {t('createBusinessProfile')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/reports')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Customer Report</h1>
            <p className="text-muted-foreground mt-1">Customer insights and analytics</p>
          </div>
        </div>
        <Button onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New This Month
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newCustomersThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date().toLocaleDateString('en-US', { month: 'long' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Lifetime Value
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {business.currency_code} {stats.averageLifetimeValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Retention Rate
            </CardTitle>
            <Award className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.retentionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers by Lifetime Value</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">Lifetime Value</TableHead>
                <TableHead className="text-right">Last Purchase</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.slice(0, 20).map((customer, index) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `#${index + 1}`}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Since {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{customer.email}</p>
                        {customer.phone && (
                          <p className="text-xs text-muted-foreground">{customer.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{customer.total_purchases}</TableCell>
                    <TableCell className="text-right font-medium">
                      {business.currency_code} {customer.total_spent.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {customer.last_purchase_date ? (
                        <span>
                          {new Date(customer.last_purchase_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Acquisition Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Acquisition Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Customers with Purchases</p>
                <p className="text-2xl font-bold mt-1">
                  {customers.filter((c) => c.total_purchases > 0).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {customers.length > 0
                    ? ((customers.filter((c) => c.total_purchases > 0).length / customers.length) * 100).toFixed(1)
                    : 0}
                  % conversion rate
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Repeat Customers</p>
                <p className="text-2xl font-bold mt-1">
                  {customers.filter((c) => c.total_purchases > 1).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {customers.length > 0
                    ? ((customers.filter((c) => c.total_purchases > 1).length / customers.length) * 100).toFixed(1)
                    : 0}
                  % of all customers
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Avg Purchases per Customer</p>
                <p className="text-2xl font-bold mt-1">
                  {customers.length > 0
                    ? (customers.reduce((sum, c) => sum + c.total_purchases, 0) / customers.length).toFixed(1)
                    : 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Lifetime average</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
