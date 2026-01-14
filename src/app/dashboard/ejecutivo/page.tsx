'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { KPICards } from '@/components/ejecutivo/KPICards'
import { AlertasRiesgo } from '@/components/ejecutivo/AlertasRiesgo'
import { BarChart3, TrendingUp, AlertTriangle, Lock } from 'lucide-react'
import type { RolGlobal } from '@/lib/types/database'

interface TopCliente {
    cliente_id: string
    nombre_comercial: string
    puntos_totales: number
}

interface TopProceso {
    proceso_nombre: string
    cantidad_retrasos: number
}

interface TareaAlerta {
    tarea_id: string
    cliente: string
    entregable: string
    fecha_limite: string
    responsable: string
    diasRestantes?: number
}

interface ColaboradorSobrecarga {
    nombre: string
    tareasActivas: number
}

export default function DashboardEjecutivo() {
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<RolGlobal | null>(null)
    const [accessDenied, setAccessDenied] = useState(false)

    // KPIs
    const [totalTareas, setTotalTareas] = useState(0)
    const [porcentajeCumplimiento, setPorcentajeCumplimiento] = useState(0)
    const [puntosGenerados, setPuntosGenerados] = useState(0)
    const [tareasVencidas, setTareasVencidas] = useState(0)

    // Top 5
    const [topClientes, setTopClientes] = useState<TopCliente[]>([])
    const [topProcesos, setTopProcesos] = useState<TopProceso[]>([])

    // Alertas
    const [tareasPorVencer, setTareasPorVencer] = useState<TareaAlerta[]>([])
    const [tareasVencidasAlertas, setTareasVencidasAlertas] = useState<TareaAlerta[]>([])
    const [colaboradoresSobrecargados, setColaboradoresSobrecargados] = useState<ColaboradorSobrecarga[]>([])

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        async function verificarAccesoYCargarDatos() {
            setLoading(true)

            // Verificar rol del usuario
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setAccessDenied(true)
                setLoading(false)
                return
            }

            // Obtener datos del usuario desde la tabla users
            const { data: userData } = await supabase
                .from('users')
                .select('rol_global')
                .eq('user_id', user.id)
                .single()

            if (!userData || (userData.rol_global !== 'ADMIN' && userData.rol_global !== 'SOCIO')) {
                setAccessDenied(true)
                setLoading(false)
                return
            }

            setUserRole(userData.rol_global)

            // Cargar todos los datos
            await Promise.all([
                cargarKPIs(),
                cargarTopClientes(),
                cargarTopProcesos(),
                cargarAlertas()
            ])

            setLoading(false)
        }

        verificarAccesoYCargarDatos()
    }, [])

    async function cargarKPIs() {
        // Calcular inicio y fin del mes actual
        const ahora = new Date()
        const año = ahora.getFullYear()
        const mes = ahora.getMonth()
        const inicioMes = new Date(año, mes, 1).toISOString()
        const finMes = new Date(año, mes + 1, 0, 23, 59, 59).toISOString()

        // Obtener todas las tareas del mes
        const { data: tareasMes } = await supabase
            .from('tarea')
            .select('tarea_id, estado, fecha_limite_oficial, puntos_reales')
            .gte('fecha_limite_oficial', inicioMes)
            .lte('fecha_limite_oficial', finMes)

        if (tareasMes) {
            const total = tareasMes.length
            setTotalTareas(total)

            // Calcular tareas completadas a tiempo (estado cerrado)
            const completadas = tareasMes.filter(t => t.estado === 'cerrado').length
            const cumplimiento = total > 0 ? (completadas / total) * 100 : 0
            setPorcentajeCumplimiento(cumplimiento)

            // Calcular puntos generados
            const puntos = tareasMes
                .filter(t => t.estado === 'cerrado')
                .reduce((sum, t) => sum + (t.puntos_reales || 0), 0)
            setPuntosGenerados(puntos)

            // Calcular tareas vencidas (fecha límite pasada y no cerradas)
            const vencidas = tareasMes.filter(t => {
                const fechaLimite = new Date(t.fecha_limite_oficial)
                const hoy = new Date()
                return fechaLimite < hoy && t.estado !== 'cerrado' && t.estado !== 'pagado'
            }).length
            setTareasVencidas(vencidas)
        }
    }

    async function cargarTopClientes() {
        // Obtener top 5 clientes por puntos totales (solo tareas cerradas)
        const { data } = await supabase
            .from('tarea')
            .select(`
                cliente_id,
                puntos_reales,
                cliente:cliente_id (
                    nombre_comercial
                )
            `)
            .eq('estado', 'cerrado')

        if (data) {
            // Agrupar por cliente y sumar puntos
            const clientesMap = new Map<string, { nombre: string, puntos: number }>()

            data.forEach((tarea: any) => {
                const clienteId = tarea.cliente_id
                const nombreCliente = tarea.cliente?.nombre_comercial || 'Sin nombre'
                const puntos = tarea.puntos_reales || 0

                if (clientesMap.has(clienteId)) {
                    const cliente = clientesMap.get(clienteId)!
                    cliente.puntos += puntos
                } else {
                    clientesMap.set(clienteId, { nombre: nombreCliente, puntos })
                }
            })

            // Convertir a array y ordenar por puntos
            const topClientesArray: TopCliente[] = Array.from(clientesMap.entries())
                .map(([id, { nombre, puntos }]) => ({
                    cliente_id: id,
                    nombre_comercial: nombre,
                    puntos_totales: puntos
                }))
                .sort((a, b) => b.puntos_totales - a.puntos_totales)
                .slice(0, 5)

            setTopClientes(topClientesArray)
        }
    }

    async function cargarTopProcesos() {
        // Obtener tareas vencidas con información de proceso
        const { data } = await supabase
            .from('tarea')
            .select(`
                tarea_id,
                fecha_limite_oficial,
                estado,
                obligacion:id_obligacion (
                    nombre_corto,
                    obligacion_proceso (
                        proceso:proceso_id (
                            nombre
                        )
                    )
                )
            `)
            .not('estado', 'in', '(cerrado,pagado)')

        if (data) {
            const procesosMap = new Map<string, number>()
            const hoy = new Date()

            data.forEach((tarea: any) => {
                const fechaLimite = new Date(tarea.fecha_limite_oficial)
                const esVencida = fechaLimite < hoy

                if (esVencida && tarea.obligacion?.obligacion_proceso?.length > 0) {
                    const proceso = tarea.obligacion.obligacion_proceso[0]?.proceso
                    if (proceso?.nombre) {
                        const nombre = proceso.nombre
                        procesosMap.set(nombre, (procesosMap.get(nombre) || 0) + 1)
                    }
                }
            })

            const topProcesosArray: TopProceso[] = Array.from(procesosMap.entries())
                .map(([nombre, cantidad]) => ({
                    proceso_nombre: nombre,
                    cantidad_retrasos: cantidad
                }))
                .sort((a, b) => b.cantidad_retrasos - a.cantidad_retrasos)
                .slice(0, 5)

            setTopProcesos(topProcesosArray)
        }
    }

    async function cargarAlertas() {
        const hoy = new Date()
        const tresDiasMas = new Date()
        tresDiasMas.setDate(hoy.getDate() + 3)

        // Tareas próximas a vencer (menos de 3 días)
        const { data: porVencer } = await supabase
            .from('tarea')
            .select(`
                tarea_id,
                fecha_limite_oficial,
                cliente:cliente_id (
                    nombre_comercial
                ),
                obligacion:id_obligacion (
                    nombre_corto
                ),
                responsable:responsable_usuario_id (
                    nombre
                )
            `)
            .gte('fecha_limite_oficial', hoy.toISOString())
            .lte('fecha_limite_oficial', tresDiasMas.toISOString())
            .not('estado', 'in', '(cerrado,pagado)')

        if (porVencer) {
            const alertasPorVencer: TareaAlerta[] = porVencer.map((t: any) => {
                const fechaLimite = new Date(t.fecha_limite_oficial)
                const diffTime = fechaLimite.getTime() - hoy.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                return {
                    tarea_id: t.tarea_id,
                    cliente: t.cliente?.nombre_comercial || 'Sin cliente',
                    entregable: t.obligacion?.nombre_corto || 'Sin nombre',
                    fecha_limite: t.fecha_limite_oficial,
                    responsable: t.responsable?.nombre || 'Sin asignar',
                    diasRestantes: diffDays
                }
            })
            setTareasPorVencer(alertasPorVencer)
        }

        // Tareas vencidas
        const { data: vencidas } = await supabase
            .from('tarea')
            .select(`
                tarea_id,
                fecha_limite_oficial,
                cliente:cliente_id (
                    nombre_comercial
                ),
                obligacion:id_obligacion (
                    nombre_corto
                ),
                responsable:responsable_usuario_id (
                    nombre
                )
            `)
            .lt('fecha_limite_oficial', hoy.toISOString())
            .not('estado', 'in', '(cerrado,pagado)')
            .order('fecha_limite_oficial', { ascending: true })

        if (vencidas) {
            const alertasVencidas: TareaAlerta[] = vencidas.map((t: any) => ({
                tarea_id: t.tarea_id,
                cliente: t.cliente?.nombre_comercial || 'Sin cliente',
                entregable: t.obligacion?.nombre_corto || 'Sin nombre',
                fecha_limite: t.fecha_limite_oficial,
                responsable: t.responsable?.nombre || 'Sin asignar'
            }))
            setTareasVencidasAlertas(alertasVencidas)
        }

        // Colaboradores con sobrecarga (más de 10 tareas activas)
        const { data: colaboradores } = await supabase
            .from('tarea')
            .select(`
                responsable_usuario_id,
                responsable:responsable_usuario_id (
                    nombre
                )
            `)
            .not('estado', 'in', '(cerrado,pagado)')
            .not('responsable_usuario_id', 'is', null)

        if (colaboradores) {
            const colabMap = new Map<string, { nombre: string, count: number }>()

            colaboradores.forEach((t: any) => {
                const userId = t.responsable_usuario_id
                const nombre = t.responsable?.nombre || 'Sin nombre'

                if (colabMap.has(userId)) {
                    colabMap.get(userId)!.count++
                } else {
                    colabMap.set(userId, { nombre, count: 1 })
                }
            })

            const sobrecargados: ColaboradorSobrecarga[] = Array.from(colabMap.values())
                .filter(c => c.count > 10)
                .map(c => ({
                    nombre: c.nombre,
                    tareasActivas: c.count
                }))
                .sort((a, b) => b.tareasActivas - a.tareasActivas)

            setColaboradoresSobrecargados(sobrecargados)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Cargando dashboard ejecutivo...</p>
            </div>
        )
    }

    if (accessDenied) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="bg-red-100 p-6 rounded-full">
                    <Lock className="text-red-600" size={48} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Acceso Denegado</h2>
                <p className="text-slate-600 text-center max-w-md">
                    Esta sección es exclusiva para Administradores y Socios.
                    <br />
                    No tienes los permisos necesarios para acceder a este dashboard.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-3 rounded-lg">
                            <BarChart3 size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Dashboard Ejecutivo</h1>
                            <p className="text-blue-200 mt-1">
                                Vista consolidada para {userRole === 'ADMIN' ? 'Administradores' : 'Socios'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-blue-200">Mes actual</p>
                        <p className="text-lg font-semibold">
                            {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <KPICards
                totalTareas={totalTareas}
                porcentajeCumplimiento={porcentajeCumplimiento}
                puntosGenerados={puntosGenerados}
                tareasVencidas={tareasVencidas}
            />

            {/* Alertas de Riesgo */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-red-600" size={20} />
                    Alertas de Riesgo Crítico
                </h2>
                <AlertasRiesgo
                    tareasPorVencer={tareasPorVencer}
                    tareasVencidas={tareasVencidasAlertas}
                    colaboradoresSobrecargados={colaboradoresSobrecargados}
                />
            </div>

            {/* Top 5 Secciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 5 Clientes por Esfuerzo */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="text-green-600" size={20} />
                        Top 5 Clientes por Esfuerzo
                    </h2>
                    {topClientes.length === 0 ? (
                        <p className="text-slate-400 text-center py-8">No hay datos disponibles</p>
                    ) : (
                        <div className="space-y-3">
                            {topClientes.map((cliente, idx) => (
                                <div
                                    key={cliente.cliente_id}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${idx === 0 ? 'bg-yellow-500 text-white' :
                                                idx === 1 ? 'bg-slate-300 text-slate-700' :
                                                    idx === 2 ? 'bg-orange-400 text-white' :
                                                        'bg-slate-200 text-slate-600'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <p className="font-medium text-slate-800">{cliente.nombre_comercial}</p>
                                    </div>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                                        {cliente.puntos_totales} pts
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top 5 Procesos con más Retrasos */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-red-600" size={20} />
                        Top 5 Procesos con más Retrasos
                    </h2>
                    {topProcesos.length === 0 ? (
                        <p className="text-slate-400 text-center py-8">No hay retrasos registrados</p>
                    ) : (
                        <div className="space-y-3">
                            {topProcesos.map((proceso, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold text-sm">
                                            {idx + 1}
                                        </div>
                                        <p className="font-medium text-slate-800">{proceso.proceso_nombre}</p>
                                    </div>
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                                        {proceso.cantidad_retrasos} retraso{proceso.cantidad_retrasos !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
