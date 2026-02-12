'use client'

import React, { useState, useMemo } from 'react'
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
  LayoutDashboard,
  UtensilsCrossed,
  TrendingUp,
  ChevronLeft,
  ChevronDown,
  Receipt,
  History,
  Truck,
  Wallet,
  Database,
  UserCog,
  ClipboardList,
  Store,
  Calculator, // Ikon untuk Cash Register
  Boxes       // Ikon untuk Products
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'

// --- Types ---
interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface NavCategory {
  category: string
  items: NavItem[]
}

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isMinimized, setIsMinimized] = useState(false)
  
  const [openCategories, setOpenCategories] = useState<string[]>(['Main', 'Operations'])

  const sidebarItems: NavCategory[] = useMemo(() => [
    {
      category: 'Main',
      items: [
        { label: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { label: t('pos'), href: '/dashboard/pos', icon: ShoppingCart },
        { label: t('cashRegister'), href: '/dashboard/cash-register', icon: Calculator },
      ],
    },
    {
      category: 'Operations',
      items: [
        { label: t('products'), href: '/dashboard/products', icon: Boxes },
        { label: t('inventory'), href: '/dashboard/inventory', icon: Package },
        { label: t('suppliers'), href: '/dashboard/suppliers', icon: Truck },
        { label: t('restaurantTables'), href: '/dashboard/restaurant-tables', icon: UtensilsCrossed },
      ],
    },
    {
      category: 'Sales & Finance',
      items: [
        { label: t('sales'), href: '/dashboard/sales', icon: DollarSign },
        { label: t('invoices'), href: '/dashboard/invoices', icon: Receipt },
        { label: t('quotations'), href: '/dashboard/quotations', icon: FileText },
        { label: t('expenses'), href: '/dashboard/expenses', icon: Wallet },
      ],
    },
    {
      category: 'People',
      items: [
        { label: t('customers'), href: '/dashboard/customers', icon: Users },
        { label: t('staff'), href: '/dashboard/staff', icon: UserCog },
      ],
    },
    {
      category: 'System',
      items: [
        { label: t('reports'), href: '/dashboard/reports', icon: BarChart3 },
        { label: t('settings'), href: '/dashboard/settings', icon: Settings },
      ],
    },
  ], [t])

  const toggleCategory = (category: string) => {
    if (isMinimized) return
    setOpenCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-[#020617] border-r border-slate-800 transition-all duration-300 ease-in-out z-40',
        isMinimized ? 'w-[78px]' : 'w-72'
      )}
    >
      <button
        type="button"
        onClick={() => setIsMinimized(!isMinimized)}
        className="absolute -right-3 top-10 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition-transform hover:bg-blue-500 active:scale-95"
      >
        <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', isMinimized && 'rotate-180')} />
      </button>

      <div className="flex h-20 items-center px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-900/20">
            <Store className="h-6 w-6 text-white" />
          </div>
          {!isMinimized && (
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white leading-none">
                POS<span className="text-blue-500">PRO</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-tighter">Business Suite</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4 scrollbar-hide">
        {sidebarItems.map((group) => (
          <div key={group.category} className="space-y-1">
            {!isMinimized && (
              <button
                type="button"
                onClick={() => toggleCategory(group.category)}
                className="flex w-full items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
              >
                {group.category}
                <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', !openCategories.includes(group.category) && '-rotate-90')} />
              </button>
            )}

            <div className={cn(
              'space-y-1 transition-all duration-300 overflow-hidden',
              !isMinimized && !openCategories.includes(group.category) ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'
            )}>
              {group.items.map((item) => (
                <NavItemComponent
                  key={item.href}
                  item={item}
                  isMinimized={isMinimized}
                  isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4 shrink-0 bg-[#020617]">
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            'group flex items-center rounded-xl py-2.5 text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400',
            isMinimized ? 'justify-center px-0' : 'w-full px-4 gap-3'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isMinimized && <span className="text-sm font-medium">Logout</span>}
          
          {isMinimized && (
            <div className="absolute left-14 z-[70] ml-2 scale-0 whitespace-nowrap rounded bg-red-600 px-3 py-1.5 text-xs text-white shadow-xl transition-all group-hover:scale-100 origin-left">
              Logout
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}

function NavItemComponent({ 
  item, 
  isMinimized, 
  isActive 
}: { 
  item: NavItem, 
  isMinimized: boolean, 
  isActive: boolean 
}) {
  const Icon = item.icon
  
  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center rounded-xl py-2.5 transition-all duration-200',
        isMinimized ? 'justify-center px-0 mx-2' : 'px-4 gap-3 mx-2',
        isActive 
          ? 'bg-blue-600/15 text-blue-400 font-semibold shadow-sm shadow-blue-900/10' 
          : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'
      )}
    >
      {isActive && (
        <div className="absolute left-0 h-5 w-1 rounded-r-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
      )}
      
      <Icon className={cn(
        'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110', 
        isActive ? 'text-blue-500' : 'group-hover:text-slate-100'
      )} />
      
      {!isMinimized && <span className="text-[14px] truncate">{item.label}</span>}

      {isMinimized && (
        <div className="absolute left-14 z-[70] ml-2 scale-0 whitespace-nowrap rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white shadow-2xl transition-all group-hover:scale-100 origin-left">
          {item.label}
        </div>
      )}
    </Link>
  )
}
