'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Workflow } from 'lucide-react'
import { ProcesoSelector } from '@/components/proceso/ProcesoSelector'
import { ProcesoMetrics, ProcesoMetricsData } from '@/components/proceso/ProcesoMetrics'
import { ProcesoTable, TareaProcesoData } from '@/components/proceso/ProcesoTable'
import { ProcesoOperativo, EstadoTarea } from '@/lib/types/database'

export default function ProcesoPage() {
    const [procesos, setProcesos] = useState<ProcesoOperativo[]>([])
    const [selectedProceso, setSelectedProceso] = useState<string>('')
    const [tareas, setTareas] = useState<TareaProcesoData[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingTareas, setLoadingTareas] = useState(false)

    const supabase = useMemo(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), [])

    // Cargar procesos al montar
    useEffect(() => {
        async function fetchProcesos() {
            setLoading(true)
            const { data, error } = await supabase
                .from('proceso_operativo')
                .select('proceso_id, nombre, categoria_default, activo')
                .eq('activo', true)
                .order('nombre')

            if (error) {
                console.error('Error fetching procesos:', error)
            } else if (data) {
                setProcesos(data)
            }
            setLoading(false)
        }

        fetchProcesos()
    }, [supabase])

    // Cargar tareas cuando cambia el proceso seleccionado
    useEffect(() => {
        if (!selectedProceso) {
            setTareas([])
            return
        }

        async function fetchTareasProceso() {
            setLoadingTareas(true)

            // 1. Obtener obligaciones del proceso
            const { data: obligaciones, error: obligacionesError } = await supabase
                .from('obligacion_proceso')
                .select('id_obligacion')
                .eq('proceso_id', selectedProceso)
                .eq('activo', true)

            if (obligacionesError) {
                console.error('Error fetching obligaciones:', obligacionesError)
                setLoadingTareas(false)
                return
            }

            if (!obligaciones || obligaciones.length === 0) {
                setTareas([])
                setLoadingTareas(false)
                return
            }

            // 2. Obtener tareas de esas obligaciones
            const obligacionIds = obligaciones.map(o => o.id_obligacion)
            const { data: tareasData, error: tareasError } = await supabase
                .from('tarea')
                .select(`
                    tarea_id,
                    estado,
                    fecha_limite_oficial,
                    periodo_fiscal,
                    ejercicio,
                    updated_at,
                    cliente:cliente_id(nombre_comercial),
                    contribuyente:contribuyente_id(rfc),
                    obligacion:id_obligacion(nombre_corto),
                    responsable:users!responsable_usuario_id(nombre)
                `)
                .in('id_obligacion', obligacionIds)
                .order('fecha_limite_oficial', { ascending: true })

            if (tareasError) {
                console.error('Error fetching tareas:', tareasError)
                setLoadingTareas(false)
                return
            }

            if (tareasData) {
                const mappedTareas: TareaProcesoData[] = tareasData.map((t: any) => ({
                    tarea_id: t.tarea_id,
                    periodo_fiscal: t.periodo_fiscal,
                    ejercicio: t.ejercicio,
                    estado: t.estado as EstadoTarea,
                    fecha_limite_oficial: t.fecha_limite_oficial,
                    cliente_nombre: t.cliente?.nombre_comercial || 'N/A',
                    contribuyente_rfc: t.contribuyente?.rfc || 'N/A',
                    obligacion_nombre: t.obligacion?.nombre_corto || 'N/A',
                    responsable_nombre: t.responsable?.nombre || 'Sin asignar',
                    updated_at: t.updated_at
                }))

                setTareas(mappedTareas)
            }

            setLoadingTareas(false)
        }

        fetchTareasProceso()
    }, [selectedProceso, supabase])

    // Calcular métricas
    const metrics = useMemo(() => {
        if (tareas.length === 0) {
            return {
                totalTareas: 0,
                completadas: 0,
                pctCompletadas: 0,
                pctATiempo: 100,
                puntos: 0,
                deltaTareas: 0,
                deltaCompletadas: 0,
                deltaPctCompletadas: 0,
                deltaPuntos: 0
            }
        }

        // Obtener el periodo/mes actual (el más reciente en los datos)
        const periodos = [...new Set(tareas.map(t => t.periodo_fiscal))].sort()
        const mesActual = periodos[periodos.length - 1]
        const mesAnterior = periodos[periodos.length - 2]

        // Filtrar tareas del mes actual
        const tareasMesActual = tareas.filter(t => t.periodo_fiscal === mesActual)
        const totalMes = tareasMesActual.length

        // Tareas completadas (estados finales)
        const estadosCompletados: EstadoTarea[] = ['cerrado', 'pagado', 'presentado']
        const completadas = tareasMesActual.filter(t => estadosCompletados.includes(t.estado))
        const numCompletadas = completadas.length

        // Tareas completadas a tiempo
        const aTiempo = completadas.filter(t => {
            if (!(t as any).updated_at) return true // Si no hay fecha de actualización, asumir a tiempo
            const fechaCompletado = new Date((t as any).updated_at)
            const fechaLimite = new Date(t.fecha_limite_oficial)
            return fechaCompletado <= fechaLimite
        })

        // Porcentajes
        const pctCompletadas = totalMes > 0 ? (numCompletadas / totalMes * 100) : 0
        const pctATiempo = numCompletadas > 0 ? (aTiempo.length / numCompletadas * 100) : 100

        // Puntos (50 base por tarea completada)
        const puntos = numCompletadas * 50

        // Métricas mes anterior (para deltas)
        let deltaTareas = 0
        let deltaCompletadas = 0
        let deltaPctCompletadas = 0
        let deltaPuntos = 0

        if (mesAnterior) {
            const tareasMesAnterior = tareas.filter(t => t.periodo_fiscal === mesAnterior)
            const totalMesAnterior = tareasMesAnterior.length
            const completadasMesAnterior = tareasMesAnterior.filter(t => estadosCompletados.includes(t.estado)).length
            const pctCompletadasAnterior = totalMesAnterior > 0 ? (completadasMesAnterior / totalMesAnterior * 100) : 0
            const puntosAnterior = completadasMesAnterior * 50

            deltaTareas = totalMes - totalMesAnterior
            deltaCompletadas = numCompletadas - completadasMesAnterior
            deltaPctCompletadas = Math.round(pctCompletadas - pctCompletadasAnterior)
            deltaPuntos = puntos - puntosAnterior
        }

        return {
            totalTareas: totalMes,
            completadas: numCompletadas,
            pctCompletadas,
            pctATiempo,
            puntos,
            deltaTareas,
            deltaCompletadas,
            deltaPctCompletadas,
            deltaPuntos
        }
    }, [tareas])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-lg shadow-lg shadow-teal-500/30">
                        <Workflow size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Vista por Proceso</h1>
                        <p className="text-slate-500">Métricas y tareas por tipo de proceso operativo</p>
                    </div>
                </div>

                {/* Selector de Proceso */}
                <ProcesoSelector
                    procesos={procesos}
                    selectedProceso={selectedProceso}
                    onSelect={setSelectedProceso}
                    loading={loading}
                />
            </div>

            {/* Métricas */}
            {selectedProceso && (
                <>
                    <ProcesoMetrics metrics={metrics} loading={loadingTareas} />

                    {/* Tabla de Tareas */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-700">
                                Tareas del Proceso
                            </h2>
                            {tareas.length > 0 && !loadingTareas && (
                                <span className="text-sm text-slate-500">
                                    Última actualización: {new Date().toLocaleTimeString('es-MX')}
                                </span>
                            )}
                        </div>
                        <ProcesoTable tareas={tareas} loading={loadingTareas} />
                    </div>
                </>
            )}

            {/* Empty state cuando no hay proceso seleccionado */}
            {!selectedProceso && !loading && (
                <div className="bg-white rounded-xl border border-slate-200 border-dashed p-16">
                    <div className="text-center">
                        <Workflow className="mx-auto text-slate-300 mb-4" size={64} />
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">
                            Selecciona un Proceso
                        </h3>
                        <p className="text-slate-500">
                            Elige un proceso operativo arriba para ver sus métricas y tareas
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
