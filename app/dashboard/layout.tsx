import React from "react"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/sidebar'
import TopBar from '@/components/dashboard/topbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/auth/login')
    }

    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar user={user} />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    )
  } catch (error) {
    console.error('[v0] Dashboard layout error:', error)
    redirect('/auth/login')
  }
}
