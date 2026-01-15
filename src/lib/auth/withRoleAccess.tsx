'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserRole, UserRole } from '@/lib/hooks/useUserRole'
import { ShieldAlert, Loader2 } from 'lucide-react'

interface WithRoleAccessOptions {
  redirectTo?: string
  showAccessDenied?: boolean
}

/**
 * Higher Order Component for role-based access control.
 * Wraps a component and only renders it if the user has one of the allowed roles.
 *
 * @param WrappedComponent - The component to wrap
 * @param allowedRoles - Array of roles that are allowed to access the component
 * @param options - Optional configuration (redirectTo, showAccessDenied)
 *
 * @example
 * // Only allow ADMIN and SOCIO to access this page
 * export default withRoleAccess(ConfigPage, ['ADMIN', 'SOCIO'])
 *
 * @example
 * // Redirect to custom page if unauthorized
 * export default withRoleAccess(AdminPage, ['ADMIN'], { redirectTo: '/dashboard' })
 */
export function withRoleAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: UserRole[],
  options: WithRoleAccessOptions = {}
): React.FC<P> {
  const { redirectTo = '/dashboard', showAccessDenied = true } = options

  const WithRoleAccessComponent: React.FC<P> = (props) => {
    const router = useRouter()
    const { rol, isLoading } = useUserRole()

    const hasAccess = rol !== null && allowedRoles.includes(rol)

    useEffect(() => {
      // Only redirect if not loading and user doesn't have access
      if (!isLoading && !hasAccess && !showAccessDenied) {
        router.replace(redirectTo)
      }
    }, [isLoading, hasAccess, router])

    // Show loading state while checking role
    if (isLoading) {
      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-600 font-medium">Verificando permisos...</p>
          </div>
        </div>
      )
    }

    // If user doesn't have access, show access denied or redirect
    if (!hasAccess) {
      if (showAccessDenied) {
        return <AccessDeniedPage allowedRoles={allowedRoles} redirectTo={redirectTo} />
      }
      // Will redirect via useEffect, show nothing in the meantime
      return null
    }

    // User has access, render the wrapped component
    return <WrappedComponent {...props} />
  }

  // Set display name for debugging
  WithRoleAccessComponent.displayName = `withRoleAccess(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`

  return WithRoleAccessComponent
}

/**
 * Access Denied page component
 */
interface AccessDeniedPageProps {
  allowedRoles: UserRole[]
  redirectTo: string
}

function AccessDeniedPage({ allowedRoles, redirectTo }: AccessDeniedPageProps) {
  const router = useRouter()
  const { rol } = useUserRole()

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    SOCIO: 'Socio',
    LIDER: 'Lider',
    AUDITOR: 'Auditor',
    COLABORADOR: 'Colaborador',
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Acceso Denegado
        </h1>

        <p className="text-slate-600 mb-4">
          No tienes permisos para acceder a esta seccion.
        </p>

        <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-slate-500 mb-2">
            <span className="font-semibold">Tu rol actual:</span>{' '}
            <span className="text-slate-700">{rol ? roleLabels[rol] || rol : 'No definido'}</span>
          </p>
          <p className="text-sm text-slate-500">
            <span className="font-semibold">Roles requeridos:</span>{' '}
            <span className="text-slate-700">
              {allowedRoles.filter(r => r !== null).map(r => roleLabels[r as string] || r).join(', ')}
            </span>
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            Volver
          </button>
          <button
            onClick={() => router.push(redirectTo)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Simple component wrapper for inline role checking
 */
interface RoleGateProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { rol, isLoading } = useUserRole()

  if (isLoading) {
    return null
  }

  const hasAccess = rol !== null && allowedRoles.includes(rol)

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default withRoleAccess
