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
import { ArrowLeft, Download, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'

interface MonthlyData {
  month: string
  revenue: number
  expenses: number
  profit: number
  profitMargin: number
}

interface ExpenseByCategory {
  category: string
  amount: number
  percentage: number
}

export default function FinancialReportPage() {
  const [business, setBusiness] = useState<any>(null)
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('year')
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    cashFlow: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { t } = useLanguage()

  const refreshData = async (businessData: any) => {
    if (!businessData) return

    const supabase = createClient()

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (dateRange) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    // Fetch sales (revenue) data
    const { data: salesData } = await supabase
      .from('sales')
      .select('total_amount, created_at')
      .eq('business_id', businessData.id)
      .eq('is_cancelled', false)
      .gte('created_at', startDate.toISOString())

    // Fetch expenses data
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('amount, category, created_at')
      .eq('business_id', businessData.id)
      .gte('created_at', startDate.toISOString())

    // Calculate totals
    const totalRevenue = (salesData || []).reduce((sum, sale) => sum + sale.total_amount, 0)
    const totalExpenses = (expensesData || []).reduce((sum, expense) => sum + expense.amount, 0)
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    const cashFlow = netProfit

    setStats({
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      cashFlow,
    })

    // Group data by month
    const monthlyMap: { [key: string]: MonthlyData } = {}

    // Process sales
    ;(salesData || []).forEach((sale) => {
      const monthKey = new Date(sale.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          revenue: 0,
          expenses: 0,
          profit: 0,
          profitMargin: 0,
        }
      }
      monthlyMap[monthKey].revenue += sale.total_amount
    })

    // Process expenses
    ;(expensesData || []).forEach((expense) => {
      const monthKey = new Date(expense.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          revenue: 0,
          expenses: 0,
          profit: 0,
          profitMargin: 0,
        }
      }
      monthlyMap[monthKey].expenses += expense.amount
    })

    // Calculate profit and margin for each month
    const monthlyArray = Object.values(monthlyMap).map((data) => {
      const profit = data.revenue - data.expenses
      const profitMargin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0
      return {
        ...data,
        profit,
        profitMargin,
      }
    })

    // Sort by date (most recent first)
    monthlyArray.sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
    setMonthlyData(monthlyArray)

    // Group expenses by category
    const categoryMap: { [key: string]: number } = {}
    ;(expensesData || []).forEach((expense) => {
      const category = expense.category || 'Uncategorized'
      categoryMap[category] = (categoryMap[category] || 0) + expense.amount
    })

    const expensesByCategoryArray = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))

    // Sort by amount (descending)
    expensesByCategoryArray.sort((a, b) => b.amount - a.amount)
    setExpensesByCategory(expensesByCategoryArray)
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
        await refreshData(businessData)

        // Subscribe to sales and expenses changes for real-time updates
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
              refreshData(businessData)
            }
          )
          .subscribe()

        const expensesSubscription = supabase
          .channel(`expenses:${businessData.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'expenses',
              filter: `business_id=eq.${businessData.id}`,
            },
            () => {
              // Refetch data when expenses change
              refreshData(businessData)
            }
          )
          .subscribe()

        setLoading(false)

        return () => {
          salesSubscription.unsubscribe()
          expensesSubscription.unsubscribe()
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [router, dateRange])

  const handleExport = () => {
    // Create CSV content
    const headers = ['Month', 'Revenue', 'Expenses', 'Net Profit', 'Profit Margin %']
    const rows = monthlyData.map((data) => [
      data.month,
      data.revenue.toFixed(2),
      data.expenses.toFixed(2),
      data.profit.toFixed(2),
      data.profitMargin.toFixed(2),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      'Expenses by Category',
      'Category,Amount,Percentage',
      ...expensesByCategory.map((cat) =>
        [cat.category, cat.amount.toFixed(2), cat.percentage.toFixed(2)].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
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
            <h1 className="text-3xl font-bold">Financial Report</h1>
            <p className="text-muted-foreground mt-1">Revenue, expenses, and profitability analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {business.currency_code} {stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dateRange === 'month' ? 'Last 30 days' : dateRange === 'quarter' ? 'Last 90 days' : 'Last 365 days'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {business.currency_code} {stats.totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Operating costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Profit
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {business.currency_code} {stats.netProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Revenue - Expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profit Margin
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.profitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Profit / Revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash Flow
            </CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {business.currency_code} {stats.cashFlow.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available funds</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Financial Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
                <TableHead className="text-right">Profit Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No financial data found for this period
                  </TableCell>
                </TableRow>
              ) : (
                monthlyData.map((data) => (
                  <TableRow key={data.month}>
                    <TableCell className="font-medium">{data.month}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {business.currency_code} {data.revenue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {business.currency_code} {data.expenses.toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {business.currency_code} {data.profit.toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right ${data.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.profitMargin.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))
              )}
              {monthlyData.length > 0 && (
                <TableRow className="font-bold bg-muted/50">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right text-green-600">
                    {business.currency_code} {stats.totalRevenue.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {business.currency_code} {stats.totalExpenses.toFixed(2)}
                  </TableCell>
                  <TableCell className={`text-right ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {business.currency_code} {stats.netProfit.toFixed(2)}
                  </TableCell>
                  <TableCell className={`text-right ${stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.profitMargin.toFixed(1)}%
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expenses by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">% of Total Expenses</TableHead>
                <TableHead>Distribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expensesByCategory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No expense data found
                  </TableCell>
                </TableRow>
              ) : (
                expensesByCategory.map((category) => (
                  <TableRow key={category.category}>
                    <TableCell className="font-medium">{category.category}</TableCell>
                    <TableCell className="text-right">
                      {business.currency_code} {category.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{category.percentage.toFixed(1)}%</TableCell>
                    <TableCell>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Financial Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Expense Ratio</p>
              <p className="text-2xl font-bold mt-1">
                {stats.totalRevenue > 0 ? ((stats.totalExpenses / stats.totalRevenue) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalRevenue > 0 && (stats.totalExpenses / stats.totalRevenue) * 100 < 70
                  ? 'Healthy ratio'
                  : 'Consider cost reduction'}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Revenue Growth</p>
              <p className="text-2xl font-bold mt-1">
                {monthlyData.length >= 2
                  ? ((monthlyData[0].revenue - monthlyData[1].revenue) / monthlyData[1].revenue * 100).toFixed(1)
                  : 0}
                %
              </p>
              <p className="text-xs text-muted-foreground mt-1">Month over month</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Break-even Point</p>
              <p className="text-2xl font-bold mt-1">
                {stats.netProfit >= 0 ? 'Achieved' : 'Not yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.netProfit >= 0
                  ? 'Operating profitably'
                  : `Need ${business.currency_code} ${Math.abs(stats.netProfit).toFixed(2)} more`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
