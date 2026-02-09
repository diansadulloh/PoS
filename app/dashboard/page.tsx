'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import DashboardOverview from '@/components/dashboard/overview'
import QuickStats from '@/components/dashboard/quick-stats'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function DashboardPage() {
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', user.id)
            .maybeSingle()

          if (data && !error) {
            setBusiness(data)
          }
        }
      } catch (error) {
        console.error('[v0] Error fetching business:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="p-8 flex items-center justify-center min-h-full">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome to POS System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Let's get started by setting up your business profile.</p>
            </div>
            <Link href="/dashboard/settings" className="block">
              <Button className="w-full">Create Business Profile</Button>
            </Link>
            <Link href="/dashboard/inventory" className="block">
              <Button variant="outline" className="w-full bg-transparent">Add Products</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome to {business.name}</h1>
        <p className="text-muted-foreground mt-2">Manage your Point of Sale operations</p>
      </div>

      <QuickStats business={business} />
      <DashboardOverview business={business} />
    </div>
  )
}
