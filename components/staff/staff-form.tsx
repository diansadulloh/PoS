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

interface StaffFormProps {
  business: any
  staff?: any
  onSave: (formData: any) => Promise<void>
  onCancel: () => void
}

export default function StaffForm({
  business,
  staff,
  onSave,
  onCancel,
}: StaffFormProps) {
  const [formData, setFormData] = useState({
    first_name: staff?.first_name || '',
    last_name: staff?.last_name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    role: staff?.role || 'cashier',
    pin_code: staff?.pin_code || '',
    is_active: staff?.is_active ?? true,
  })

  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{staff ? 'Edit Staff Member' : 'Add New Staff Member'}</CardTitle>
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
            {/* First Name */}
            <div>
              <label className="text-sm font-medium mb-1 block">First Name *</label>
              <Input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                placeholder="John"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="text-sm font-medium mb-1 block">Last Name *</label>
              <Input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                placeholder="Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium mb-1 block">Email *</label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
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

            {/* Role */}
            <div>
              <label className="text-sm font-medium mb-1 block">Role *</label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* PIN Code */}
            <div>
              <label className="text-sm font-medium mb-1 block">PIN Code (Optional)</label>
              <Input
                type="password"
                value={formData.pin_code}
                onChange={(e) =>
                  setFormData({ ...formData, pin_code: e.target.value })
                }
                placeholder="4-digit PIN"
                maxLength={4}
              />
            </div>
          </div>

          {/* Role Description */}
          <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground">
            <p className="font-medium mb-1">
              {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} Permissions:
            </p>
            {formData.role === 'admin' && (
              <p>Full system access including staff management and configuration</p>
            )}
            {formData.role === 'manager' && (
              <p>Can create sales, invoices, manage customers, and view reports</p>
            )}
            {formData.role === 'cashier' && (
              <p>Can create sales transactions and process payments</p>
            )}
            {formData.role === 'inventory' && (
              <p>Can manage products, update stock levels, and track inventory</p>
            )}
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
              {saving ? 'Saving...' : 'Save Staff Member'}
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
