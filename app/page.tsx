'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Search, Loader2, History, X } from 'lucide-react'
import CheckoutDialog from '@/components/customer/checkout-dialog'
import OrderSummaryDialog, { OrderSummaryData } from '@/components/customer/order-summary-dialog'

const DEFAULT_BUSINESS_ID = 'e7b99a74-4394-42c4-9659-0ac5b76c5527'

export default function Page() {
  const searchParams = useSearchParams()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [business, setBusiness] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showOrderHistory, setShowOrderHistory] = useState(false)
  const [lastOrder, setLastOrder] = useState<OrderSummaryData | null>(null)
  const [hasOrderHistory, setHasOrderHistory] = useState(false)

  // Load business and products on mount
  useEffect(() => {
    const loadBusiness = async () => {
      const supabase = createClient()
      
      // Get business ID from URL or use default
      const urlBusinessId = searchParams.get('business_id') || DEFAULT_BUSINESS_ID
      setBusinessId(urlBusinessId)

      try {
        // Fetch business
        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', urlBusinessId)
          .single()

        setBusiness(businessData)

        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .eq('business_id', urlBusinessId)
          .eq('is_active', true)
          .order('name')

        setCategories(categoriesData || [])

        // Fetch products with inventory
        const { data: productsData } = await supabase
          .from('products')
          .select(`
            id,
            name,
            description,
            selling_price,
            image_url,
            category_id,
            is_active,
            inventory(quantity_on_hand)
          `)
          .eq('business_id', urlBusinessId)
          .eq('is_active', true)
          .order('name')

        setProducts(productsData || [])
        setLoading(false)
      } catch (error) {
        console.error('[v0] Error loading business:', error)
        setLoading(false)
      }
    }

    loadBusiness()
  }, [searchParams])

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleAddToCart = (product: any) => {
    const existingItem = cart.find((item) => item.id === product.id)
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      )
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.id !== productId))
    } else {
      setCart(
        cart.map((item) => (item.id === productId ? { ...item, quantity } : item))
      )
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.selling_price || 0) * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto" />
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{business?.name}</h1>
                <p className="text-sm text-gray-600">Order from our menu</p>
              </div>
            </div>
            <Button
              onClick={() => setShowCart(!showCart)}
              className="bg-orange-600 hover:bg-orange-700 text-white relative"
            >
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                  className="w-full justify-start"
                >
                  All Items
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(category.id)}
                    className="w-full justify-start"
                  >
                    {category.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Products */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No products found</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {product.image_url && (
                      <div className="w-full h-40 bg-gray-200 relative overflow-hidden">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="pt-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-orange-600">
                          {business?.currency_code} {product.selling_price?.toFixed(2)}
                        </p>
                        <Button
                          onClick={() => handleAddToCart(product)}
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          disabled={!product.inventory?.[0]?.quantity_on_hand || product.inventory[0].quantity_on_hand <= 0}
                        >
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <Card className={`sticky top-24 ${showCart ? 'block' : 'hidden lg:block'}`}>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500">No items selected</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-600">
                              {business?.currency_code} {item.selling_price?.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 bg-transparent"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="text-sm font-medium w-6 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 bg-transparent"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">
                          {business?.currency_code} {cartTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-orange-600">
                          {business?.currency_code} {cartTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => setShowCheckout(true)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white h-10"
                    >
                      Checkout
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={showCheckout}
        onOpenChange={setShowCheckout}
        cartItems={cart}
        cartTotal={cartTotal}
        business={business}
        onCheckoutComplete={() => {
          setCart([])
          setShowCart(false)
        }}
      />
    </div>
  )
}
