'use client'

import { Bell, Search, User } from 'lucide-react'

interface HeaderProps {
    title?: string
}

export function Header({ title = 'TMR' }: HeaderProps) {
    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
            {/* Left: Title */}
            <div>
                <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all w-64"
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <Bell size={20} className="text-slate-600" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </button>

                {/* User Menu */}
                <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        U
                    </div>
                    <span className="hidden md:block text-sm font-medium text-slate-700">Usuario</span>
                </button>
            </div>
        </header>
    )
}
