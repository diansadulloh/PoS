'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import POSRegister from '@/components/pos/pos-register'
import { useRouter } from 'next/navigation'

export default function POSPage() {
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
        .single()

      setBusiness(data)
      setLoading(false)
    }

    fetchBusiness()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading POS Register...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">Point of Sale Not Available</h2>
          <p className="text-muted-foreground">
            {'You need to create a business profile before using the POS system.'}
          </p>
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Create Business Profile
          </button>
        </div>
      </div>
    )
  }

  return <POSRegister business={business} />
}
