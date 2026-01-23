'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    Building2,
    FileCheck,
    Calendar,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Shield,
    BarChart3,
    Workflow,
    CalendarDays,
    UserCheck,
    AlertTriangle,
    UsersRound,
    ClipboardCheck,
    TrendingUp,
    type LucideIcon
} from 'lucide-react'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useUserRole, UserRole } from '@/lib/hooks/useUserRole'

// Define navigation item type
interface NavItem {
    name: string
    href: string
    icon: LucideIcon
    roles: UserRole[] // Which roles can see this item
}

// Navigation items with role restrictions
// Role definitions:
// - COLABORADOR: Mi Dia (home), Mi Agenda, Calendario, Mis Clientes
// - LIDER: Mi Equipo (home), Mi Dia, Validaciones, Seguimientos, Calendario, Clientes, Alertas
// - AUDITOR: Auditorias (home), TMR, Clientes, Calendario
// - SOCIO: TMR (home), Ejecutivo, Seguimientos Global, Analisis, Clientes, Colaboradores, Equipos, Configuracion
// - ADMIN: All items including Configuracion
const allNavigation: NavItem[] = [
    // TMR - Main dashboard for SOCIO, ADMIN, AUDITOR
    {
        name: 'TMR',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['SOCIO', 'ADMIN', 'AUDITOR']
    },
    // TMR 2.0 - Centro de Control for SOCIO, ADMIN
    {
        name: 'TMR 2.0',
        href: '/dashboard/tmr',
        icon: TrendingUp,
        roles: ['SOCIO', 'ADMIN']
    },
    // Mi Dia - Personal task view for COLABORADOR, LIDER
    {
        name: 'Mi Dia',
        href: '/dashboard/mi-dia',
        icon: CalendarDays,
        roles: ['COLABORADOR', 'LIDER', 'SOCIO', 'ADMIN']
    },
    // Mi Equipo - Team management for LIDER
    {
        name: 'Mi Equipo',
        href: '/dashboard/equipo',
        icon: UsersRound,
        roles: ['LIDER', 'SOCIO', 'ADMIN']
    },
    // Ejecutivo - Executive overview for SOCIO, ADMIN
    {
        name: 'Ejecutivo',
        href: '/dashboard/ejecutivo',
        icon: BarChart3,
        roles: ['SOCIO', 'ADMIN']
    },
    // Validaciones - For LIDER to validate work
    {
        name: 'Validaciones',
        href: '/dashboard/validaciones',
        icon: ClipboardCheck,
        roles: ['LIDER', 'SOCIO', 'ADMIN']
    },
    // Seguimientos - Tracking for LIDER
    {
        name: 'Seguimientos',
        href: '/dashboard/seguimientos',
        icon: TrendingUp,
        roles: ['LIDER']
    },
    // Seguimientos Global - Global view for SOCIO and ADMIN (read-only)
    {
        name: 'Seguimientos',
        href: '/dashboard/seguimientos-global',
        icon: TrendingUp,
        roles: ['SOCIO', 'ADMIN']
    },
    // Auditorias - Audit view for AUDITOR
    {
        name: 'Auditorias',
        href: '/dashboard/auditor',
        icon: Shield,
        roles: ['AUDITOR', 'SOCIO', 'ADMIN']
    },
    // Calendario - Calendar view
    {
        name: 'Calendario',
        href: '/dashboard/calendario',
        icon: Calendar,
        roles: ['COLABORADOR', 'LIDER', 'AUDITOR', 'SOCIO', 'ADMIN']
    },
    // Clientes - Client management
    {
        name: 'Clientes',
        href: '/dashboard/cliente',
        icon: Building2,
        roles: ['COLABORADOR', 'LIDER', 'AUDITOR', 'SOCIO', 'ADMIN']
    },
    // Colaboradores - Staff management
    {
        name: 'Colaboradores',
        href: '/dashboard/colaborador',
        icon: Users,
        roles: ['SOCIO', 'ADMIN']
    },
    // Tribus/Equipos - Team structure
    {
        name: 'Equipos',
        href: '/dashboard/tribu',
        icon: UsersRound,
        roles: ['SOCIO', 'ADMIN']
    },
    // Entregables - Deliverables
    {
        name: 'Entregables',
        href: '/dashboard/entregables',
        icon: FileCheck,
        roles: ['ADMIN']
    },
    // Alertas - Alerts for LIDER
    {
        name: 'Alertas',
        href: '/dashboard/alertas',
        icon: AlertTriangle,
        roles: ['LIDER', 'SOCIO', 'ADMIN']
    },
    // Analisis - Analytics
    {
        name: 'Analisis',
        href: '/dashboard/analisis',
        icon: BarChart3,
        roles: ['SOCIO', 'ADMIN']
    },
    // Procesos - Process management
    {
        name: 'Procesos',
        href: '/dashboard/proceso',
        icon: Workflow,
        roles: ['ADMIN']
    },
]

