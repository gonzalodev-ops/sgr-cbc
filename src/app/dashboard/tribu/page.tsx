'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { Building2, Users, CheckCircle, Clock, AlertTriangle, TrendingUp, Target } from 'lucide-react'

interface TribuData {
    team_id: string
    nombre: string
    miembros: number
    tareasPendientes: number
    tareasEnCurso: number
    tareasCompletadas: number
    puntosCompletados: number
    porcentajeATiempo: number
    tareasEnRiesgo: number
}

interface MiembroResumen {
    nombre: string
    rol: string
    tareas: number
    puntos: number
}

export default function TribusPage() {
    const [tribus, setTribus] = useState<TribuData[]>([])
    const [miembrosPorTribu, setMiembrosPorTribu] = useState<Record<string, MiembroResumen[]>>({})
    const [expandedTribu, setExpandedTribu] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const supabase = useSupabase()

    useEffect(() => {
        async function fetchTribus() {
            setLoading(true)

            // 1. Traer equipos
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select('team_id, nombre')
                .eq('activo', true)

            if (teamsError) {
                console.error('Error fetching teams:', teamsError)
                setLoading(false)
                return
            }

            // 2. Traer miembros con usuarios
            const { data: membersData } = await supabase
                .from('team_members')
                .select(`
                    team_id,
                    rol_en_equipo,
                    users:user_id (user_id, nombre, rol_global)
                `)
                .eq('activo', true)

            // 3. Traer todas las tareas
            const { data: tareaData } = await supabase
                .from('tarea')
                .select('tarea_id, estado, responsable_usuario_id, fecha_limite_oficial, updated_at')

            // 4. Construir mapa de usuario a equipo
            const userToTeam: Record<string, string> = {}
            const teamMembers: Record<string, MiembroResumen[]> = {}

            if (membersData) {
                membersData.forEach((m: any) => {
                    if (m.users?.user_id) {
                        userToTeam[m.users.user_id] = m.team_id

                        if (!teamMembers[m.team_id]) {
                            teamMembers[m.team_id] = []
                        }

                        // Calcular tareas y puntos del miembro
                        const tareasUsuario = (tareaData || []).filter(
                            (t: any) => t.responsable_usuario_id === m.users.user_id
                        )
                        const completadas = tareasUsuario.filter((t: any) =>
                            ['presentado', 'pagado', 'cerrado'].includes(t.estado)
                        ).length

                        teamMembers[m.team_id].push({
                            nombre: m.users.nombre,
                            rol: m.rol_en_equipo,
                            tareas: tareasUsuario.length,
                            puntos: completadas * 50
                        })
                    }
                })
            }
            setMiembrosPorTribu(teamMembers)

            // 5. Calcular métricas por tribu
            const tribusConMetricas: TribuData[] = (teamsData || []).map((team: any) => {
                // Usuarios de este equipo
                const usuariosEquipo = Object.entries(userToTeam)
                    .filter(([, teamId]) => teamId === team.team_id)
                    .map(([userId]) => userId)

                // Tareas del equipo
                const tareasEquipo = (tareaData || []).filter(
                    (t: any) => usuariosEquipo.includes(t.responsable_usuario_id)
                )

                const pendientes = tareasEquipo.filter((t: any) => t.estado === 'pendiente').length
                const enCurso = tareasEquipo.filter((t: any) =>
                    ['en_curso', 'pendiente_evidencia', 'en_validacion'].includes(t.estado)
                ).length
                const completadas = tareasEquipo.filter((t: any) =>
                    ['presentado', 'pagado', 'cerrado'].includes(t.estado)
                ).length

                // Tareas en riesgo (bloquedas o rechazadas)
                const enRiesgo = tareasEquipo.filter((t: any) =>
                    ['bloqueado_cliente', 'rechazado'].includes(t.estado)
                ).length

                // % a tiempo
                const completadasATiempo = tareasEquipo.filter((t: any) => {
                    if (!['presentado', 'pagado', 'cerrado'].includes(t.estado)) return false
                    const fechaLimite = new Date(t.fecha_limite_oficial)
                    const fechaCompletado = new Date(t.updated_at)
                    return fechaCompletado <= fechaLimite
                }).length
                const porcentajeATiempo = completadas > 0
                    ? Math.round((completadasATiempo / completadas) * 100)
                    : 100

                return {
                    team_id: team.team_id,
                    nombre: team.nombre,
                    miembros: usuariosEquipo.length,
                    tareasPendientes: pendientes,
                    tareasEnCurso: enCurso,
                    tareasCompletadas: completadas,
                    puntosCompletados: completadas * 50,
                    porcentajeATiempo,
                    tareasEnRiesgo: enRiesgo
                }
            })

            setTribus(tribusConMetricas)
            setLoading(false)
        }

        fetchTribus()
    }, [supabase])

    // KPIs globales
    const totalPuntos = useMemo(() =>
        tribus.reduce((sum, t) => sum + t.puntosCompletados, 0)
        , [tribus])

    const totalTareas = useMemo(() =>
        tribus.reduce((sum, t) => sum + t.tareasPendientes + t.tareasEnCurso + t.tareasCompletadas, 0)
        , [tribus])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Tribus</h1>
                            <p className="text-slate-500">Rendimiento por equipo de trabajo</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Equipos Activos</p>
                            <p className="text-2xl font-bold text-purple-600">{tribus.length}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Tareas Totales</p>
                            <p className="text-2xl font-bold text-slate-600">{totalTareas}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Puntos Totales</p>
                            <p className="text-2xl font-bold text-green-600">{totalPuntos}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards de Tribus */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4 bg-white rounded-xl border border-slate-200">
                    <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Cargando equipos...</p>
                </div>
            ) : tribus.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-slate-200 border-dashed">
                    <Building2 className="mx-auto mb-4 text-slate-400" size={48} />
                    <h3 className="text-lg font-medium text-slate-900">No hay equipos configurados</h3>
                    <p className="text-slate-500 mt-2">Importa equipos desde Configuración.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tribus.map(t => (
                        <div
                            key={t.team_id}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setExpandedTribu(expandedTribu === t.team_id ? null : t.team_id)}
                        >
                            {/* Header de la Tribu */}
                            <div className="p-5 border-b border-slate-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">{t.nombre}</h3>
                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                            <Users size={14} /> {t.miembros} miembros
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-2xl font-bold text-green-600">{t.puntosCompletados}</span>
                                        <span className="text-xs text-slate-400">puntos</span>
                                    </div>
                                </div>
                            </div>

                            {/* Métricas */}
                            <div className="p-5 grid grid-cols-4 gap-4">
                                <div className="text-center">
                                    <Clock className="mx-auto text-slate-400 mb-1" size={18} />
                                    <p className="text-lg font-bold text-slate-700">{t.tareasPendientes}</p>
                                    <p className="text-[10px] text-slate-400 uppercase">Pendientes</p>
                                </div>
                                <div className="text-center">
                                    <TrendingUp className="mx-auto text-blue-500 mb-1" size={18} />
                                    <p className="text-lg font-bold text-blue-600">{t.tareasEnCurso}</p>
                                    <p className="text-[10px] text-slate-400 uppercase">En Curso</p>
                                </div>
                                <div className="text-center">
                                    <CheckCircle className="mx-auto text-green-500 mb-1" size={18} />
                                    <p className="text-lg font-bold text-green-600">{t.tareasCompletadas}</p>
                                    <p className="text-[10px] text-slate-400 uppercase">Completadas</p>
                                </div>
                                <div className="text-center">
                                    <Target className="mx-auto text-purple-500 mb-1" size={18} />
                                    <p className={`text-lg font-bold ${t.porcentajeATiempo >= 90 ? 'text-green-600' : t.porcentajeATiempo >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {t.porcentajeATiempo}%
                                    </p>
                                    <p className="text-[10px] text-slate-400 uppercase">A Tiempo</p>
                                </div>
                            </div>

                            {/* Alertas */}
                            {t.tareasEnRiesgo > 0 && (
                                <div className="px-5 pb-4">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                                        <AlertTriangle className="text-red-500" size={16} />
                                        <span className="text-sm text-red-700">
                                            {t.tareasEnRiesgo} tarea{t.tareasEnRiesgo > 1 ? 's' : ''} en riesgo
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Miembros (expandible) */}
                            {expandedTribu === t.team_id && miembrosPorTribu[t.team_id] && (
                                <div className="border-t border-slate-100 bg-slate-50 p-4">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-3">Miembros del Equipo</p>
                                    <div className="space-y-2">
                                        {miembrosPorTribu[t.team_id].map((m, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-slate-200">
                                                <div>
                                                    <p className="font-medium text-slate-700 text-sm">{m.nombre}</p>
                                                    <p className="text-xs text-slate-400">{m.rol}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-green-600">{m.puntos} pts</p>
                                                    <p className="text-xs text-slate-400">{m.tareas} tareas</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
