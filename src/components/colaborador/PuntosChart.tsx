'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Trophy, TrendingUp, TrendingDown, Calendar, Briefcase, User } from 'lucide-react'

interface PuntosChartProps {
    usuarioId: string
}

interface TareaCompletada {
    tarea_id: string
    updated_at: string
    cliente_id: string
    id_obligacion: string
    puntos: number
    cliente?: {
        nombre_comercial: string
    }
    obligacion?: {
        nombre_corto: string
        obligacion_proceso?: Array<{
            proceso?: {
                nombre_proceso: string
            }
        }>
    }
}

interface DesgloseProceso {
    proceso: string
    puntos: number
}

interface DesgloseCliente {
    cliente: string
    puntos: number
}

export default function PuntosChart({ usuarioId }: PuntosChartProps) {
    const [tareasCompletadas, setTareasCompletadas] = useState<TareaCompletada[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        async function fetchPuntos() {
            setLoading(true)

            // Obtener todas las tareas completadas del usuario del año actual
            const inicioAnio = new Date(new Date().getFullYear(), 0, 1).toISOString()

            const { data, error } = await supabase
                .from('tarea')
                .select(`
                    tarea_id,
                    updated_at,
                    cliente_id,
                    id_obligacion,
                    cliente:cliente_id (
                        nombre_comercial
                    ),
                    obligacion:id_obligacion (
                        nombre_corto,
                        obligacion_proceso (
                            proceso:proceso_id (
                                nombre_proceso
                            )
                        )
                    )
                `)
                .eq('responsable_usuario_id', usuarioId)
                .eq('estado', 'cerrado')
                .gte('updated_at', inicioAnio)

            if (error) {
                console.error('Error fetching puntos:', error)
                setLoading(false)
                return
            }

            // Asignar puntos por tarea (50 puntos por tarea completada)
            const tareasConPuntos = (data || []).map((t: any) => ({
                ...t,
                puntos: 50
            }))

            setTareasCompletadas(tareasConPuntos)
            setLoading(false)
        }

        fetchPuntos()
    }, [usuarioId])

    // Calcular puntos por período
    const puntosStats = useMemo(() => {
        const now = new Date()
        const inicioMesActual = new Date(now.getFullYear(), now.getMonth(), 1)
        const inicioMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const finMesAnterior = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

        const puntosMesActual = tareasCompletadas
            .filter(t => new Date(t.updated_at) >= inicioMesActual)
            .reduce((sum, t) => sum + t.puntos, 0)

        const puntosMesAnterior = tareasCompletadas
            .filter(t => {
                const fecha = new Date(t.updated_at)
                return fecha >= inicioMesAnterior && fecha <= finMesAnterior
            })
            .reduce((sum, t) => sum + t.puntos, 0)

        const puntosAnio = tareasCompletadas.reduce((sum, t) => sum + t.puntos, 0)

        const cambioMensual = puntosMesAnterior > 0
            ? ((puntosMesActual - puntosMesAnterior) / puntosMesAnterior) * 100
            : puntosMesActual > 0 ? 100 : 0

        return {
            mesActual: puntosMesActual,
            mesAnterior: puntosMesAnterior,
            cambioMensual,
            anio: puntosAnio
        }
    }, [tareasCompletadas])

    // Desglose por proceso
    const desgloseProceso = useMemo<DesgloseProceso[]>(() => {
        const procesoMap = new Map<string, number>()

        tareasCompletadas.forEach(t => {
            const obligacion = t.obligacion as any
            if (obligacion?.obligacion_proceso) {
                const procesos = Array.isArray(obligacion.obligacion_proceso)
                    ? obligacion.obligacion_proceso
                    : [obligacion.obligacion_proceso]

                procesos.forEach((op: any) => {
                    const nombreProceso = op?.proceso?.nombre_proceso || 'Sin proceso'
                    procesoMap.set(
                        nombreProceso,
                        (procesoMap.get(nombreProceso) || 0) + t.puntos
                    )
                })
            } else {
                procesoMap.set('Sin proceso', (procesoMap.get('Sin proceso') || 0) + t.puntos)
            }
        })

        return Array.from(procesoMap.entries())
            .map(([proceso, puntos]) => ({ proceso, puntos }))
            .sort((a, b) => b.puntos - a.puntos)
    }, [tareasCompletadas])

    // Desglose por cliente
    const desgloseCliente = useMemo<DesgloseCliente[]>(() => {
        const clienteMap = new Map<string, number>()

        tareasCompletadas.forEach(t => {
            const cliente = (t.cliente as any)?.nombre_comercial || 'Sin cliente'
            clienteMap.set(cliente, (clienteMap.get(cliente) || 0) + t.puntos)
        })

        return Array.from(clienteMap.entries())
            .map(([cliente, puntos]) => ({ cliente, puntos }))
            .sort((a, b) => b.puntos - a.puntos)
    }, [tareasCompletadas])

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-center gap-3 py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600">Cargando puntos...</p>
                </div>
            </div>
        )
    }

    const maxPuntosProceso = Math.max(...desgloseProceso.map(p => p.puntos), 1)
    const maxPuntosCliente = Math.max(...desgloseCliente.map(c => c.puntos), 1)

    return (
        <div className="space-y-6">
            {/* Resumen de puntos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Puntos del mes actual */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Calendar size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Mes Actual</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{puntosStats.mesActual}</p>
                    <p className="text-xs text-slate-500 mt-1">puntos</p>
                </div>

                {/* Comparativa con mes anterior */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${puntosStats.cambioMensual >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {puntosStats.cambioMensual >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Mes Anterior</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-slate-700">{puntosStats.mesAnterior}</p>
                        <p className={`text-sm font-bold ${puntosStats.cambioMensual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {puntosStats.cambioMensual >= 0 ? '+' : ''}{puntosStats.cambioMensual.toFixed(0)}%
                        </p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">cambio mensual</p>
                </div>

                {/* Total del año */}
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 shadow-sm text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Trophy size={20} />
                        </div>
                        <p className="text-xs font-bold uppercase opacity-90">Total del Año</p>
                    </div>
                    <p className="text-3xl font-bold">{puntosStats.anio}</p>
                    <p className="text-xs opacity-90 mt-1">puntos acumulados</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Desglose por proceso */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Briefcase className="text-purple-600" size={20} />
                        <h3 className="text-lg font-bold text-slate-800">Por Proceso</h3>
                    </div>

                    {desgloseProceso.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <p className="text-sm">No hay datos disponibles</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {desgloseProceso.slice(0, 10).map((item, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-slate-700 truncate">{item.proceso}</span>
                                        <span className="text-sm font-bold text-purple-600 ml-2">{item.puntos}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                                            style={{ width: `${(item.puntos / maxPuntosProceso) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Desglose por cliente */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="text-green-600" size={20} />
                        <h3 className="text-lg font-bold text-slate-800">Por Cliente</h3>
                    </div>

                    {desgloseCliente.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <p className="text-sm">No hay datos disponibles</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {desgloseCliente.slice(0, 10).map((item, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-slate-700 truncate">{item.cliente}</span>
                                        <span className="text-sm font-bold text-green-600 ml-2">{item.puntos}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                                            style={{ width: `${(item.puntos / maxPuntosCliente) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
