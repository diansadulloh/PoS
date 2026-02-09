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
import { X, Plus, Trash2 } from 'lucide-react'

interface InvoiceFormProps {
  business: any
  customers: any[]
  products: any[]
  onSave: (formData: any) => Promise<void>
  onCancel: () => void
}

interface LineItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  tax_rate: number
  discount_percent: number
  discount_amount: number
  tax_amount: number
  line_total: number
}

export default function InvoiceForm({
  business,
  customers,
  products,
  onSave,
  onCancel,
}: InvoiceFormProps) {
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    status: 'unpaid',
  })
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [saving, setSaving] = useState(false)

  const generateInvoiceNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000)
    return `INV-${year}${month}-${String(random).padStart(4, '0')}`
  }

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
      discount_percent: 0,
      discount_amount: 0,
      tax_amount: 0,
      line_total: 0,
    }
    setLineItems([...lineItems, newItem])
  }

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item

        const updated = { ...item, [field]: value }

        if (field === 'product_id') {
          const product = products.find((p) => p.id === value)
          if (product) {
            updated.product_name = product.name
            updated.unit_price = product.selling_price || 0
            updated.tax_rate = product.tax_rate || 0
          }
        }

        // Recalculate totals
        const subtotal = updated.quantity * updated.unit_price
        const discountAmount =
          updated.discount_percent > 0
            ? (subtotal * updated.discount_percent) / 100
            : updated.discount_amount
        const taxableAmount = subtotal - discountAmount
        const taxAmount = (taxableAmount * updated.tax_rate) / 100
        const lineTotal = taxableAmount + taxAmount

        updated.discount_amount = discountAmount
        updated.tax_amount = taxAmount
        updated.line_total = lineTotal

        return updated
      })
    )
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id))
  }

  const calculateTotals = () => {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    )
    const discountAmount = lineItems.reduce(
      (sum, item) => sum + item.discount_amount,
      0
    )
    const taxAmount = lineItems.reduce((sum, item) => sum + item.tax_amount, 0)
    const totalAmount = lineItems.reduce((sum, item) => sum + item.line_total, 0)

    return { subtotal, discountAmount, taxAmount, totalAmount }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customer_id) {
      alert('Please select a customer')
      return
    }

    if (lineItems.length === 0) {
      alert('Please add at least one line item')
      return
    }

    if (lineItems.some((item) => !item.product_id)) {
      alert('Please select a product for all line items')
      return
    }

    setSaving(true)

    try {
      const totals = calculateTotals()
      const invoiceNumber = generateInvoiceNumber()

      await onSave({
        ...formData,
        invoice_number: invoiceNumber,
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        tax_amount: totals.taxAmount,
        total_amount: totals.totalAmount,
        paid_amount: 0,
        line_items: lineItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          discount_percent: item.discount_percent,
          discount_amount: item.discount_amount,
          tax_amount: item.tax_amount,
          line_total: item.line_total,
        })),
      })
    } finally {
      setSaving(false)
    }
  }

  const totals = calculateTotals()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Create Invoice</CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Customer <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, customer_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Invoice Date */}
            <div>
              <label className="text-sm font-medium mb-1 block">Invoice Date</label>
              <Input
                type="date"
                value={formData.invoice_date}
                onChange={(e) =>
                  setFormData({ ...formData, invoice_date: e.target.value })
                }
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="text-sm font-medium mb-1 block">Due Date</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Line Items</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addLineItem}
                className="gap-2 bg-transparent"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>

            {lineItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                <p>No items added yet</p>
                <p className="text-sm mt-1">
                  {'Click "Add Item" to start building your invoice'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lineItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-12 md:col-span-4">
                        <label className="text-xs font-medium mb-1 block">Product</label>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) =>
                            updateLineItem(item.id, 'product_id', value)
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-6 md:col-span-2">
                        <label className="text-xs font-medium mb-1 block">Qty</label>
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          className="h-9 text-sm"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(item.id, 'quantity', Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="col-span-6 md:col-span-2">
                        <label className="text-xs font-medium mb-1 block">Price</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="h-9 text-sm"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateLineItem(item.id, 'unit_price', Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="col-span-6 md:col-span-2">
                        <label className="text-xs font-medium mb-1 block">
                          Disc %
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="h-9 text-sm"
                          value={item.discount_percent}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              'discount_percent',
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>

                      <div className="col-span-5 md:col-span-2">
                        <label className="text-xs font-medium mb-1 block">Total</label>
                        <div className="h-9 flex items-center text-sm font-semibold">
                          {business.currency_code} {item.line_total.toFixed(2)}
                        </div>
                      </div>

                      <div className="col-span-1 flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                          className="h-9 w-9 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    {business.currency_code} {totals.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discount:</span>
                  <span className="font-medium text-red-600">
                    - {business.currency_code} {totals.discountAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span className="font-medium">
                    {business.currency_code} {totals.taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>
                    {business.currency_code} {totals.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-1 block">Notes</label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || lineItems.length === 0}>
              {saving ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
