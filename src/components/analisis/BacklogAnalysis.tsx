'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { AlertTriangle, Clock, TrendingDown, Users } from 'lucide-react'

interface BacklogTarea {
    tarea_id: string
    periodo_fiscal: number
    ejercicio: number
    fecha_limite_oficial: string
    estado: string
    cliente: { nombre_comercial: string } | null
    obligacion: { nombre_corto: string } | null
}

interface BacklogPorEntidad {
    nombre: string
    cantidad: number
}

export default function BacklogAnalysis() {
    const [backlogTareas, setBacklogTareas] = useState<BacklogTarea[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        cargarBacklog()
    }, [])

    async function cargarBacklog() {
        setLoading(true)
        setError(null)

        try {
            const hoy = new Date()
            const mesActual = hoy.getMonth() + 1
            const anioActual = hoy.getFullYear()

            // Consultar tareas de backlog (periodos anteriores, no cerradas)
            const { data, error: backlogError } = await supabase
                .from('tarea')
                .select(`
                    tarea_id,
                    periodo_fiscal,
                    ejercicio,
                    fecha_limite_oficial,
                    estado,
                    cliente:cliente_id(nombre_comercial),
                    obligacion:id_obligacion(nombre_corto)
                `)
                .neq('estado', 'cerrado')
                .neq('estado', 'pagado')
                .or(`ejercicio.lt.${anioActual},and(ejercicio.eq.${anioActual},periodo_fiscal.lt.${mesActual})`)
                .order('fecha_limite_oficial', { ascending: true })

            if (backlogError) throw backlogError

            setBacklogTareas(data || [])
        } catch (err) {
            console.error('Error al cargar backlog:', err)
            setError('Error al cargar los datos de backlog')
        } finally {
            setLoading(false)
        }
    }

    function calcularAntiguedadPromedio(): number {
        if (backlogTareas.length === 0) return 0

        const hoy = new Date()
        const totalDias = backlogTareas.reduce((sum, tarea) => {
            const fechaLimite = new Date(tarea.fecha_limite_oficial)
            const dias = Math.floor((hoy.getTime() - fechaLimite.getTime()) / (1000 * 60 * 60 * 24))
            return sum + dias
        }, 0)

        return Math.round(totalDias / backlogTareas.length)
    }

    function obtenerBacklogPorCliente(): BacklogPorEntidad[] {
        const agrupado: { [key: string]: number } = {}

        backlogTareas.forEach(tarea => {
            const nombreCliente = Array.isArray(tarea.cliente)
                ? tarea.cliente[0]?.nombre_comercial
                : tarea.cliente?.nombre_comercial || 'Sin cliente'

            agrupado[nombreCliente] = (agrupado[nombreCliente] || 0) + 1
        })

        return Object.entries(agrupado)
            .map(([nombre, cantidad]) => ({ nombre, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5)
    }

    function obtenerBacklogPorProceso(): BacklogPorEntidad[] {
        const agrupado: { [key: string]: number } = {}

        backlogTareas.forEach(tarea => {
            const nombreObligacion = Array.isArray(tarea.obligacion)
                ? tarea.obligacion[0]?.nombre_corto
                : tarea.obligacion?.nombre_corto || 'Sin obligación'

            agrupado[nombreObligacion] = (agrupado[nombreObligacion] || 0) + 1
        })

        return Object.entries(agrupado)
            .map(([nombre, cantidad]) => ({ nombre, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5)
    }

    function formatearFecha(fecha: string): string {
        const d = new Date(fecha)
        return d.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    function calcularDiasAtraso(fechaLimite: string): number {
        const hoy = new Date()
        const limite = new Date(fechaLimite)
        return Math.floor((hoy.getTime() - limite.getTime()) / (1000 * 60 * 60 * 24))
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-slate-500">Analizando backlog...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="text-red-600" size={24} />
                    <div>
                        <h3 className="font-semibold text-red-800">Error al cargar análisis</h3>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    const antiguedadPromedio = calcularAntiguedadPromedio()
    const backlogPorCliente = obtenerBacklogPorCliente()
    const backlogPorProceso = obtenerBacklogPorProceso()
    const tareasAntiguas = backlogTareas.slice(0, 10)
    const maxBacklogCliente = Math.max(...backlogPorCliente.map(c => c.cantidad), 1)
    const maxBacklogProceso = Math.max(...backlogPorProceso.map(p => p.cantidad), 1)

    // Umbral de alerta: más de 10 tareas en backlog
    const alertaBacklog = backlogTareas.length > 10

    return (
        <div className="space-y-6">
            {/* Alerta de backlog alto */}
            {alertaBacklog && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={20} />
                        <div>
                            <h4 className="font-semibold text-red-900">Priorizar limpieza de backlog</h4>
                            <p className="text-sm text-red-700 mt-1">
                                Se detectaron {backlogTareas.length} tareas de periodos anteriores sin completar.
                                Es recomendable priorizar su resolución para evitar acumulación.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600 text-white rounded-lg">
                            <TrendingDown size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-red-600 font-medium">Total Backlog</p>
                            <p className="text-2xl font-bold text-red-900">{backlogTareas.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-600 text-white rounded-lg">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-orange-600 font-medium">Antigüedad Promedio</p>
                            <p className="text-2xl font-bold text-orange-900">
                                {antiguedadPromedio} días
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-600 text-white rounded-lg">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Clientes Afectados</p>
                            <p className="text-2xl font-bold text-purple-900">
                                {new Set(backlogTareas.map(t =>
                                    Array.isArray(t.cliente) ? t.cliente[0]?.nombre_comercial : t.cliente?.nombre_comercial
                                ).filter(Boolean)).size}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {backlogTareas.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingDown className="text-green-600" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-green-900">No hay backlog</h3>
                    <p className="text-green-700 mt-2">
                        Todas las tareas de periodos anteriores están completadas.
                    </p>
                </div>
            ) : (
                <>
                    {/* Backlog por cliente y proceso */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Backlog por Cliente */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Users size={20} className="text-purple-600" />
                                Top 5 - Backlog por Cliente
                            </h3>
                            {backlogPorCliente.length > 0 ? (
                                <div className="space-y-3">
                                    {backlogPorCliente.map((cliente, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-slate-700 truncate">
                                                    {cliente.nombre}
                                                </span>
                                                <span className="text-slate-900 font-semibold ml-2">
                                                    {cliente.cantidad}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all"
                                                    style={{ width: `${(cliente.cantidad / maxBacklogCliente) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm">No hay datos disponibles</p>
                            )}
                        </div>

                        {/* Backlog por Proceso */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <TrendingDown size={20} className="text-red-600" />
                                Top 5 - Backlog por Obligación
                            </h3>
                            {backlogPorProceso.length > 0 ? (
                                <div className="space-y-3">
                                    {backlogPorProceso.map((proceso, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-slate-700 truncate">
                                                    {proceso.nombre}
                                                </span>
                                                <span className="text-slate-900 font-semibold ml-2">
                                                    {proceso.cantidad}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all"
                                                    style={{ width: `${(proceso.cantidad / maxBacklogProceso) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm">No hay datos disponibles</p>
                            )}
                        </div>
                    </div>

                    {/* Tabla de tareas más antiguas */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Clock size={20} className="text-orange-600" />
                                Top 10 - Tareas Más Antiguas
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Cliente
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Obligación
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Periodo
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Fecha Límite
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Días Atraso
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {tareasAntiguas.map((tarea) => {
                                        const diasAtraso = calcularDiasAtraso(tarea.fecha_limite_oficial)
                                        const nombreCliente = Array.isArray(tarea.cliente)
                                            ? tarea.cliente[0]?.nombre_comercial
                                            : tarea.cliente?.nombre_comercial || 'Sin cliente'
                                        const nombreObligacion = Array.isArray(tarea.obligacion)
                                            ? tarea.obligacion[0]?.nombre_corto
                                            : tarea.obligacion?.nombre_corto || 'Sin obligación'

                                        return (
                                            <tr key={tarea.tarea_id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-slate-900">
                                                    {nombreCliente}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {nombreObligacion}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {tarea.periodo_fiscal}/{tarea.ejercicio}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {formatearFecha(tarea.fecha_limite_oficial)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        diasAtraso > 90
                                                            ? 'bg-red-100 text-red-800'
                                                            : diasAtraso > 30
                                                            ? 'bg-orange-100 text-orange-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {diasAtraso} días
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                                                        {tarea.estado}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
