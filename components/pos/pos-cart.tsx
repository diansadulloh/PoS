'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, Minus, Plus } from 'lucide-react'

interface CartItem {
  id: string
  product_id: string
  name: string
  quantity: number
  unit_price: number
  tax_rate: number
  discount_percent: number
  line_total: number
}

interface POSCartProps {
  items: CartItem[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onUpdateDiscount: (itemId: string, discount: number) => void
  currency: string
}

export default function POSCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateDiscount,
  currency,
}: POSCartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cart Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currency} {item.unit_price.toFixed(2)} each
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.id)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="h-8 w-8 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                className="h-8 w-16 text-center text-sm"
                min="1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="h-8 w-8 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
              <span className="text-xs text-muted-foreground ml-auto">
                {currency} {(item.quantity * item.unit_price).toFixed(2)}
              </span>
            </div>

            {/* Discount */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium">Discount %:</label>
              <Input
                type="number"
                value={item.discount_percent}
                onChange={(e) => onUpdateDiscount(item.id, parseFloat(e.target.value) || 0)}
                className="h-8 w-20 text-center text-sm"
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            {/* Tax Info */}
            {item.tax_rate > 0 && (
              <p className="text-xs text-muted-foreground">
                Tax: {item.tax_rate}% ({currency} {((item.quantity * item.unit_price * item.tax_rate) / 100).toFixed(2)})
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
