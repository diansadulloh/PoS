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

interface CustomerFormProps {
  customer?: any
  onSave: (formData: any) => Promise<void>
  onCancel: () => void
}

export default function CustomerForm({
  customer,
  onSave,
  onCancel,
}: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    postal_code: customer?.postal_code || '',
    country: customer?.country || '',
    tax_id: customer?.tax_id || '',
    customer_group: customer?.customer_group || 'retail',
    credit_limit: customer?.credit_limit || 0,
    tax_exempt: customer?.tax_exempt || false,
    is_active: customer?.is_active ?? true,
  })

  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await onSave({
        ...formData,
        credit_limit: parseFloat(formData.credit_limit) || 0,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
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
            {/* Name */}
            <div>
              <label className="text-sm font-medium mb-1 block">Name *</label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Customer name"
              />
            </div>

            {/* Customer Group */}
            <div>
              <label className="text-sm font-medium mb-1 block">Customer Group</label>
              <Select
                value={formData.customer_group}
                onValueChange={(value) =>
                  setFormData({ ...formData, customer_group: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1234567890"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Address</label>
              <Input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Street address"
              />
            </div>

            {/* City */}
            <div>
              <label className="text-sm font-medium mb-1 block">City</label>
              <Input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="City"
              />
            </div>

            {/* State */}
            <div>
              <label className="text-sm font-medium mb-1 block">State</label>
              <Input
                type="text"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                placeholder="State/Province"
              />
            </div>

            {/* Postal Code */}
            <div>
              <label className="text-sm font-medium mb-1 block">Postal Code</label>
              <Input
                type="text"
                value={formData.postal_code}
                onChange={(e) =>
                  setFormData({ ...formData, postal_code: e.target.value })
                }
                placeholder="Postal code"
              />
            </div>

            {/* Country */}
            <div>
              <label className="text-sm font-medium mb-1 block">Country</label>
              <Input
                type="text"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                placeholder="Country"
              />
            </div>

            {/* Tax ID */}
            <div>
              <label className="text-sm font-medium mb-1 block">Tax ID</label>
              <Input
                type="text"
                value={formData.tax_id}
                onChange={(e) =>
                  setFormData({ ...formData, tax_id: e.target.value })
                }
                placeholder="Tax ID / VAT number"
              />
            </div>

            {/* Credit Limit */}
            <div>
              <label className="text-sm font-medium mb-1 block">Credit Limit</label>
              <Input
                type="number"
                step="0.01"
                value={formData.credit_limit}
                onChange={(e) =>
                  setFormData({ ...formData, credit_limit: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.tax_exempt}
                onChange={(e) =>
                  setFormData({ ...formData, tax_exempt: e.target.checked })
                }
                className="rounded"
              />
              <label className="text-sm font-medium cursor-pointer">
                Tax Exempt
              </label>
            </div>
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
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Customer'}
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
