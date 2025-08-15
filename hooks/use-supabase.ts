'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export function useSupabase() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initSupabase = () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!url || !key) {
          console.warn('Supabase environment variables not configured')
          setError('Supabase not configured')
          setIsLoading(false)
          return
        }

        const client = createClient(url, key)
        setSupabase(client)
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to initialize Supabase:', err)
        setError('Failed to initialize Supabase')
        setIsLoading(false)
      }
    }

    initSupabase()
  }, [])

  return { supabase, isLoading, error }
}
