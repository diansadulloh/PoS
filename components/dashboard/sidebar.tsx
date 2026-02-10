'use client'

import React, { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isMinimized, setIsMinimized] = useState(false)
  const [openCategories, setOpenCategories] = useState<string[]>(['Main'])

  const sidebarItems = useMemo(() => [
    {
      category: 'Main',
      items: [
        { label: t('dashboard'), href: '/dashboard', icon: Home },
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
  ], [t])

  const toggleCategory = useCallback((category: string) => {
    if (isMinimized) return
    setOpenCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }, [isMinimized])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-[#0f172a] text-slate-300 border-r border-slate-800 transition-all duration-300 ease-in-out',
        isMinimized ? 'w-20' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shrink-0">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          {!isMinimized && (
            <span className="font-bold text-xl tracking-tight text-white uppercase truncate">
              POS Pro
            </span>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsMinimized(!isMinimized)}
        className="absolute -right-3 top-10 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-500 transition-transform"
      >
        <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', isMinimized && 'rotate-180')} />
      </button>

      {/* Nav Content */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-4 custom-scrollbar">
        {sidebarItems.map((group) => (
          <div key={group.category} className="space-y-1">
            {!isMinimized && (
              <button
                type="button"
                onClick={() => toggleCategory(group.category)}
                className="flex items-center justify-between w-full px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-[2px] hover:text-slate-300 transition-colors"
              >
                {group.category}
                <ChevronDown className={cn(
                  'w-3 h-3 transition-transform duration-200',
                  !openCategories.includes(group.category) && '-rotate-90'
                )} />
              </button>
            )}

            <AnimatePresence initial={false}>
              {(isMinimized || openCategories.includes(group.category)) && (
                <motion.div
                  initial={isMinimized ? { opacity: 1 } : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="space-y-1 overflow-hidden"
                >
                  {group.items.map((item) => (
                    <NavItem
                      key={item.href}
                      label={item.label}
                      href={item.href}
                      icon={item.icon}
                      isMinimized={isMinimized}
                      isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Footer Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all hover:bg-red-500/10 hover:text-red-400 group',
            isMinimized && 'justify-center px-0'
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isMinimized && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )
}

function NavItem({ label, href, icon: Icon, isMinimized, isActive }: any) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex items-center rounded-xl transition-all duration-200 py-2.5 mx-2',
        isMinimized ? 'justify-center px-0' : 'px-4 gap-3',
        isActive 
          ? 'bg-blue-600/15 text-blue-400 font-semibold' 
          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
      )}
    >
      {isActive && (
        <div className="absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full" />
      )}
      <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-blue-500' : 'group-hover:text-white')} />
      {!isMinimized && <span className="text-[14px] truncate">{label}</span>}
      
      {isMinimized && (
        <div className="absolute left-14 scale-0 group-hover:scale-100 transition-all bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-xl border border-slate-700 z-[100] whitespace-nowrap">
          {label}
        </div>
      )}
    </Link>
  )
}