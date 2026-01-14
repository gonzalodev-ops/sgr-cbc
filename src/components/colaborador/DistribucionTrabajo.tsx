'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { BarChart3, Users, FileText, TrendingUp, Loader2, AlertTriangle } from 'lucide-react'

interface DistribucionTrabajoProps {
    userId: string
}

interface DistribucionCliente {
    clienteId: string
    nombreCliente: string
    cantidad: number
}

interface DistribucionProceso {
    procesoId: string
    nombreProceso: string
    cantidad: number
}

export default function DistribucionTrabajo({ userId }: DistribucionTrabajoProps) {
    const [distribucionClientes, setDistribucionClientes] = useState<DistribucionCliente[]>([])
    const [distribucionProcesos, setDistribucionProcesos] = useState<DistribucionProceso[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        async function cargarDistribucion() {
            try {
                setLoading(true)
                setError(null)

                // 1. Obtener tareas del usuario con cliente
                const { data: tareasData, error: tareasError } = await supabase
                    .from('tarea')
                    .select(`
                        tarea_id,
                        cliente_id,
                        proceso_id,
                        cliente:cliente_id (
                            cliente_id,
                            nombre_comercial
                        ),
                        proceso:proceso_id (
                            proceso_id,
                            nombre
                        )
                    `)
                    .eq('responsable_usuario_id', userId)

                if (tareasError) throw tareasError

                if (!tareasData || tareasData.length === 0) {
                    setDistribucionClientes([])
                    setDistribucionProcesos([])
                    setLoading(false)
                    return
                }

                // 2. Agrupar por cliente
                const clientesMap = new Map<string, DistribucionCliente>()
                tareasData.forEach((tarea: any) => {
                    const cliente = Array.isArray(tarea.cliente) ? tarea.cliente[0] : tarea.cliente
                    if (cliente?.cliente_id) {
                        const clienteId = cliente.cliente_id
                        if (clientesMap.has(clienteId)) {
                            const existing = clientesMap.get(clienteId)!
                            existing.cantidad++
                        } else {
                            clientesMap.set(clienteId, {
                                clienteId,
                                nombreCliente: cliente.nombre_comercial || 'Sin nombre',
                                cantidad: 1
                            })
                        }
                    }
                })

                // 3. Agrupar por proceso
                const procesosMap = new Map<string, DistribucionProceso>()
                tareasData.forEach((tarea: any) => {
                    const proceso = Array.isArray(tarea.proceso) ? tarea.proceso[0] : tarea.proceso
                    if (proceso?.proceso_id) {
                        const procesoId = proceso.proceso_id
                        if (procesosMap.has(procesoId)) {
                            const existing = procesosMap.get(procesoId)!
                            existing.cantidad++
                        } else {
                            procesosMap.set(procesoId, {
                                procesoId,
                                nombreProceso: proceso.nombre || 'Sin nombre',
                                cantidad: 1
                            })
                        }
                    }
                })

                // Convertir a arrays y ordenar por cantidad (descendente)
                const clientes = Array.from(clientesMap.values())
                    .sort((a, b) => b.cantidad - a.cantidad)
                const procesos = Array.from(procesosMap.values())
                    .sort((a, b) => b.cantidad - a.cantidad)

                setDistribucionClientes(clientes)
                setDistribucionProcesos(procesos)
            } catch (err: any) {
                console.error('Error al cargar distribución:', err)
                setError(err.message || 'Error al cargar distribución de trabajo')
            } finally {
                setLoading(false)
            }
        }

        cargarDistribucion()
    }, [userId])

    // Calcular totales para porcentajes
    const totalTareasClientes = useMemo(() => {
        return distribucionClientes.reduce((sum, c) => sum + c.cantidad, 0)
    }, [distribucionClientes])

    const totalTareasProcesos = useMemo(() => {
        return distribucionProcesos.reduce((sum, p) => sum + p.cantidad, 0)
    }, [distribucionProcesos])

    // Top 5 clientes
    const top5Clientes = useMemo(() => {
        return distribucionClientes.slice(0, 5)
    }, [distribucionClientes])

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-slate-600" size={20} />
                    <p className="text-slate-700">Cargando distribución de trabajo...</p>
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

    if (distribucionClientes.length === 0 && distribucionProcesos.length === 0) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                <BarChart3 className="mx-auto mb-2 text-slate-400" size={32} />
                <p className="text-sm text-slate-700">No hay tareas asignadas</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Distribución por Cliente */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2 mb-4">
                    <Users size={16} />
                    Distribución por Cliente
                </h3>

                {distribucionClientes.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No hay datos</p>
                ) : (
                    <div className="space-y-3">
                        {distribucionClientes.map((cliente) => {
                            const porcentaje = totalTareasClientes > 0
                                ? (cliente.cantidad / totalTareasClientes) * 100
                                : 0

                            return (
                                <div key={cliente.clienteId}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-slate-700 truncate">
                                            {cliente.nombreCliente}
                                        </span>
                                        <span className="text-sm font-bold text-blue-600 ml-2">
                                            {porcentaje.toFixed(0)}% ({cliente.cantidad})
                                        </span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all"
                                            style={{ width: `${porcentaje}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Distribución por Proceso */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2 mb-4">
                    <FileText size={16} />
                    Distribución por Proceso
                </h3>

                {distribucionProcesos.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No hay datos</p>
                ) : (
                    <div className="space-y-3">
                        {distribucionProcesos.map((proceso) => {
                            const porcentaje = totalTareasProcesos > 0
                                ? (proceso.cantidad / totalTareasProcesos) * 100
                                : 0

                            return (
                                <div key={proceso.procesoId}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-slate-700 truncate">
                                            {proceso.nombreProceso}
                                        </span>
                                        <span className="text-sm font-bold text-purple-600 ml-2">
                                            {porcentaje.toFixed(0)}% ({proceso.cantidad})
                                        </span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 transition-all"
                                            style={{ width: `${porcentaje}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Top 5 Clientes */}
            {top5Clientes.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-4 lg:col-span-2">
                    <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2 mb-4">
                        <TrendingUp size={16} />
                        Top 5 Clientes por Tiempo Dedicado
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {top5Clientes.map((cliente, index) => {
                            const porcentaje = totalTareasClientes > 0
                                ? (cliente.cantidad / totalTareasClientes) * 100
                                : 0

                            return (
                                <div
                                    key={cliente.clienteId}
                                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-blue-600">
                                            #{index + 1}
                                        </span>
                                        <span className="text-lg font-bold text-blue-700">
                                            {porcentaje.toFixed(0)}%
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800 truncate mb-1">
                                        {cliente.nombreCliente}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        {cliente.cantidad} tarea{cliente.cantidad !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
