'use client'

import React from "react"

import { useState } from 'react'
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
import { X, Plus } from 'lucide-react'

interface ProductFormProps {
  business: any
  categories: any[]
  product?: any
  onSave: (formData: any) => Promise<void>
  onCancel: () => void
  onCategoryCreated?: () => Promise<void>
}

export default function ProductForm({
  business,
  categories,
  product,
  onSave,
  onCancel,
  onCategoryCreated,
}: ProductFormProps) {
  const [formData, setFormData] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    category_id: product?.category_id || '',
    purchase_price: product?.purchase_price || '',
    selling_price: product?.selling_price || '',
    tax_rate: product?.tax_rate || 0,
    tax_type: product?.tax_type || 'vat',
    barcode: product?.barcode || '',
    is_active: product?.is_active ?? true,
    reorder_level: product?.reorder_level || 10,
  })

  const [saving, setSaving] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name')
      return
    }

    setCreatingCategory(true)
    const supabase = createClient()

    try {
      console.log('[v0] Creating category with data:', {
        business_id: business.id,
        name: newCategoryName.trim(),
        is_active: true,
      })

      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            business_id: business.id,
            name: newCategoryName.trim(),
            is_active: true,
          },
        ])
        .select()
        .single()

      console.log('[v0] Category insert response:', { data, error })

      if (error) {
        console.error('[v0] Error creating category - code:', error.code)
        console.error('[v0] Error creating category - message:', error.message)
        console.error('[v0] Error creating category - details:', error.details)
        console.error('[v0] Error creating category - hint:', error.hint)
        throw new Error(error.message || 'Failed to create category')
      }

      // Update form with the new category
      setFormData({ ...formData, category_id: data.id })
      setNewCategoryName('')
      setShowNewCategory(false)
      
      // Trigger parent refresh if callback provided
      if (onCategoryCreated) {
        await onCategoryCreated()
      }
      
      alert(`Category "${data.name}" created successfully!`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Error creating category:', errorMessage)
      alert(`Error creating category: ${errorMessage}`)
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await onSave({
        ...formData,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        reorder_level: parseInt(formData.reorder_level) || 10,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{product ? 'Edit Product' : 'Add New Product'}</CardTitle>
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
            {/* SKU */}
            <div>
              <label className="text-sm font-medium mb-1 block">SKU *</label>
              <Input
                type="text"
                required
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                placeholder="e.g., PROD-001"
              />
            </div>

            {/* Product Name */}
            <div>
              <label className="text-sm font-medium mb-1 block">Product Name *</label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Product name"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              {showNewCategory ? (
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter new category name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCreateCategory()
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={creatingCategory}
                      className="flex-1"
                    >
                      {creatingCategory ? 'Creating...' : 'Create Category'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowNewCategory(false)
                        setNewCategoryName('')
                      }}
                      className="flex-1 bg-transparent"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewCategory(true)}
                    className="w-full gap-2 bg-transparent"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Category
                  </Button>
                </div>
              )}
            </div>

            {/* Barcode */}
            <div>
              <label className="text-sm font-medium mb-1 block">Barcode</label>
              <Input
                type="text"
                value={formData.barcode}
                onChange={(e) =>
                  setFormData({ ...formData, barcode: e.target.value })
                }
                placeholder="Barcode"
              />
            </div>

            {/* Purchase Price */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Purchase Price ({business.currency_code})
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_price: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Selling Price ({business.currency_code}) *
              </label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.selling_price}
                onChange={(e) =>
                  setFormData({ ...formData, selling_price: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            {/* Tax Type */}
            <div>
              <label className="text-sm font-medium mb-1 block">Tax Type</label>
              <Select
                value={formData.tax_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, tax_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="vat">VAT</SelectItem>
                  <SelectItem value="gst">GST</SelectItem>
                  <SelectItem value="sales_tax">Sales Tax</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tax Rate */}
            <div>
              <label className="text-sm font-medium mb-1 block">Tax Rate (%)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) =>
                  setFormData({ ...formData, tax_rate: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            {/* Minimum Stock (Reorder Level) */}
            <div>
              <label className="text-sm font-medium mb-1 block">Minimum Stock (for low stock tracking)</label>
              <Input
                type="number"
                step="1"
                min="0"
                value={formData.reorder_level}
                onChange={(e) =>
                  setFormData({ ...formData, reorder_level: e.target.value })
                }
                placeholder="Enter minimum quantity"
              />
              <p className="text-xs text-muted-foreground mt-1">Alert when stock falls below this level</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Product description"
              className="w-full min-h-20 px-3 py-2 border rounded-md"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="rounded"
            />
            <label className="text-sm font-medium cursor-pointer">
              Active
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Product'}
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
