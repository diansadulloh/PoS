'use client'

import { User } from '@supabase/supabase-js'
import { Bell, Clock, Languages } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface TopBarProps {
  user: User | null
}

export default function TopBar({ user }: TopBarProps) {
  const [currentTime, setCurrentTime] = useState<string>('')
  const { language, setLanguage } = useLanguage()
  const userEmail = user?.email || 'User'
  const userName = user?.user_metadata?.name || userEmail?.split('@')[0] || 'User'

  useEffect(() => {
    // Set initial time
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      )
    }
    
    updateTime()
    
    // Update every minute
    const interval = setInterval(updateTime, 60000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span className="text-sm">
          {currentTime || '\u00A0'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Languages className="w-4 h-4" />
              <span className="text-sm">{language === 'en' ? 'EN' : 'ID'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage('en')}>
              <span className="mr-2">🇺🇸</span>
              English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('id')}>
              <span className="mr-2">🇮🇩</span>
              Bahasa Indonesia
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