// Bottom navigation with role restrictions
const bottomNavigation: NavItem[] = [
    {
        name: 'Configuracion',
        href: '/dashboard/configuracion',
        icon: Settings,
        roles: ['SOCIO', 'ADMIN']
    },
]

// Get home route based on role
function getHomeRoute(rol: UserRole): string {
    switch (rol) {
        case 'COLABORADOR':
            return '/dashboard/mi-dia'
        case 'LIDER':
            return '/dashboard/equipo'
        case 'AUDITOR':
            return '/dashboard/auditor'
        case 'SOCIO':
        case 'ADMIN':
        default:
            return '/dashboard'
    }
}

// Filter navigation items based on user role
function filterNavigation(items: NavItem[], rol: UserRole): NavItem[] {
    if (!rol) return []
    return items.filter(item => item.roles.includes(rol))
}

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    // Get user role
    const { rol, isLoading, userName } = useUserRole()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Filter navigation based on role
    const filteredNavigation = filterNavigation(allNavigation, rol)
    const filteredBottomNav = filterNavigation(bottomNavigation, rol)

    async function handleLogout() {
        setLoggingOut(true)
        try {
            await supabase.auth.signOut({ scope: 'global' })
            // Forzar limpieza de cookies manualmente si es necesario
            document.cookie.split(";").forEach((c) => {
                if (c.includes('supabase') || c.includes('sb-')) {
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
                }
            })
        } catch (error) {
            console.error('Error al cerrar sesion:', error)
        }
        // Redirigir y forzar recarga completa
        window.location.href = '/login'
    }

    // Role badge colors - Using brand colors
    const roleBadgeColors: Record<string, string> = {
        ADMIN: 'bg-[#34588C]',
        SOCIO: 'bg-[#34588C]',
        LIDER: 'bg-[#F19F53]',
        AUDITOR: 'bg-[#4A6FA3]',
        COLABORADOR: 'bg-slate-600',
    }

    return (
        <div className={`flex flex-col h-full bg-[#1e293b] text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
                {!collapsed ? (
                    <Link href={getHomeRoute(rol)} className="flex items-center">
                        <Image
                            src="/cb-logo-flat.svg"
                            alt="Calderón & Berges"
                            width={140}
                            height={40}
                            className="brightness-0 invert"
                            priority
                        />
                    </Link>
                ) : (
                    <Link href={getHomeRoute(rol)} className="flex items-center justify-center w-full">
                        <span className="text-xl font-bold text-[#F19F53]">CB</span>
                    </Link>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                    aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
                    aria-expanded={!collapsed}
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* User Info */}
            {!collapsed && !isLoading && rol && (
                <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-sm text-slate-300 truncate" title={userName || undefined}>
                        {userName || 'Usuario'}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded ${roleBadgeColors[rol] || 'bg-slate-600'}`}>
                        {rol}
                    </span>
                </div>
            )}

            {/* Main Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {isLoading ? (
                    // Loading skeleton
                    <div className="space-y-2 px-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-10 bg-slate-800 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    filteredNavigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                ${isActive
                                        ? 'bg-[#F19F53] text-white shadow-lg shadow-[#F19F53]/30'
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                title={collapsed ? item.name : undefined}
                            >
                                <item.icon size={20} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                                {!collapsed && <span className="font-medium">{item.name}</span>}
                            </Link>
                        )
                    })
                )}
            </nav>

            {/* Bottom Navigation */}
            <div className="px-2 py-4 border-t border-slate-700 space-y-1">
                {!isLoading && filteredBottomNav.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                ${isActive
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                            title={collapsed ? item.name : undefined}
                        >
                            <item.icon size={20} />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    )
                })}

                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-colors ${loggingOut ? 'text-slate-500 cursor-not-allowed' : 'text-slate-400 hover:bg-red-600/20 hover:text-red-400'}`}
                    title={collapsed ? 'Cerrar sesion' : undefined}
                >
                    <LogOut size={20} className={loggingOut ? 'animate-spin' : ''} />
                    {!collapsed && <span>{loggingOut ? 'Cerrando...' : 'Cerrar sesion'}</span>}
                </button>
            </div>
        </div>
    )
}
