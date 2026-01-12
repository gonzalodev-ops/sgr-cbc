'use client'

import { useMemo } from 'react'
import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'
import { getPublicEnv } from '../env'

// Type para el cliente de Supabase
export type TypedSupabaseClient = SupabaseClient

/**
 * Hook personalizado para obtener el cliente de Supabase en el lado del cliente
 *
 * @returns Cliente de Supabase con variables de entorno validadas
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const supabase = useSupabase()
 *
 *   useEffect(() => {
 *     async function loadData() {
 *       const { data } = await supabase.from('users').select('*')
 *     }
 *     loadData()
 *   }, [supabase])
 * }
 * ```
 */
export function useSupabase(): TypedSupabaseClient {
  const supabase = useMemo(() => {
    const env = getPublicEnv()

    return createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }, [])

  return supabase
}
