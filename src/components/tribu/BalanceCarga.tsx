'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Users, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react'

interface BalanceCargaProps {
    teamId: string
}

interface MiembroCarga {
    userId: string
    nombre: string
    tareasActivas: number
    puntosEstimados: number
}

export default function BalanceCarga({ teamId }: BalanceCargaProps) {
    const [miembrosCarga, setMiembrosCarga] = useState<MiembroCarga[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        async function cargarBalance() {
            try {
                setLoading(true)
                setError(null)

                // 1. Obtener miembros del equipo
                const { data: membersData, error: membersError } = await supabase
                    .from('team_members')
                    .select(`
                        user_id,
                        users:user_id (
                            user_id,
                            nombre
                        )
                    `)
                    .eq('team_id', teamId)
                    .eq('activo', true)

                if (membersError) throw membersError

                if (!membersData || membersData.length === 0) {
                    setMiembrosCarga([])
                    setLoading(false)
                    return
                }

                // Extraer IDs de miembros
                const miembrosIds = membersData
                    .map((m: any) => m.users?.user_id)
                    .filter(Boolean)

                if (miembrosIds.length === 0) {
                    setMiembrosCarga([])
                    setLoading(false)
                    return
                }

                // 2. Obtener tareas activas de los miembros
                const { data: tareasData, error: tareasError } = await supabase
                    .from('tarea')
                    .select('responsable_usuario_id, estado, puntos_estimados')
                    .in('responsable_usuario_id', miembrosIds)
                    .in('estado', ['pendiente', 'en_curso', 'en_validacion'])

                if (tareasError) throw tareasError

                // 3. Calcular carga por miembro
                const cargaPorMiembro: MiembroCarga[] = membersData.map((m: any) => {
                    const userId = m.users?.user_id
                    const tareasUsuario = (tareasData || []).filter(
                        (t: any) => t.responsable_usuario_id === userId
                    )

                    const puntosEstimados = tareasUsuario.reduce(
                        (sum, t: any) => sum + (t.puntos_estimados || 0),
                        0
                    )

                    return {
                        userId,
                        nombre: m.users?.nombre || 'Sin nombre',
                        tareasActivas: tareasUsuario.length,
                        puntosEstimados
                    }
                })

                // Ordenar por tareas activas (descendente)
                cargaPorMiembro.sort((a, b) => b.tareasActivas - a.tareasActivas)

                setMiembrosCarga(cargaPorMiembro)
            } catch (err: any) {
                console.error('Error al cargar balance de carga:', err)
                setError(err.message || 'Error al cargar balance de carga')
            } finally {
                setLoading(false)
            }
        }

        cargarBalance()
    }, [teamId])

    // Calcular promedio y máximo
    const promedio = useMemo(() => {
        if (miembrosCarga.length === 0) return 0
        const total = miembrosCarga.reduce((sum, m) => sum + m.tareasActivas, 0)
        return total / miembrosCarga.length
    }, [miembrosCarga])

    const maximo = useMemo(() => {
        if (miembrosCarga.length === 0) return 0
        return Math.max(...miembrosCarga.map(m => m.tareasActivas))
    }, [miembrosCarga])

    // Detectar desbalance (>30% más que promedio)
    const hayDesbalance = useMemo(() => {
        return miembrosCarga.some(m => m.tareasActivas > promedio * 1.3)
    }, [miembrosCarga, promedio])

    const sobrecargados = useMemo(() => {
        return miembrosCarga.filter(m => m.tareasActivas > promedio * 1.3)
    }, [miembrosCarga, promedio])

    const subcargados = useMemo(() => {
        return miembrosCarga.filter(m => m.tareasActivas < promedio * 0.7 && promedio > 0)
    }, [miembrosCarga, promedio])

    // Función para determinar color de barra
    const getColorClass = (tareas: number): string => {
        if (tareas > promedio * 1.3) return 'bg-red-500' // Sobrecarga
        if (tareas > promedio * 1.1) return 'bg-yellow-500' // Alto
        return 'bg-green-500' // Normal
    }

    const getColorTextClass = (tareas: number): string => {
        if (tareas > promedio * 1.3) return 'text-red-600' // Sobrecarga
        if (tareas > promedio * 1.1) return 'text-yellow-600' // Alto
        return 'text-green-600' // Normal
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-slate-600" size={20} />
                    <p className="text-slate-700">Cargando balance de carga...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle size={20} />
                    <p className="font-medium">Error: {error}</p>
                </div>
            </div>
        )
    }

    if (miembrosCarga.length === 0) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                <Users className="mx-auto mb-2 text-slate-400" size={32} />
                <p className="text-sm text-slate-700">No hay miembros en este equipo</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header con estadísticas */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                        <TrendingUp size={16} />
                        Balance de Carga
                    </h3>
                    <div className="text-right">
                        <p className="text-xs text-slate-500">Promedio</p>
                        <p className="text-lg font-bold text-slate-800">{promedio.toFixed(1)} tareas</p>
                    </div>
                </div>

                {/* Barras de carga por miembro */}
                <div className="space-y-3">
                    {miembrosCarga.map((miembro) => (
                        <div key={miembro.userId}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-slate-700">{miembro.nombre}</span>
                                <span className={`text-sm font-bold ${getColorTextClass(miembro.tareasActivas)}`}>
                                    {miembro.tareasActivas} tareas
                                    {miembro.puntosEstimados > 0 && (
                                        <span className="text-xs text-slate-500 ml-2">({miembro.puntosEstimados} pts)</span>
                                    )}
                                </span>
                            </div>
                            <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${getColorClass(miembro.tareasActivas)}`}
                                    style={{ width: maximo > 0 ? `${(miembro.tareasActivas / maximo) * 100}%` : '0%' }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Leyenda de colores */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-slate-600">Normal</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span className="text-slate-600">Alto (&gt;10% promedio)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-slate-600">Sobrecarga (&gt;30% promedio)</span>
                    </div>
                </div>
            </div>

            {/* Alerta de desbalance y sugerencias */}
            {hayDesbalance && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                        <div className="flex-1">
                            <p className="font-medium text-amber-800 mb-2">
                                Desbalance de carga detectado
                            </p>
                            <p className="text-sm text-amber-700 mb-3">
                                {sobrecargados.length > 0 && (
                                    <>
                                        <strong>Sobrecargados:</strong> {sobrecargados.map(m => m.nombre).join(', ')}
                                        <br />
                                    </>
                                )}
                                {subcargados.length > 0 && (
                                    <>
                                        <strong>Con capacidad:</strong> {subcargados.map(m => m.nombre).join(', ')}
                                    </>
                                )}
                            </p>
                            <div className="bg-white border border-amber-300 rounded p-3">
                                <p className="text-xs font-bold text-amber-900 uppercase mb-1">Sugerencia de redistribución</p>
                                <p className="text-sm text-amber-800">
                                    Considera reasignar algunas tareas de los miembros sobrecargados a aquellos con menor carga
                                    para equilibrar el trabajo del equipo y mejorar la productividad.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
