'use client'

import { useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
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
    // Durante build/SSR, las variables pueden no estar disponibles
    // Usamos valores por defecto para evitar errores en build time
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

    return createBrowserClient(url, anonKey)
  }, [])

  return supabase
}
