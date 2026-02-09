'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  ShoppingCart,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ReportsPage() {
  const [business, setBusiness] = useState<any>(null)
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockItems: 0,
    thisMonthSales: 0,
  })
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
        // Fetch sales data
        const { data: salesData, count: salesCount } = await supabase
          .from('sales')
          .select('total_amount', { count: 'exact' })
          .eq('business_id', businessData.id)

        const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0

        // Fetch this month's sales
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const { count: thisMonthCount } = await supabase
          .from('sales')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessData.id)
          .gte('created_at', startOfMonth.toISOString())

        // Fetch products count
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessData.id)

        // Fetch customers count
        const { count: customersCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessData.id)

        // Fetch low stock items
        const { count: lowStockCount } = await supabase
          .from('inventory')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessData.id)
          .lt('quantity_on_hand', 10)

        setStats({
          totalSales: salesCount || 0,
          totalRevenue,
          totalProducts: productsCount || 0,
          totalCustomers: customersCount || 0,
          lowStockItems: lowStockCount || 0,
          thisMonthSales: thisMonthCount || 0,
        })
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

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
            {'You need to create a business profile before viewing reports.'}
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
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Business performance insights and analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              From {stats.totalSales} sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month Sales
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthSales}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">Active customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">In catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {'Items below 10 units'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Sale
            </CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {business.currency_code}{' '}
              {stats.totalSales > 0 ? (stats.totalRevenue / stats.totalSales).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Sales Report
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <div className="space-y-2">
              <p className="text-sm">Track your sales performance over time</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Daily, weekly, and monthly sales trends</li>
                <li>Sales by payment method</li>
                <li>Sales by product category</li>
                <li>Top-selling products</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/reports/inventory')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventory Report
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <div className="space-y-2">
              <p className="text-sm">Monitor your stock levels and movements</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Current stock levels</li>
                <li>Low stock alerts</li>
                <li>Stock movement history</li>
                <li>Inventory valuation</li>
              </ul>
              <button
                className="mt-4 text-sm font-medium text-primary hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push('/dashboard/reports/inventory')
                }}
              >
                View Full Report →
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customer Report
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <div className="space-y-2">
              <p className="text-sm">Understand your customer base</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Customer lifetime value</li>
                <li>Top customers by purchase volume</li>
                <li>Customer acquisition trends</li>
                <li>Customer retention rates</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Report
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <div className="space-y-2">
              <p className="text-sm">Analyze your financial performance</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Revenue and profit margins</li>
                <li>Expense tracking</li>
                <li>Cash flow analysis</li>
                <li>Tax summaries</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
