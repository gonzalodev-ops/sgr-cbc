'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Users, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react'

interface ColaboradorData {
    user_id: string
    nombre: string
    email: string
    rol_global: string
    equipo: string
    tareasPendientes: number
    tareasEnCurso: number
    tareasCompletadas: number
    puntosCompletados: number
    porcentajeATiempo: number
}

export default function ColaboradoresPage() {
    const [colaboradores, setColaboradores] = useState<ColaboradorData[]>([])
    const [loading, setLoading] = useState(true)
    const [filtroEquipo, setFiltroEquipo] = useState('all')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        async function fetchColaboradores() {
            setLoading(true)

            // 1. Traer usuarios con sus equipos
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select(`
                    user_id,
                    nombre,
                    email,
                    rol_global,
                    team_members (
                        teams:team_id (nombre)
                    )
                `)
                .eq('activo', true)

            if (userError) {
                console.error('Error fetching users:', userError)
                setLoading(false)
                return
            }

            // 2. Traer todas las tareas con responsable
            const { data: tareaData } = await supabase
                .from('tarea')
                .select('tarea_id, estado, responsable_usuario_id, fecha_limite_oficial, updated_at')

            // 3. Calcular métricas por colaborador
            const colaboradoresConMetricas: ColaboradorData[] = (userData || []).map((user: any) => {
                const tareasUsuario = (tareaData || []).filter(
                    (t: any) => t.responsable_usuario_id === user.user_id
                )

                const pendientes = tareasUsuario.filter((t: any) => t.estado === 'pendiente').length
                const enCurso = tareasUsuario.filter((t: any) =>
                    ['en_curso', 'pendiente_evidencia', 'en_validacion'].includes(t.estado)
                ).length
                const completadas = tareasUsuario.filter((t: any) =>
                    ['presentado', 'pagado', 'cerrado'].includes(t.estado)
                ).length

                // Calcular % a tiempo (simplificado)
                const completadasATiempo = tareasUsuario.filter((t: any) => {
                    if (!['presentado', 'pagado', 'cerrado'].includes(t.estado)) return false
                    const fechaLimite = new Date(t.fecha_limite_oficial)
                    const fechaCompletado = new Date(t.updated_at)
                    return fechaCompletado <= fechaLimite
                }).length
                const porcentajeATiempo = completadas > 0
                    ? Math.round((completadasATiempo / completadas) * 100)
                    : 100

                // Puntos (simplificado: 50 pts por tarea completada)
                const puntosCompletados = completadas * 50

                return {
                    user_id: user.user_id,
                    nombre: user.nombre,
                    email: user.email,
                    rol_global: user.rol_global,
                    equipo: user.team_members?.[0]?.teams?.nombre || 'Sin equipo',
                    tareasPendientes: pendientes,
                    tareasEnCurso: enCurso,
                    tareasCompletadas: completadas,
                    puntosCompletados,
                    porcentajeATiempo
                }
            })

            setColaboradores(colaboradoresConMetricas)
            setLoading(false)
        }

        fetchColaboradores()
    }, [supabase])

    // Equipos únicos para filtro
    const equipos = useMemo(() =>
        [...new Set(colaboradores.map(c => c.equipo))].filter(e => e !== 'Sin equipo').sort()
        , [colaboradores])

    // Colaboradores filtrados
    const colaboradoresFiltrados = useMemo(() =>
        colaboradores.filter(c => filtroEquipo === 'all' || c.equipo === filtroEquipo)
        , [colaboradores, filtroEquipo])

    // KPIs globales
    const totalPuntos = useMemo(() =>
        colaboradoresFiltrados.reduce((sum, c) => sum + c.puntosCompletados, 0)
        , [colaboradoresFiltrados])

    const promedioATiempo = useMemo(() => {
        const conTareas = colaboradoresFiltrados.filter(c => c.tareasCompletadas > 0)
        if (conTareas.length === 0) return 100
        return Math.round(conTareas.reduce((sum, c) => sum + c.porcentajeATiempo, 0) / conTareas.length)
    }, [colaboradoresFiltrados])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Colaboradores</h1>
                            <p className="text-slate-500">Rendimiento y carga de trabajo por persona</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Puntos Totales</p>
                            <p className="text-2xl font-bold text-blue-600">{totalPuntos}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">% A Tiempo</p>
                            <p className={`text-2xl font-bold ${promedioATiempo >= 90 ? 'text-green-600' : promedioATiempo >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {promedioATiempo}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtro */}
            <div className="flex gap-4">
                <select
                    value={filtroEquipo}
                    onChange={(e) => setFiltroEquipo(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                    <option value="all">👥 Todos los Equipos</option>
                    {equipos.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
            </div>

            {/* Tabla de Colaboradores */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-medium">Cargando colaboradores...</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-800 text-slate-200 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Colaborador</th>
                                <th className="p-4">Equipo</th>
                                <th className="p-4 text-center">Rol</th>
                                <th className="p-4 text-center">
                                    <Clock className="inline" size={14} /> Pendientes
                                </th>
                                <th className="p-4 text-center">
                                    <TrendingUp className="inline" size={14} /> En Curso
                                </th>
                                <th className="p-4 text-center">
                                    <CheckCircle className="inline" size={14} /> Completadas
                                </th>
                                <th className="p-4 text-center bg-green-900/40">Puntos</th>
                                <th className="p-4 text-center bg-blue-900/40">% A Tiempo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {colaboradoresFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400">
                                        <Users className="mx-auto mb-2 opacity-50" size={32} />
                                        <p>No hay colaboradores con este filtro.</p>
                                    </td>
                                </tr>
                            ) : (
                                colaboradoresFiltrados.map(c => (
                                    <tr key={c.user_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-semibold text-slate-700">{c.nombre}</p>
                                            <p className="text-xs text-slate-400">{c.email}</p>
                                        </td>
                                        <td className="p-4 text-slate-600">{c.equipo}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${c.rol_global === 'ADMIN' ? 'bg-red-100 text-red-700' :
                                                c.rol_global === 'SOCIO' ? 'bg-purple-100 text-purple-700' :
                                                    c.rol_global === 'LIDER' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {c.rol_global}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {c.tareasPendientes > 0 ? (
                                                <span className="text-slate-600 font-medium">{c.tareasPendientes}</span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {c.tareasEnCurso > 0 ? (
                                                <span className="text-blue-600 font-medium">{c.tareasEnCurso}</span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {c.tareasCompletadas > 0 ? (
                                                <span className="text-green-600 font-medium">{c.tareasCompletadas}</span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center font-bold text-green-600 bg-green-50/50">
                                            {c.puntosCompletados}
                                        </td>
                                        <td className="p-4 text-center bg-blue-50/50">
                                            <span className={`font-bold ${c.porcentajeATiempo >= 90 ? 'text-green-600' :
                                                c.porcentajeATiempo >= 70 ? 'text-yellow-600' :
                                                    'text-red-600'
                                                }`}>
                                                {c.porcentajeATiempo}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
