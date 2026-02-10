'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus } from 'lucide-react'

interface ProductSelectorProps {
  business: any
  onAddProduct: (product: any, quantity: number) => void
  refreshTrigger?: number
}

export default function ProductSelector({ business, onAddProduct, refreshTrigger = 0 }: ProductSelectorProps) {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({})

  const fetchData = async () => {
    const supabase = createClient()

    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .eq('business_id', business.id)
      .order('name')

    setCategories(categoriesData || [])

    // Fetch products with inventory data
    const { data: productsData } = await supabase
      .from('products')
      .select(`
        *,
        inventory(quantity_on_hand, reorder_level)
      `)
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('name')

    setProducts(productsData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [business.id, refreshTrigger])

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category_id === selectedCategory
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleAddToCart = (product: any) => {
    if (!product || !product.id) {
      console.error('[v0] Invalid product:', product)
      return
    }
    const quantity = selectedQuantities[product.id] || 1
    if (quantity <= 0) {
      console.warn('[v0] Invalid quantity:', quantity)
      return
    }
    console.log('[v0] Adding to cart:', product.id, quantity)
    onAddProduct(product, quantity)
    setSelectedQuantities((prev) => ({ ...prev, [product.id]: 1 }))
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Product Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              id="product-search"
              name="productSearch"
              placeholder="Search products by name or SKU..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
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
          )}
        </CardContent>
      </Card>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredProducts.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-muted-foreground">
            No products found
          </div>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
                  {product.inventory?.[0] && (
                    <div className="mt-1 text-xs">
                      <p className={product.inventory[0].quantity_on_hand <= 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                        Stock: {product.inventory[0].quantity_on_hand} units
                      </p>
                      {product.inventory[0].quantity_on_hand <= product.inventory[0].reorder_level && product.inventory[0].quantity_on_hand > 0 && (
                        <p className="text-amber-600 text-xs">Low stock</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold">
                      {business.currency_code} {product.selling_price.toFixed(2)}
                    </p>
                    {product.tax_rate > 0 && (
                      <p className="text-xs text-muted-foreground">
                        +{product.tax_rate}% {product.tax_type}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Input
                      type="number"
                      min="1"
                      value={selectedQuantities[product.id] || 1}
                      onChange={(e) =>
                        setSelectedQuantities((prev) => ({
                          ...prev,
                          [product.id]: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="w-16 h-9 text-center text-sm"
                    />
                    <Button
                      onClick={() => handleAddToCart(product)}
                      size="sm"
                      className="h-9"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
