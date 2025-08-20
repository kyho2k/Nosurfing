"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface AuthContextType {
  supabase: SupabaseClient | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  supabase: null,
  isLoading: true,
  error: null,
  isAuthenticated: false
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!url || !key) {
          console.warn('Supabase environment variables not configured')
          if (isMounted) {
            setError('Supabase not configured')
            setIsAuthenticated(false)
            setIsLoading(false)
          }
          return null
        }

        const client = createClient(url, key)
        if (isMounted) {
          setSupabase(client)
        }

        // 익명 로그인 시도하되, 실패해도 계속 진행
        try {
          const { data: { session } } = await client.auth.getSession()
          
          if (!session) {
            // 최대 3회 재시도
            let signInSuccess = false
            for (let attempt = 1; attempt <= 3; attempt++) {
              console.log(`Anonymous sign-in attempt ${attempt}/3`)
              const { error: signInError } = await client.auth.signInAnonymously()
              
              if (!signInError) {
                console.log('Anonymous session created successfully')
                signInSuccess = true
                break
              } else {
                console.warn(`Attempt ${attempt} failed:`, signInError.message)
                if (attempt < 3) {
                  await new Promise(resolve => setTimeout(resolve, 1000)) // 1초 대기
                }
              }
            }
            
            if (isMounted) {
              setIsAuthenticated(signInSuccess)
              setIsLoading(false)
            }
          } else {
            console.log('Existing session found')
            if (isMounted) {
              setIsAuthenticated(true)
              setIsLoading(false)
            }
          }
        } catch (authError) {
          console.warn('Auth error, continuing in read-only mode:', authError)
          if (isMounted) {
            setIsAuthenticated(false)
            setIsLoading(false)
          }
        }
        
        return client
      } catch (err) {
        console.error('Failed to initialize auth:', err)
        if (isMounted) {
          setError('Failed to initialize authentication')
          setIsAuthenticated(false)
          setIsLoading(false)
        }
        return null
      }
    }

    // 2초 타이머로 강제 완료 보장
    const fallbackTimer = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn('AuthProvider timeout, forcing completion')
        setIsLoading(false)
        setIsAuthenticated(false)
      }
    }, 2000)

    initializeAuth().finally(() => {
      clearTimeout(fallbackTimer)
    })

    return () => {
      isMounted = false
      clearTimeout(fallbackTimer)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ supabase, isLoading, error, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}