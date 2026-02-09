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
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react'
import ProductForm from '@/components/products/product-form'
import StockAdjustmentForm from '@/components/inventory/stock-adjustment-form'
import { useRouter } from 'next/navigation'

export default function InventoryPage() {
  const [business, setBusiness] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [showStockForm, setShowStockForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
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

      // Fetch business
      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      setBusiness(businessData)

      if (businessData) {
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .eq('business_id', businessData.id)

        setCategories(categoriesData || [])

        // Fetch products with inventory
        const { data: productsData } = await supabase
          .from('products')
          .select(`
            *,
            inventory(quantity_on_hand, reorder_level)
          `)
          .eq('business_id', businessData.id)
          .order('name')

        setProducts(productsData || [])
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
    return matchesCategory && matchesSearch
  })

  const refreshCategories = async () => {
    const supabase = createClient()
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .eq('business_id', business.id)

    setCategories(categoriesData || [])
  }

  const handleSaveProduct = async (formData: any) => {
    const supabase = createClient()

    try {
      if (selectedProduct) {
        // Update
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', selectedProduct.id)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('products')
          .insert([{ ...formData, business_id: business.id }])

        if (error) throw error
      }

      // Refresh products
      const { data: productsData } = await supabase
        .from('products')
        .select(
          `
          *,
          inventory(quantity_on_hand, reorder_level)
        `
        )
        .eq('business_id', business.id)
        .order('name')

      setProducts(productsData || [])
      // Refresh categories as well in case a new one was created
      await refreshCategories()
      setShowForm(false)
      setSelectedProduct(null)
    } catch (error) {
      console.error('[v0] Error saving product:', error)
      if (error && typeof error === 'object') {
        console.error('[v0] Error details:', JSON.stringify(error, null, 2))
      }
      alert(`Error saving product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleStockAdjustment = async (adjustment: any) => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      console.log('[v0] Creating stock adjustment transaction:', adjustment)

      // Insert transaction record
      const { data: transData, error: transError } = await supabase
        .from('inventory_transactions')
        .insert([
          {
            ...adjustment,
            business_id: business.id,
            created_by: user.id,
          },
        ])
        .select()

      console.log('[v0] Transaction insert response:', { transData, transError })

      if (transError) {
        console.error('[v0] Transaction error - code:', transError.code)
        console.error('[v0] Transaction error - message:', transError.message)
        console.error('[v0] Transaction error - details:', transError.details)
        console.error('[v0] Transaction error - hint:', transError.hint)
        throw new Error(transError.message || 'Failed to create transaction')
      }

      // Update inventory quantity
      const currentInventory = selectedProduct.inventory?.[0]
      const currentStock = currentInventory?.quantity_on_hand || 0
      let newStock = currentStock

      if (
        adjustment.transaction_type === 'adjustment' ||
        adjustment.transaction_type === 'receiving'
      ) {
        newStock = currentStock + adjustment.quantity
      } else {
        newStock = currentStock - adjustment.quantity
      }

      console.log('[v0] Updating inventory - current:', currentStock, 'new:', newStock)

      if (currentInventory) {
        // Update existing inventory
        const { data: invData, error: invError } = await supabase
          .from('inventory')
          .update({ quantity_on_hand: newStock })
          .eq('id', currentInventory.id)
          .select()

        console.log('[v0] Inventory update response:', { invData, invError })

        if (invError) {
          console.error('[v0] Inventory update error - code:', invError.code)
          console.error('[v0] Inventory update error - message:', invError.message)
          console.error('[v0] Inventory update error - details:', invError.details)
          throw new Error(invError.message || 'Failed to update inventory')
        }
      } else {
        // Create new inventory record
        const { data: invData, error: invError } = await supabase
          .from('inventory')
          .insert([
            {
              business_id: business.id,
              product_id: selectedProduct.id,
              quantity_on_hand: newStock,
              quantity_reserved: 0,
              reorder_level: 0,
            },
          ])
          .select()

        console.log('[v0] Inventory insert response:', { invData, invError })

        if (invError) {
          console.error('[v0] Inventory insert error - code:', invError.code)
          console.error('[v0] Inventory insert error - message:', invError.message)
          console.error('[v0] Inventory insert error - details:', invError.details)
          throw new Error(invError.message || 'Failed to create inventory record')
        }
      }

      // Refresh products
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          inventory(quantity_on_hand, reorder_level)
        `)
        .eq('business_id', business.id)
        .order('name')

      setProducts(productsData || [])
      setShowStockForm(false)
      setSelectedProduct(null)
      alert('Stock adjusted successfully!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Error adjusting stock:', errorMessage)
      alert(`Error adjusting stock: ${errorMessage}`)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId)

      if (error) throw error

      setProducts(products.filter((p) => p.id !== productId))
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage products, stock levels, and inventory
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {showForm && (
        <ProductForm
          business={business}
          categories={categories}
          product={selectedProduct}
          onSave={handleSaveProduct}
          onCancel={() => {
            setShowForm(false)
            setSelectedProduct(null)
          }}
          onCategoryCreated={refreshCategories}
        />
      )}

      {showStockForm && selectedProduct && (
        <StockAdjustmentForm
          product={selectedProduct}
          onSave={handleStockAdjustment}
          onCancel={() => {
            setShowStockForm(false)
            setSelectedProduct(null)
          }}
        />
      )}

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <SelectValue placeholder="Select category" />
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
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No products found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">SKU</th>
                    <th className="px-6 py-3 text-left font-semibold">Product Name</th>
                    <th className="px-6 py-3 text-left font-semibold">Category</th>
                    <th className="px-6 py-3 text-right font-semibold">Price</th>
                    <th className="px-6 py-3 text-center font-semibold">Stock</th>
                    <th className="px-6 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const inventory = product.inventory?.[0]
                    const category = categories.find((c) => c.id === product.category_id)
                    const stockStatus =
                      inventory &&
                      inventory.quantity_on_hand <= (inventory.reorder_level || 0)
                        ? 'text-red-600'
                        : 'text-green-600'

                    return (
                      <tr key={product.id} className="border-b hover:bg-muted/50">
                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                          {product.sku}
                        </td>
                        <td className="px-6 py-3 font-medium">{product.name}</td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {category?.name || '-'}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold">
                          {business.currency_code} {product.selling_price.toFixed(2)}
                        </td>
                        <td className={`px-6 py-3 text-center font-bold ${stockStatus}`}>
                          {inventory?.quantity_on_hand || 0}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product)
                                setShowStockForm(true)
                              }}
                              title="Adjust Stock"
                            >
                              <Package className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product)
                                setShowForm(true)
                              }}
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
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
