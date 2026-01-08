'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
    Shield
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
    { name: 'TMR', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Colaboradores', href: '/dashboard/colaborador', icon: Users },
    { name: 'Tribus', href: '/dashboard/tribu', icon: Building2 },
    { name: 'Clientes', href: '/dashboard/cliente', icon: Building2 },
    { name: 'Entregables', href: '/dashboard/entregables', icon: FileCheck },
    { name: 'Calendario', href: '/dashboard/calendario', icon: Calendar },
    { name: 'Auditor', href: '/dashboard/auditor', icon: Shield },
]

const bottomNavigation = [
    { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className={`flex flex-col h-full bg-slate-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
                {!collapsed && (
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        SGR CBC
                    </span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                            title={collapsed ? item.name : undefined}
                        >
                            <item.icon size={20} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                            {!collapsed && <span className="font-medium">{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Navigation */}
            <div className="px-2 py-4 border-t border-slate-700 space-y-1">
                {bottomNavigation.map((item) => {
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors"
                    title={collapsed ? 'Cerrar sesión' : undefined}
                >
                    <LogOut size={20} />
                    {!collapsed && <span>Cerrar sesión</span>}
                </button>
            </div>
        </div>
    )
}
