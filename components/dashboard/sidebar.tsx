'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
  ChevronLeft,
  LayoutDashboard,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isMinimized, setIsMinimized] = useState(false)

  const sidebarItems = [
    {
      category: 'Main',
      items: [
        { label: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { label: t('pos'), href: '/dashboard/pos', icon: ShoppingCart },
      ],
    },
    {
      category: 'Operations',
      items: [
        { label: t('inventory'), href: '/dashboard/inventory', icon: Package },
        { label: t('customers'), href: '/dashboard/customers', icon: Users },
        { label: t('suppliers'), href: '/dashboard/suppliers', icon: TrendingUp },
      ],
    },
    {
      category: 'Sales',
      items: [
        { label: t('sales'), href: '/dashboard/sales', icon: DollarSign },
        { label: t('quotations'), href: '/dashboard/quotations', icon: FileText },
        { label: t('invoices'), href: '/dashboard/invoices', icon: FileText },
      ],
    },
    {
      category: 'Management',
      items: [
        { label: t('expenses'), href: '/dashboard/expenses', icon: DollarSign },
        { label: t('reports'), href: '/dashboard/reports', icon: BarChart3 },
        { label: t('restaurantTables'), href: '/dashboard/restaurant-tables', icon: UtensilsCrossed },
      ],
    },
    {
      category: 'System',
      items: [
        { label: t('staff'), href: '/dashboard/staff', icon: Users },
        { label: t('settings'), href: '/dashboard/settings', icon: Settings },
      ],
    },
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <aside 
      className={cn(
        'relative bg-[#0f172a] text-slate-300 flex flex-col h-screen transition-all duration-300 ease-in-out border-r border-slate-800',
        isMinimized ? 'w-[78px]' : 'w-72'
      )}
    >
      {/* Toggle Button - Floating Style */}
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        className="absolute -right-3 top-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-1 shadow-lg z-50 transition-transform active:scale-90"
      >
        <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', isMinimized && 'rotate-180')} />
      </button>

      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 mb-2">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          {!isMinimized && (
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              POS PRO
            </span>
          )}
        </div>
      </div>

      {/* Navigation Content */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 space-y-6">
        {sidebarItems.map((category) => (
          <div key={category.category}>
            {!isMinimized && (
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[2px] mb-3">
                {category.category}
              </p>
            )}
            <div className="space-y-1">
              {category.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      isActive 
                        ? 'bg-blue-600/10 text-blue-400 font-medium' 
                        : 'hover:bg-slate-800/50 hover:text-white'
                    )}
                  >
                    {/* Active Indicator Line */}
                    {isActive && (
                      <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" />
                    )}
                    
                    <Icon className={cn(
                      'w-5 h-5 min-w-[20px] transition-colors',
                      isActive ? 'text-blue-500' : 'group-hover:text-white'
                    )} />
                    
                    {!isMinimized && (
                      <span className="text-[14px] truncate">{item.label}</span>
                    )}

                    {/* Tooltip for Minimized State */}
                    {isMinimized && (
                      <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all origin-left bg-slate-800 text-white text-xs py-1.5 px-3 rounded shadow-xl border border-slate-700 whitespace-nowrap z-[60]">
                        {item.label}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 mt-auto">
        <div className={cn(
          "bg-slate-800/40 rounded-xl p-2 border border-slate-800",
          isMinimized ? "flex justify-center" : ""
        )}>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all rounded-lg py-2",
              isMinimized ? "px-2 justify-center" : "px-3 w-full"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!isMinimized && <span className="text-sm font-medium">Keluar</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}
