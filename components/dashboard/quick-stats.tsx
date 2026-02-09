'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Package, Users, DollarSign } from 'lucide-react'

interface QuickStatsProps {
  business: any
}

export default function QuickStats({ business }: QuickStatsProps) {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockItems: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      try {
        // Get total sales for today
        const today = new Date().toISOString().split('T')[0]
        const { data: todaySales, error: salesError } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('business_id', business.id)
          .gte('created_at', today)

        // Get total products
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id')
          .eq('business_id', business.id)

        // Get total customers
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select('id')
          .eq('business_id', business.id)

        // Get low stock items
        const { data: inventory, error: inventoryError } = await supabase
          .from('inventory')
          .select('quantity_on_hand, reorder_level')
          .eq('business_id', business.id)

        const lowStock = inventory?.filter(
          (item: any) => item.quantity_on_hand <= (item.reorder_level || 0)
        ).length || 0

        setStats({
          totalSales: todaySales?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0,
          totalProducts: products?.length || 0,
          totalCustomers: customers?.length || 0,
          lowStockItems: lowStock,
        })
      } catch (error) {
        console.error('[v0] Error fetching stats:', error)
        // Set default stats if fetch fails
        setStats({
          totalSales: 0,
          totalProducts: 0,
          totalCustomers: 0,
          lowStockItems: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    if (business?.id) {
      fetchStats()
    }
  }, [business?.id])

  const statItems = [
    {
      label: 'Today\'s Sales',
      value: `${business.currency_code || 'USD'} ${stats.totalSales.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Low Stock',
      value: stats.lowStockItems,
      icon: TrendingUp,
      color: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
