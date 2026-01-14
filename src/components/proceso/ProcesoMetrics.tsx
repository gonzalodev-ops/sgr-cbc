'use client'

import { CheckCircle, Clock, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface ProcesoMetricsData {
    totalTareas: number
    completadas: number
    pctCompletadas: number
    pctATiempo: number
    puntos: number
    // Comparativa mes anterior
    deltaTareas: number
    deltaCompletadas: number
    deltaPctCompletadas: number
    deltaPuntos: number
}

interface ProcesoMetricsProps {
    metrics: ProcesoMetricsData
    loading?: boolean
}

function DeltaBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
    if (value === 0) {
        return (
            <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                <Minus size={12} /> Sin cambios
            </span>
        )
    }

    const isPositive = value > 0
    const Icon = isPositive ? TrendingUp : TrendingDown
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600'
    const bgClass = isPositive ? 'bg-green-50' : 'bg-red-50'
    const borderClass = isPositive ? 'border-green-200' : 'border-red-200'

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-bold ${colorClass} ${bgClass} ${borderClass}`}>
            <Icon size={12} /> {isPositive ? '+' : ''}{value}{suffix}
        </span>
    )
}

export function ProcesoMetrics({ metrics, loading }: ProcesoMetricsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-20 mb-4"></div>
                        <div className="h-8 bg-slate-300 rounded w-16 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-24"></div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Tareas */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
                        <Clock size={20} />
                    </div>
                    <DeltaBadge value={metrics.deltaTareas} />
                </div>
                <p className="text-3xl font-bold text-slate-800 mb-1">
                    {metrics.totalTareas}
                </p>
                <p className="text-xs text-slate-500 uppercase font-bold">Total Tareas</p>
            </div>

            {/* Completadas */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <CheckCircle size={20} />
                    </div>
                    <DeltaBadge value={metrics.deltaCompletadas} />
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-3xl font-bold text-green-600">
                        {metrics.completadas}
                    </p>
                    <p className="text-lg font-semibold text-slate-400">
                        / {metrics.totalTareas}
                    </p>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 uppercase font-bold">Completadas</p>
                    <span className={`text-xs font-bold ${
                        metrics.pctCompletadas >= 90 ? 'text-green-600' :
                        metrics.pctCompletadas >= 70 ? 'text-yellow-600' :
                        'text-slate-500'
                    }`}>
                        {metrics.pctCompletadas.toFixed(0)}%
                    </span>
                </div>
                {/* Barra de progreso */}
                <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${metrics.pctCompletadas}%` }}
                    />
                </div>
            </div>

            {/* % A Tiempo */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                        <Target size={20} />
                    </div>
                    <DeltaBadge value={metrics.deltaPctCompletadas} suffix="%" />
                </div>
                <p className={`text-3xl font-bold mb-1 ${
                    metrics.pctATiempo >= 90 ? 'text-green-600' :
                    metrics.pctATiempo >= 70 ? 'text-yellow-600' :
                    'text-red-600'
                }`}>
                    {metrics.pctATiempo.toFixed(0)}%
                </p>
                <p className="text-xs text-slate-500 uppercase font-bold">A Tiempo</p>
            </div>

            {/* Puntos */}
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-6 shadow-sm border border-teal-400 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white/20 text-white rounded-lg">
                        <TrendingUp size={20} />
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-bold ${
                        metrics.deltaPuntos > 0 ? 'text-white bg-white/20 border-white/40' :
                        metrics.deltaPuntos < 0 ? 'text-white bg-red-500/50 border-red-300' :
                        'text-white bg-white/10 border-white/20'
                    }`}>
                        {metrics.deltaPuntos > 0 ? <TrendingUp size={12} /> :
                         metrics.deltaPuntos < 0 ? <TrendingDown size={12} /> :
                         <Minus size={12} />}
                        {metrics.deltaPuntos > 0 ? '+' : ''}{metrics.deltaPuntos}
                    </span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                    {metrics.puntos}
                </p>
                <p className="text-xs text-teal-100 uppercase font-bold">Puntos del Mes</p>
            </div>
        </div>
    )
}
