'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CustomerPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStartOrder = () => {
    if (!businessId.trim()) {
      alert('Please enter a business code')
      return
    }
    router.push(`/customer/order?business_id=${businessId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-bold text-slate-900">Order System</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Side - Welcome */}
          <div className="flex flex-col justify-center">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Order Your Favorites
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Browse our menu, select your items, and place your order in just a few taps. Fast,
              easy, and convenient.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm mt-1">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Enter Business Code</h3>
                  <p className="text-sm text-slate-600">
                    Get the business code from your restaurant or store
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm mt-1">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Browse Menu</h3>
                  <p className="text-sm text-slate-600">
                    Explore all available items with descriptions and prices
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm mt-1">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Place Order</h3>
                  <p className="text-sm text-slate-600">
                    Add items to cart and proceed to checkout
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Input Form */}
          <div className="flex items-center">
            <Card className="w-full shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Start Ordering</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Business Code
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="Enter your business code..."
                      className="pl-10 h-12 text-base"
                      value={businessId}
                      onChange={(e) => setBusinessId(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleStartOrder()
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    You can find this code on your receipt or ask the staff
                  </p>
                </div>

                <Button
                  onClick={handleStartOrder}
                  disabled={loading || !businessId.trim()}
                  className="w-full h-12 text-base bg-orange-500 hover:bg-orange-600 text-white gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {loading ? 'Loading...' : 'Browse Menu'}
                </Button>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600 mb-3">Demo Code</p>
                  <div className="flex flex-wrap gap-2">
                    {['DEMO-001', 'TEST-001'].map((code) => (
                      <button
                        key={code}
                        onClick={() => setBusinessId(code)}
                        className="text-sm px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-slate-600 text-center">
            © 2024 Order System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
