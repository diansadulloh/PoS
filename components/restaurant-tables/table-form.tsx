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

interface TableFormProps {
  table?: any
  onSave: (formData: any) => Promise<void>
  onCancel: () => void
}

export default function TableForm({ table, onSave, onCancel }: TableFormProps) {
  const [formData, setFormData] = useState({
    table_number: table?.table_number || '',
    section: table?.section || 'main',
    seat_capacity: table?.seat_capacity || 4,
    status: table?.status || 'available',
  })

  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.table_number.trim()) {
      alert('Please enter a table number')
      return
    }

    setSaving(true)

    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{table ? 'Edit Table' : 'Add Table'}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Table Number */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Table Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.table_number}
                onChange={(e) =>
                  setFormData({ ...formData, table_number: e.target.value })
                }
                placeholder="e.g., T1, Table 1"
                required
              />
            </div>

            {/* Seat Capacity */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Seat Capacity
              </label>
              <Input
                type="number"
                min="1"
                max="20"
                value={formData.seat_capacity}
                onChange={(e) =>
                  setFormData({ ...formData, seat_capacity: Number(e.target.value) })
                }
                required
              />
            </div>

            {/* Section */}
            <div>
              <label className="text-sm font-medium mb-1 block">Section</label>
              <Select
                value={formData.section}
                onValueChange={(value) => setFormData({ ...formData, section: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Dining</SelectItem>
                  <SelectItem value="patio">Patio</SelectItem>
                  <SelectItem value="bar">Bar Area</SelectItem>
                  <SelectItem value="private">Private Room</SelectItem>
                  <SelectItem value="terrace">Terrace</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : table ? 'Update Table' : 'Add Table'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
