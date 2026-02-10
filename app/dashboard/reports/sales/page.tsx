'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Download, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'

interface SaleData {
  id: string
  created_at: string
  total_amount: number
  payment_method: string
  customer_name?: string
  items_count: number
}

interface SalesByCategory {
  category: string
  total_sales: number
  total_revenue: number
}

interface DailyTrend {
  date: string
  sales: number
  revenue: number
}

interface PaymentMethodBreakdown {
  method: string
  count: number
  amount: number
  percentage: number
}

export default function SalesReportPage() {
  const [business, setBusiness] = useState<any>(null)
  const [sales, setSales] = useState<SaleData[]>([])
  const [salesByCategory, setSalesByCategory] = useState<SalesByCategory[]>([])
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month')
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageSale: 0,
    topPaymentMethod: '',
  })
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([])
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentMethodBreakdown[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
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
        // Calculate date range
        const now = new Date()
        let startDate = new Date()
        
        switch (dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0)
            break
          case 'week':
            startDate.setDate(now.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            break
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1)
            break
        }

        // Fetch sales data
        const { data: salesData } = await supabase
          .from('sales')
          .select(`
            id,
            created_at,
            total_amount,
            payment_method,
            customers (name)
          `)
          .eq('business_id', businessData.id)
          .gte('created_at', startDate.toISOString())
          .eq('is_cancelled', false)
          .order('created_at', { ascending: false })
          .limit(100)

        const formattedSales: SaleData[] = (salesData || []).map((sale: any) => ({
          id: sale.id,
          created_at: sale.created_at,
          total_amount: sale.total_amount,
          payment_method: sale.payment_method,
          customer_name: sale.customers?.name,
          items_count: 0, // This would need a join to sale_items
        }))

        setSales(formattedSales)

        // Only fetch category and product data if there are sales
        if (formattedSales.length > 0) {
          const saleIds = formattedSales.map((s) => s.id)

          // Fetch sales by category from sale_items
          const { data: categorySalesData } = await supabase
            .from('sale_items')
            .select(`
              quantity,
              unit_price,
              products (
                category
              )
            `)
            .in('sale_id', saleIds)

          const categoryBreakdown: { [key: string]: { count: number; revenue: number } } = {}
          categorySalesData?.forEach((item: any) => {
            const category = item.products?.category || 'Uncategorized'
            if (!categoryBreakdown[category]) {
              categoryBreakdown[category] = { count: 0, revenue: 0 }
            }
            categoryBreakdown[category].count += 1
            categoryBreakdown[category].revenue += (item.quantity * item.unit_price) || 0
          })

          const categoriesData: SalesByCategory[] = Object.entries(categoryBreakdown).map(
            ([category, data]) => ({
              category,
              total_sales: data.count,
              total_revenue: data.revenue,
            })
          )

          setSalesByCategory(categoriesData)

          // Fetch top products
          const { data: topProductsData } = await supabase
            .from('sale_items')
            .select(`
              quantity,
              unit_price,
              products (
                id,
                name,
                sku
              )
            `)
            .in('sale_id', saleIds)
            .order('quantity', { ascending: false })
            .limit(10)

          const topProductsList = (topProductsData || []).map((item: any) => ({
            id: item.products?.id,
            name: item.products?.name,
            sku: item.products?.sku,
            quantity_sold: item.quantity,
            revenue: (item.quantity * item.unit_price) || 0,
          }))

          setTopProducts(topProductsList)
        } else {
          setSalesByCategory([])
          setTopProducts([])
        }
      }

      setLoading(false)

      // Subscribe to sales changes for real-time updates
      const salesSubscription = supabase
        .channel(`sales:${businessData.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sales',
            filter: `business_id=eq.${businessData.id}`,
          },
          () => {
            // Refetch data when sales change
            fetchData()
          }
        )
        .subscribe()

      return () => {
        salesSubscription.unsubscribe()
      }
    }

    fetchData()
  }, [router, dateRange])

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Customer', 'Payment Method', 'Amount']
    const rows = sales.map((sale) => [
      new Date(sale.created_at).toLocaleDateString(),
      sale.customer_name || 'Walk-in',
      sale.payment_method,
      sale.total_amount.toFixed(2),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
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
            <h1 className="text-3xl font-bold">Sales Report</h1>
            <p className="text-muted-foreground mt-1">Detailed sales analysis and trends</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {business.currency_code} {stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'Last 7 days' : dateRange === 'month' ? 'Last 30 days' : 'Last year'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales
            </CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground mt-1">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Sale
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {business.currency_code} {stats.averageSale.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Payment Method
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{stats.topPaymentMethod}</div>
            <p className="text-xs text-muted-foreground mt-1">Most used</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentBreakdown.map((method) => (
              <div key={method.method} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{method.method}</p>
                    <p className="text-sm text-muted-foreground">{method.count} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{business.currency_code} {method.amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{method.percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${method.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg/Transaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyTrends.map((trend) => (
                <TableRow key={trend.date}>
                  <TableCell className="font-medium">{trend.date}</TableCell>
                  <TableCell className="text-right">{trend.sales}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {business.currency_code} {trend.revenue.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {business.currency_code} {(trend.revenue / trend.sales).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sales by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Total Sales</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Average Sale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesByCategory.map((category) => (
                <TableRow key={category.category}>
                  <TableCell className="font-medium">{category.category}</TableCell>
                  <TableCell className="text-right">{category.total_sales}</TableCell>
                  <TableCell className="text-right">
                    {business.currency_code} {category.total_revenue.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {business.currency_code}{' '}
                    {(category.total_revenue / category.total_sales).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-center text-muted-foreground">No product data available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Quantity Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                    <TableCell className="text-right">{product.quantity_sold}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {business.currency_code} {product.revenue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No sales found for this period
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {new Date(sale.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>{sale.customer_name || 'Walk-in Customer'}</TableCell>
                    <TableCell className="capitalize">{sale.payment_method}</TableCell>
                    <TableCell className="text-right font-medium">
                      {business.currency_code} {sale.total_amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
