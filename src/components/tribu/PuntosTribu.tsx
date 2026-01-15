'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Trophy, TrendingUp, TrendingDown, Users, Award, Medal } from 'lucide-react'

interface PuntosTribuProps {
    teamId: string
}

interface MiembroPuntos {
    userId: string
    nombre: string
    rol: string
    puntosMesActual: number
    puntosMesAnterior: number
    puntosAnio: number
}

interface TareaData {
    tarea_id: string
    responsable_usuario_id: string
    updated_at: string
    puntos: number
}

export default function PuntosTribu({ teamId }: PuntosTribuProps) {
    const [miembros, setMiembros] = useState<MiembroPuntos[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        async function fetchPuntosTribu() {
            setLoading(true)

            try {
                // 1. Obtener miembros del equipo
                const { data: membersData, error: membersError } = await supabase
                    .from('team_members')
                    .select(`
                        user_id,
                        rol_en_equipo,
                        users:user_id (
                            user_id,
                            nombre
                        )
                    `)
                    .eq('team_id', teamId)
                    .eq('activo', true)

                if (membersError) throw membersError

                if (!membersData || membersData.length === 0) {
                    setMiembros([])
                    setLoading(false)
                    return
                }

                // 2. Obtener todas las tareas cerradas del año actual
                const inicioAnio = new Date(new Date().getFullYear(), 0, 1).toISOString()

                const { data: tareasData, error: tareasError } = await supabase
                    .from('tarea')
                    .select('tarea_id, responsable_usuario_id, updated_at')
                    .eq('estado', 'cerrado')
                    .gte('updated_at', inicioAnio)

                if (tareasError) throw tareasError

                // Asignar puntos por tarea (50 puntos por tarea completada)
                const tareasConPuntos: TareaData[] = (tareasData || []).map((t: any) => ({
                    ...t,
                    puntos: 50
                }))

                // 3. Calcular períodos
                const now = new Date()
                const inicioMesActual = new Date(now.getFullYear(), now.getMonth(), 1)
                const inicioMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                const finMesAnterior = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

                // 4. Calcular puntos por miembro
                const miembrosConPuntos: MiembroPuntos[] = membersData.map((member: any) => {
                    const userId = member.users?.user_id || member.user_id
                    const tareasUsuario = tareasConPuntos.filter(t => t.responsable_usuario_id === userId)

                    const puntosMesActual = tareasUsuario
                        .filter(t => new Date(t.updated_at) >= inicioMesActual)
                        .reduce((sum, t) => sum + t.puntos, 0)

                    const puntosMesAnterior = tareasUsuario
                        .filter(t => {
                            const fecha = new Date(t.updated_at)
                            return fecha >= inicioMesAnterior && fecha <= finMesAnterior
                        })
                        .reduce((sum, t) => sum + t.puntos, 0)

                    const puntosAnio = tareasUsuario.reduce((sum, t) => sum + t.puntos, 0)

                    return {
                        userId,
                        nombre: member.users?.nombre || 'Sin nombre',
                        rol: member.rol_en_equipo || 'Miembro',
                        puntosMesActual,
                        puntosMesAnterior,
                        puntosAnio
                    }
                })

                // Ordenar por puntos del año (descendente)
                miembrosConPuntos.sort((a, b) => b.puntosAnio - a.puntosAnio)

                setMiembros(miembrosConPuntos)
            } catch (error) {
                console.error('Error fetching puntos tribu:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchPuntosTribu()
    }, [teamId])

    // Estadísticas del equipo
    const stats = useMemo(() => {
        const totalMesActual = miembros.reduce((sum, m) => sum + m.puntosMesActual, 0)
        const totalMesAnterior = miembros.reduce((sum, m) => sum + m.puntosMesAnterior, 0)
        const totalAnio = miembros.reduce((sum, m) => sum + m.puntosAnio, 0)

        const cambioMensual = totalMesAnterior > 0
            ? ((totalMesActual - totalMesAnterior) / totalMesAnterior) * 100
            : totalMesActual > 0 ? 100 : 0

        const promedioPorMiembro = miembros.length > 0
            ? Math.round(totalAnio / miembros.length)
            : 0

        return {
            totalMesActual,
            totalMesAnterior,
            totalAnio,
            cambioMensual,
            promedioPorMiembro
        }
    }, [miembros])

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-center gap-3 py-8">
                    <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600">Cargando puntos del equipo...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Resumen del equipo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total puntos del equipo */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 shadow-sm text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Trophy size={20} />
                        </div>
                        <p className="text-xs font-bold uppercase opacity-90">Total Equipo</p>
                    </div>
                    <p className="text-3xl font-bold">{stats.totalAnio}</p>
                    <p className="text-xs opacity-90 mt-1">puntos del año</p>
                </div>

                {/* Mes actual */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Mes Actual</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalMesActual}</p>
                    <p className="text-xs text-slate-500 mt-1">puntos</p>
                </div>

                {/* Comparativa mensual */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${stats.cambioMensual >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {stats.cambioMensual >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Cambio Mensual</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className={`text-3xl font-bold ${stats.cambioMensual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.cambioMensual >= 0 ? '+' : ''}{stats.cambioMensual.toFixed(0)}%
                        </p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">vs mes anterior</p>
                </div>

                {/* Promedio por miembro */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <Users size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Promedio</p>
                    </div>
                    <p className="text-3xl font-bold text-amber-600">{stats.promedioPorMiembro}</p>
                    <p className="text-xs text-slate-500 mt-1">pts por miembro</p>
                </div>
            </div>

            {/* Ranking de miembros */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Award className="text-amber-400" size={20} />
                        <h3 className="text-lg font-bold text-white">Ranking del Equipo</h3>
                    </div>
                </div>

                {miembros.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="mx-auto mb-4 text-slate-300" size={48} />
                        <p className="text-slate-500">No hay miembros en este equipo</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Posición</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Colaborador</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase">Rol</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase bg-blue-50">Mes Actual</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase bg-slate-100">Mes Anterior</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase bg-purple-50">Total Año</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {miembros.map((miembro, idx) => {
                                    const cambio = miembro.puntosMesAnterior > 0
                                        ? ((miembro.puntosMesActual - miembro.puntosMesAnterior) / miembro.puntosMesAnterior) * 100
                                        : miembro.puntosMesActual > 0 ? 100 : 0

                                    return (
                                        <tr key={miembro.userId} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {idx === 0 && (
                                                        <Medal className="text-amber-400" size={20} />
                                                    )}
                                                    {idx === 1 && (
                                                        <Medal className="text-slate-400" size={20} />
                                                    )}
                                                    {idx === 2 && (
                                                        <Medal className="text-amber-600" size={20} />
                                                    )}
                                                    <span className={`text-lg font-bold ${idx < 3 ? 'text-purple-600' : 'text-slate-600'}`}>
                                                        #{idx + 1}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-semibold text-slate-800">{miembro.nombre}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 text-xs font-medium rounded bg-slate-100 text-slate-700">
                                                    {miembro.rol}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center bg-blue-50/30">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-lg font-bold text-blue-600">{miembro.puntosMesActual}</span>
                                                    {cambio !== 0 && (
                                                        <span className={`text-xs font-medium ${cambio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {cambio >= 0 ? '↑' : '↓'} {Math.abs(cambio).toFixed(0)}%
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center bg-slate-50/30">
                                                <span className="text-lg font-medium text-slate-600">{miembro.puntosMesAnterior}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center bg-purple-50/30">
                                                <span className="text-lg font-bold text-purple-600">{miembro.puntosAnio}</span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
