'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { BarChart3, Calendar, Filter, TrendingDown } from 'lucide-react'
import TiemposPorPaso from '@/components/analisis/TiemposPorPaso'
import BacklogAnalysis from '@/components/analisis/BacklogAnalysis'

interface ProcesoOperativo {
    proceso_id: string
    nombre: string
}

export default function AnalisisPage() {
    const [procesos, setProcesos] = useState<ProcesoOperativo[]>([])
    const [procesoSeleccionado, setProcesoSeleccionado] = useState('')
    const [rangoDias, setRangoDias] = useState(30)
    const [loading, setLoading] = useState(true)
    const [tabActivo, setTabActivo] = useState<'tiempos' | 'backlog'>('tiempos')

    const supabase = useMemo(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), [])

    const cargarProcesos = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase
            .from('proceso_operativo')
            .select('proceso_id, nombre')
            .eq('activo', true)
            .order('nombre')

        if (data && data.length > 0) {
            setProcesos(data)
            setProcesoSeleccionado(data[0].proceso_id)
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        cargarProcesos()
    }, [cargarProcesos])

    // Calcular fechas basadas en el rango seleccionado (memoized to avoid hydration issues)
    const { fechaFin, fechaInicio } = useMemo(() => {
        const now = new Date()
        const fin = now.toISOString().split('T')[0]
        const inicio = new Date(now.getTime() - rangoDias * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]
        return { fechaFin: fin, fechaInicio: inicio }
    }, [rangoDias])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Análisis de Procesos</h1>
                        <p className="text-slate-500">Análisis de tiempos de ejecución por paso de proceso</p>
                    </div>
                </div>
            </div>

            {/* Tabs de navegación */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setTabActivo('tiempos')}
                        className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors relative ${
                            tabActivo === 'tiempos'
                                ? 'text-purple-600 bg-purple-50'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <BarChart3 size={18} />
                            Tiempos por Paso
                        </div>
                        {tabActivo === 'tiempos' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setTabActivo('backlog')}
                        className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors relative ${
                            tabActivo === 'backlog'
                                ? 'text-purple-600 bg-purple-50'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <TrendingDown size={18} />
                            Backlog
                        </div>
                        {tabActivo === 'backlog' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
                        )}
                    </button>
                </div>
            </div>

            {/* Contenido según tab activo */}
            {tabActivo === 'tiempos' ? (
                <>
                    {/* Filtros para Tiempos por Paso */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter size={20} className="text-slate-600" />
                            <h2 className="text-lg font-semibold text-slate-800">Filtros de Análisis</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Selector de Proceso */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Proceso Operativo
                                </label>
                                <div className="relative">
                                    <select
                                        value={procesoSeleccionado}
                                        onChange={(e) => setProcesoSeleccionado(e.target.value)}
                                        disabled={loading || procesos.length === 0}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed appearance-none bg-white"
                                    >
                                        {procesos.length === 0 ? (
                                            <option value="">No hay procesos disponibles</option>
                                        ) : (
                                            procesos.map((proceso) => (
                                                <option key={proceso.proceso_id} value={proceso.proceso_id}>
                                                    {proceso.nombre}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                {procesos.length === 0 && !loading && (
                                    <p className="mt-2 text-sm text-amber-600">
                                        No hay procesos operativos configurados. Ve a Configuración para crear uno.
                                    </p>
                                )}
                            </div>

                            {/* Selector de Rango de Fechas */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Rango de Fechas
                                </label>
                                <div className="relative">
                                    <select
                                        value={rangoDias}
                                        onChange={(e) => setRangoDias(Number(e.target.value))}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value={30}>Últimos 30 días</option>
                                        <option value={60}>Últimos 60 días</option>
                                        <option value={90}>Últimos 90 días</option>
                                        <option value={180}>Últimos 6 meses</option>
                                        <option value={365}>Último año</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                        <Calendar size={20} />
                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-slate-500">
                                    Desde: <span className="font-medium">{fechaInicio}</span> hasta: <span className="font-medium">{fechaFin}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Componente de Análisis de Tiempos */}
                    {procesoSeleccionado ? (
                        <TiemposPorPaso
                            procesoId={procesoSeleccionado}
                            fechaInicio={fechaInicio}
                            fechaFin={fechaFin}
                        />
                    ) : (
                        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 border-dashed">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BarChart3 className="text-slate-400" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">Selecciona un proceso</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2">
                                Elige un proceso operativo para analizar los tiempos de ejecución por paso.
                            </p>
                        </div>
                    )}
                </>
            ) : (
                /* Componente de Análisis de Backlog */
                <BacklogAnalysis />
            )}
        </div>
    )
}
