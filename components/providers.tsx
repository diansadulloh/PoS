'use client'

import { ReactNode, useEffect } from 'react'
import { LanguageProvider } from '@/lib/language-context'
import PWAInstall from '@/components/pwa-install'

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Register service worker for PWA support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[v0] Service Worker registered:', registration)
        })
        .catch((error) => {
          console.log('[v0] Service Worker registration failed:', error)
        })
    }
  }, [])

  return (
    <LanguageProvider>
      {children}
      <PWAInstall />
    </LanguageProvider>
  )
}
