'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export type UserRole = 'COLABORADOR' | 'LIDER' | 'AUDITOR' | 'SOCIO' | 'ADMIN' | null

export interface UseUserRoleReturn {
  rol: UserRole
  isAdmin: boolean
  isSocio: boolean
  isLider: boolean
  isAuditor: boolean
  isColaborador: boolean
  canAccessConfig: boolean // ADMIN or SOCIO only
  canManageTeam: boolean // LIDER, SOCIO, ADMIN
  canAudit: boolean // AUDITOR, SOCIO, ADMIN
  isLoading: boolean
  userId: string | null
  userName: string | null
}

function getSupabaseClient() {
  if (typeof window === 'undefined') return null
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function useUserRole(): UseUserRoleReturn {
  const [rol, setRol] = useState<UserRole>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = useMemo(() => getSupabaseClient(), [])

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    async function fetchUserRole() {
      try {
        setIsLoading(true)

        // Get the authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          setRol(null)
          setUserId(null)
          setUserName(null)
          setIsLoading(false)
          return
        }

        setUserId(user.id)

        // Get user role from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('rol_global, nombre')
          .eq('user_id', user.id)
          .single()

        if (userError || !userData) {
          // If user not found in users table, default to COLABORADOR
          setRol('COLABORADOR')
          setUserName(user.email?.split('@')[0] || null)
        } else {
          setRol(userData.rol_global as UserRole)
          setUserName(userData.nombre)
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
        setRol(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserRole()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setRol(null)
          setUserId(null)
          setUserName(null)
        } else if (session?.user) {
          // Re-fetch role on sign in
          fetchUserRole()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Compute derived permissions
  const permissions = useMemo(() => ({
    isAdmin: rol === 'ADMIN',
    isSocio: rol === 'SOCIO',
    isLider: rol === 'LIDER',
    isAuditor: rol === 'AUDITOR',
    isColaborador: rol === 'COLABORADOR',
    canAccessConfig: rol === 'ADMIN' || rol === 'SOCIO',
    canManageTeam: rol === 'LIDER' || rol === 'SOCIO' || rol === 'ADMIN',
    canAudit: rol === 'AUDITOR' || rol === 'SOCIO' || rol === 'ADMIN',
  }), [rol])

  return {
    rol,
    userId,
    userName,
    isLoading,
    ...permissions,
  }
}

export default useUserRole
