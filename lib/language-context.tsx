'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, TranslationKey, getTranslation } from './translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ 
  children, 
  defaultLanguage = 'en' 
}: { 
  children: ReactNode
  defaultLanguage?: Language
}) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage)

  useEffect(() => {
    // Load language from localStorage or use default
    const savedLang = localStorage.getItem('language') as Language
    if (savedLang && (savedLang === 'en' || savedLang === 'id')) {
      setLanguageState(savedLang)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: TranslationKey) => getTranslation(language, key)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
