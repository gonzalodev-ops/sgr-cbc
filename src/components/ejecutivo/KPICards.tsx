'use client'

import { TrendingUp, CheckCircle2, Target, AlertTriangle } from 'lucide-react'

interface KPICardsProps {
    totalTareas: number
    porcentajeCumplimiento: number
    puntosGenerados: number
    tareasVencidas: number
}

export function KPICards({
    totalTareas,
    porcentajeCumplimiento,
    puntosGenerados,
    tareasVencidas
}: KPICardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Tareas del Mes */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Tareas del Mes</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">{totalTareas}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                        <Target className="text-blue-600" size={24} />
                    </div>
                </div>
            </div>

            {/* % Cumplimiento */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Cumplimiento</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            {porcentajeCumplimiento.toFixed(1)}%
                        </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                        <CheckCircle2 className="text-green-600" size={24} />
                    </div>
                </div>
                <div className="mt-3 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-green-600 h-full transition-all duration-500"
                        style={{ width: `${Math.min(100, porcentajeCumplimiento)}%` }}
                    />
                </div>
            </div>

            {/* Puntos Generados */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Puntos del Mes</p>
                        <p className="text-3xl font-bold text-purple-600 mt-2">{puntosGenerados}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                        <TrendingUp className="text-purple-600" size={24} />
                    </div>
                </div>
            </div>

            {/* Tareas Vencidas */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Tareas Vencidas</p>
                        <p className={`text-3xl font-bold mt-2 ${tareasVencidas > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                            {tareasVencidas}
                        </p>
                    </div>
                    <div className={`p-3 rounded-lg ${tareasVencidas > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
                        <AlertTriangle className={tareasVencidas > 0 ? 'text-red-600' : 'text-slate-400'} size={24} />
                    </div>
                </div>
            </div>
        </div>
    )
}
