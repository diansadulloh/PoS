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
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [business, setBusiness] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchBusiness = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (data) {
        setBusiness(data)
      } else {
        // Initialize empty business for creation
        setIsCreating(true)
        setBusiness({
          name: '',
          email: user.email || '',
          phone: '',
          address: '',
          city: '',
          state: '',
          postal_code: '',
          country: '',
          currency_code: 'USD',
          timezone: 'UTC',
          default_language: 'en',
        })
      }
      setLoading(false)
    }

    fetchBusiness()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      if (isCreating) {
        // Create new business
        const { data, error } = await supabase
          .from('businesses')
          .insert({
            owner_id: user.id,
            name: business.name,
            email: business.email,
            phone: business.phone,
            address: business.address,
            city: business.city,
            state: business.state,
            postal_code: business.postal_code,
            country: business.country,
            currency_code: business.currency_code,
            timezone: business.timezone,
            default_language: business.default_language || 'en',
          })
          .select()
          .single()

        if (error) {
          console.error('[v0] Error creating business - code:', error.code)
          console.error('[v0] Error creating business - message:', error.message)
          console.error('[v0] Error creating business - details:', error.details)
          throw new Error(error.message || 'Failed to create business')
        }

        console.log('[v0] Business created, now creating admin staff entry')

        // Also create a staff entry for the owner as admin
        const { error: staffError } = await supabase.from('staff').insert({
          business_id: data.id,
          user_id: user.id,
          first_name: user.user_metadata?.first_name || 'Owner',
          last_name: user.user_metadata?.last_name || '',
          email: user.email || '',
          role: 'admin',
          is_active: true,
        })

        if (staffError) {
          console.error('[v0] Error creating staff entry - code:', staffError.code)
          console.error('[v0] Error creating staff entry - message:', staffError.message)
          console.error('[v0] Error creating staff entry - details:', staffError.details)
          // Don't throw here, the business was created successfully
          console.warn('[v0] Staff entry creation failed but business was created')
        }

        setBusiness(data)
        setIsCreating(false)
        alert('Business profile created successfully!')
        router.push('/dashboard')
      } else {
        // Update existing business
        const { error } = await supabase
          .from('businesses')
          .update({
            name: business.name,
            email: business.email,
            phone: business.phone,
            address: business.address,
            city: business.city,
            state: business.state,
            postal_code: business.postal_code,
            country: business.country,
            currency_code: business.currency_code,
            timezone: business.timezone,
            default_language: business.default_language || 'en',
          })
          .eq('id', business.id)

        if (error) {
          console.error('[v0] Error updating business - code:', error.code)
          console.error('[v0] Error updating business - message:', error.message)
          console.error('[v0] Error updating business - details:', error.details)
          throw new Error(error.message || 'Failed to update business')
        }

        alert('Settings saved successfully')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Error saving settings:', errorMessage)
      alert(
        isCreating
          ? `Error creating business profile: ${errorMessage}`
          : `Error saving settings: ${errorMessage}`
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {isCreating ? 'Create Business Profile' : 'Business Settings'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isCreating
            ? 'Set up your business information to get started'
            : 'Manage your business information'}
        </p>
      </div>

      {business && (
        <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Business Name</label>
                  <Input
                    value={business.name}
                    onChange={(e) =>
                      setBusiness({ ...business, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    type="email"
                    value={business.email}
                    onChange={(e) =>
                      setBusiness({ ...business, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone</label>
                  <Input
                    value={business.phone || ''}
                    onChange={(e) =>
                      setBusiness({ ...business, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Currency</label>
                  <Input
                    value={business.currency_code}
                    onChange={(e) =>
                      setBusiness({
                        ...business,
                        currency_code: e.target.value.toUpperCase(),
                      })
                    }
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Default Language</label>
                  <Select
                    value={business.default_language || 'en'}
                    onValueChange={(value) =>
                      setBusiness({ ...business, default_language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="id">Bahasa Indonesia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Address</label>
                <Input
                  value={business.address || ''}
                  onChange={(e) =>
                    setBusiness({ ...business, address: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <Input
                    value={business.city || ''}
                    onChange={(e) =>
                      setBusiness({ ...business, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">State</label>
                  <Input
                    value={business.state || ''}
                    onChange={(e) =>
                      setBusiness({ ...business, state: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Postal Code</label>
                  <Input
                    value={business.postal_code || ''}
                    onChange={(e) =>
                      setBusiness({ ...business, postal_code: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Country</label>
                  <Input
                    value={business.country || ''}
                    onChange={(e) =>
                      setBusiness({ ...business, country: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving || !business.name || !business.email}>
            {saving 
              ? (isCreating ? 'Creating...' : 'Saving...') 
              : (isCreating ? 'Create Business Profile' : 'Save Settings')}
          </Button>
        </form>
      )}
    </div>
  )
}
