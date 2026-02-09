'use client'

import React from "react"

import { useState } from 'react'
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
import { X } from 'lucide-react'

interface StockAdjustmentFormProps {
  product: any
  onSave: (adjustment: any) => Promise<void>
  onCancel: () => void
}

export default function StockAdjustmentForm({
  product,
  onSave,
  onCancel,
}: StockAdjustmentFormProps) {
  const [formData, setFormData] = useState({
    transaction_type: 'adjustment',
    quantity: '',
    reference_type: 'manual',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const currentStock = product.inventory?.[0]?.quantity_on_hand || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.quantity || parseFloat(formData.quantity) === 0) {
      alert('Please enter a valid quantity')
      return
    }

    setSaving(true)

    try {
      await onSave({
        product_id: product.id,
        transaction_type: formData.transaction_type,
        quantity: parseFloat(formData.quantity),
        reference_type: formData.reference_type,
        notes: formData.notes,
      })
    } finally {
      setSaving(false)
    }
  }

  const calculateNewStock = () => {
    const qty = parseFloat(formData.quantity) || 0
    if (formData.transaction_type === 'adjustment' || formData.transaction_type === 'receiving') {
      return currentStock + qty
    }
    return currentStock - qty
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Adjust Stock - {product.name}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-2xl font-bold">{currentStock}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Adjustment</p>
              <p className="text-2xl font-bold">
                {formData.quantity
                  ? `${formData.transaction_type === 'adjustment' || formData.transaction_type === 'receiving' ? '+' : '-'}${formData.quantity}`
                  : '0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">New Stock</p>
              <p className="text-2xl font-bold text-primary">{calculateNewStock()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Transaction Type</label>
              <Select
                value={formData.transaction_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, transaction_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjustment">Stock Adjustment (Add)</SelectItem>
                  <SelectItem value="receiving">Receiving (Add)</SelectItem>
                  <SelectItem value="sale">Sale (Remove)</SelectItem>
                  <SelectItem value="return">Return (Remove)</SelectItem>
                  <SelectItem value="damage">Damage/Loss (Remove)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Quantity{' '}
                <span className="text-muted-foreground">
                  ({formData.transaction_type === 'adjustment' || formData.transaction_type === 'receiving' ? 'add' : 'remove'})
                </span>
              </label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                min="0"
                step="1"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Notes</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md min-h-[80px]"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Reason for stock adjustment..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} className="bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Adjustment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
