'use client'

import React from "react"

import { useState, useEffect } from 'react'
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
import { X } from 'lucide-react'

interface RegisterFormProps {
  onSave: (formData: any) => Promise<void>
  onCancel: () => void
  registerToClose?: any
  businessId?: string
}

export default function RegisterForm({
  onSave,
  onCancel,
  registerToClose,
  businessId,
}: RegisterFormProps) {
  const [formData, setFormData] = useState({
    register_name: registerToClose?.register_name || 'Main Register',
    opening_balance: registerToClose?.opening_balance || '',
    closing_balance: registerToClose ? '' : undefined,
    assigned_staff_id: registerToClose?.assigned_staff_id || '',
    notes: registerToClose?.notes || '',
  })

  const [saving, setSaving] = useState(false)
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!businessId || registerToClose) return

      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get user's staff role
      const { data: staffData } = await supabase
        .from('staff')
        .select('role')
        .eq('user_id', user?.id)
        .eq('business_id', businessId)
        .single()

      setUserRole(staffData?.role || null)

      // Only show staff list if user is admin
      if (staffData?.role === 'admin') {
        const { data } = await supabase
          .from('staff')
          .select('id, first_name, last_name')
          .eq('business_id', businessId)
          .order('first_name')

        setStaffMembers(data || [])
      }
    }

    fetchData()
  }, [businessId, registerToClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const data: any = {
        ...formData,
        opening_balance: parseFloat(formData.opening_balance) || 0,
      }

      if (registerToClose && formData.closing_balance !== undefined) {
        data.closing_balance = parseFloat(formData.closing_balance) || 0
        data.variance = data.closing_balance - data.opening_balance
      }

      await onSave(data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {registerToClose ? 'Close Cash Register' : 'Open Cash Register'}
        </CardTitle>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!registerToClose && (
            <>
              {/* Register Name */}
              <div>
                <label className="text-sm font-medium mb-1 block">Register Name *</label>
                <Input
                  type="text"
                  required
                  value={formData.register_name}
                  onChange={(e) =>
                    setFormData({ ...formData, register_name: e.target.value })
                  }
                  placeholder="Main Register"
                />
              </div>

              {/* Opening Balance */}
              <div>
                <label className="text-sm font-medium mb-1 block">Opening Balance *</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.opening_balance}
                  onChange={(e) =>
                    setFormData({ ...formData, opening_balance: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>

              {/* Assigned Staff - Only show for admins */}
              {userRole === 'admin' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Assign to Staff Member *</label>
                  <Select
                    value={formData.assigned_staff_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assigned_staff_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.first_name} {staff.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {registerToClose && (
            <>
              {/* Opening Balance (Read-only) */}
              <div>
                <label className="text-sm font-medium mb-1 block">Opening Balance</label>
                <Input
                  type="text"
                  disabled
                  value={`${formData.opening_balance}`}
                  className="bg-muted"
                />
              </div>

              {/* Closing Balance */}
              <div>
                <label className="text-sm font-medium mb-1 block">Closing Balance *</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.closing_balance}
                  onChange={(e) =>
                    setFormData({ ...formData, closing_balance: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>

              {formData.closing_balance && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Variance:</span>
                    <span
                      className={`font-bold ${
                        parseFloat(formData.closing_balance) -
                          parseFloat(formData.opening_balance) >=
                        0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {(
                        parseFloat(formData.closing_balance) -
                        parseFloat(formData.opening_balance)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-1 block">Notes</label>
            <Input
              type="text"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Optional notes"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving
                ? 'Processing...'
                : registerToClose
                  ? 'Close Register'
                  : 'Open Register'}
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
