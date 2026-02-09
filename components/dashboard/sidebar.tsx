'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Home,
  UtensilsCrossed,
  TrendingUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const sidebarItems = [
  {
    category: 'Main',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Point of Sale', href: '/dashboard/pos', icon: ShoppingCart },
    ],
  },
  {
    category: 'Operations',
    items: [
      { label: 'Inventory', href: '/dashboard/inventory', icon: Package },
      { label: 'Customers', href: '/dashboard/customers', icon: Users },
      { label: 'Suppliers', href: '/dashboard/suppliers', icon: TrendingUp },
    ],
  },
  {
    category: 'Sales & Invoicing',
    items: [
      { label: 'Sales Register', href: '/dashboard/sales', icon: DollarSign },
      { label: 'Quotations', href: '/dashboard/quotations', icon: FileText },
      { label: 'Invoices', href: '/dashboard/invoices', icon: FileText },
    ],
  },
  {
    category: 'Financial',
    items: [
      { label: 'Expenses', href: '/dashboard/expenses', icon: DollarSign },
      { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
      { label: 'Cash Register', href: '/dashboard/cash-register', icon: DollarSign },
    ],
  },
  {
    category: 'Restaurant',
    items: [
      { label: 'Tables', href: '/dashboard/restaurant-tables', icon: UtensilsCrossed },
    ],
  },
  {
    category: 'Admin',
    items: [
      { label: 'Staff Management', href: '/dashboard/staff', icon: Users },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen border-r border-slate-800">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          POS System
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {sidebarItems.map((category) => (
          <div key={category.category} className="mb-6">
            <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {category.category}
            </h3>
            <div className="space-y-1">
              {category.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'mx-2 px-4 py-2 rounded-md flex items-center gap-3 transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  )
}
