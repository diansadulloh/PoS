'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Search,
  Download,
  ArrowLeft,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function InventoryReportPage() {
  const [business, setBusiness] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
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
        const [productsRes, categoriesRes, transactionsRes] = await Promise.all([
          supabase
            .from('products')
            .select(`
              *,
              inventory(quantity_on_hand, reorder_level, quantity_reserved, last_stock_check)
            `)
            .eq('business_id', businessData.id)
            .order('name'),
          supabase
            .from('categories')
            .select('*')
            .eq('business_id', businessData.id)
            .order('name'),
          supabase
            .from('inventory_transactions')
            .select(`
              *,
              products(name, sku)
            `)
            .eq('business_id', businessData.id)
            .order('created_at', { ascending: false })
            .limit(100),
        ])

        setProducts(productsRes.data || [])
        setCategories(categoriesRes.data || [])
        setTransactions(transactionsRes.data || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category_id === selectedCategory
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())

    const inventory = product.inventory?.[0]
    const stock = inventory?.quantity_on_hand || 0
    const reorderLevel = inventory?.reorder_level || 0

    let matchesStockFilter = true
    if (stockFilter === 'low') {
      matchesStockFilter = stock <= reorderLevel && stock > 0
    } else if (stockFilter === 'out') {
      matchesStockFilter = stock === 0
    } else if (stockFilter === 'ok') {
      matchesStockFilter = stock > reorderLevel
    }

    return matchesCategory && matchesSearch && matchesStockFilter
  })

  // Calculate statistics
  const totalProducts = products.length
  const totalValue = products.reduce((sum, product) => {
    const stock = product.inventory?.[0]?.quantity_on_hand || 0
    return sum + stock * product.purchase_price
  }, 0)
  const lowStockItems = products.filter((p) => {
    const inventory = p.inventory?.[0]
    return inventory && inventory.quantity_on_hand <= (inventory.reorder_level || 0)
  }).length
  const outOfStockItems = products.filter((p) => {
    const inventory = p.inventory?.[0]
    return inventory && inventory.quantity_on_hand === 0
  }).length

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Uncategorized'
  }

  const getStockStatus = (product: any) => {
    const inventory = product.inventory?.[0]
    if (!inventory) return { label: 'No Data', color: 'bg-gray-100 text-gray-700' }

    const stock = inventory.quantity_on_hand || 0
    const reorderLevel = inventory.reorder_level || 0

    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' }
    if (stock <= reorderLevel)
      return { label: 'Low Stock', color: 'bg-orange-100 text-orange-700' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-700' }
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
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/reports')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Button>
          <h1 className="text-3xl font-bold">Inventory Report</h1>
          <p className="text-muted-foreground mt-1">
            Detailed inventory analysis and stock levels
          </p>
        </div>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inventory Value
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {business.currency_code} {totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">At purchase price</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Need reorder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Out of Stock
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Urgent action needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All stock levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock Levels</SelectItem>
            <SelectItem value="ok">In Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No products found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">SKU</th>
                    <th className="px-6 py-3 text-left font-semibold">Product</th>
                    <th className="px-6 py-3 text-left font-semibold">Category</th>
                    <th className="px-6 py-3 text-right font-semibold">In Stock</th>
                    <th className="px-6 py-3 text-right font-semibold">Reserved</th>
                    <th className="px-6 py-3 text-right font-semibold">Available</th>
                    <th className="px-6 py-3 text-right font-semibold">Reorder Level</th>
                    <th className="px-6 py-3 text-right font-semibold">Unit Value</th>
                    <th className="px-6 py-3 text-right font-semibold">Total Value</th>
                    <th className="px-6 py-3 text-center font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const inventory = product.inventory?.[0] || {}
                    const stock = inventory.quantity_on_hand || 0
                    const reserved = inventory.quantity_reserved || 0
                    const available = stock - reserved
                    const reorderLevel = inventory.reorder_level || 0
                    const totalValue = stock * product.purchase_price
                    const status = getStockStatus(product)

                    return (
                      <tr key={product.id} className="border-b hover:bg-muted/50">
                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                          {product.sku}
                        </td>
                        <td className="px-6 py-3 font-medium">{product.name}</td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {getCategoryName(product.category_id)}
                        </td>
                        <td className="px-6 py-3 text-right font-bold">{stock}</td>
                        <td className="px-6 py-3 text-right text-muted-foreground">
                          {reserved}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-green-600">
                          {available}
                        </td>
                        <td className="px-6 py-3 text-right text-muted-foreground">
                          {reorderLevel}
                        </td>
                        <td className="px-6 py-3 text-right">
                          {business.currency_code} {product.purchase_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold">
                          {business.currency_code} {totalValue.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}
                          >
                            {status.label}
                          </span>
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

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No transactions recorded
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Date</th>
                    <th className="px-6 py-3 text-left font-semibold">Product</th>
                    <th className="px-6 py-3 text-left font-semibold">Type</th>
                    <th className="px-6 py-3 text-right font-semibold">Quantity</th>
                    <th className="px-6 py-3 text-left font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 20).map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-3 text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        {transaction.products?.name || 'Unknown Product'}
                      </td>
                      <td className="px-6 py-3 capitalize">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.transaction_type === 'sale' ||
                            transaction.transaction_type === 'damage'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-3 text-right font-bold ${
                          transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.quantity > 0 ? '+' : ''}
                        {transaction.quantity}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground text-xs">
                        {transaction.notes || '-'}
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
