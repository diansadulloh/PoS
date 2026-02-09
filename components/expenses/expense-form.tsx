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

interface ExpenseFormProps {
  expense?: any
  onSave: (formData: any) => Promise<void>
  onCancel: () => void
}

export default function ExpenseForm({
  expense,
  onSave,
  onCancel,
}: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    category: expense?.category || 'utilities',
    description: expense?.description || '',
    amount: expense?.amount || '',
    expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
    payment_method: expense?.payment_method || 'cash',
    reference_number: expense?.reference_number || '',
    tax_amount: expense?.tax_amount || 0,
  })

  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await onSave({
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        tax_amount: parseFloat(formData.tax_amount) || 0,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{expense ? 'Edit Expense' : 'Add New Expense'}</CardTitle>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="text-sm font-medium mb-1 block">Category *</label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="salaries">Salaries</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="taxes">Taxes</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expense Date */}
            <div>
              <label className="text-sm font-medium mb-1 block">Expense Date *</label>
              <Input
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) =>
                  setFormData({ ...formData, expense_date: e.target.value })
                }
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium mb-1 block">Amount *</label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            {/* Tax Amount */}
            <div>
              <label className="text-sm font-medium mb-1 block">Tax Amount</label>
              <Input
                type="number"
                step="0.01"
                value={formData.tax_amount}
                onChange={(e) =>
                  setFormData({ ...formData, tax_amount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-sm font-medium mb-1 block">Payment Method</label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) =>
                  setFormData({ ...formData, payment_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference Number */}
            <div>
              <label className="text-sm font-medium mb-1 block">Reference Number</label>
              <Input
                type="text"
                value={formData.reference_number}
                onChange={(e) =>
                  setFormData({ ...formData, reference_number: e.target.value })
                }
                placeholder="Invoice/receipt number"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Description *</label>
              <Input
                type="text"
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Expense description"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Expense'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
