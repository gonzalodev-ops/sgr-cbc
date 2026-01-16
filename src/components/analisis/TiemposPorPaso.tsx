'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Clock, AlertTriangle, TrendingUp, Activity } from 'lucide-react'

interface TiemposPorPasoProps {
    procesoId: string
    fechaInicio: string
    fechaFin: string
}

interface PasoMetrica {
    paso_id: string
    nombre: string
    orden: number
    tiempoPromedio: number
    tiempoMinimo: number
    tiempoMaximo: number
    desviacionEstandar: number
    cantidadTareas: number
    esCuelloBotella: boolean
}

interface ProcesoData {
    proceso_id: string
}

interface ObligacionData {
    proceso: ProcesoData[] | null
}

interface TareaQueryData {
    tarea_id: string
    obligacion: ObligacionData | ObligacionData[] | null
}

interface TareaStepData {
    proceso_paso_id: string
    created_at: string
    completado_at: string | null
    tarea_id: string
}

export default function TiemposPorPaso({ procesoId, fechaInicio, fechaFin }: TiemposPorPasoProps) {
    const [metricas, setMetricas] = useState<PasoMetrica[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = useMemo(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), [])

    const cargarMetricas = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            // 1. Obtener pasos del proceso
            const { data: pasos, error: pasosError } = await supabase
                .from('proceso_paso')
                .select('paso_id, nombre, orden')
                .eq('proceso_id', procesoId)
                .eq('activo', true)
                .order('orden')

            if (pasosError) throw pasosError

            if (!pasos || pasos.length === 0) {
                setError('No se encontraron pasos para este proceso')
                setLoading(false)
                return
            }

            // 2. Obtener todas las tareas del proceso en el rango de fechas
            const { data: tareas, error: tareasError } = await supabase
                .from('tarea')
                .select(`
                    tarea_id,
                    obligacion:id_obligacion (
                        proceso:obligacion_proceso!inner (
                            proceso_id
                        )
                    )
                `)
                .gte('fecha_limite_oficial', fechaInicio)
                .lte('fecha_limite_oficial', fechaFin)

            if (tareasError) throw tareasError

            // Filtrar tareas que pertenecen al proceso
            const tareasFiltradas = ((tareas || []) as TareaQueryData[]).filter((t) => {
                const oblig = Array.isArray(t.obligacion) ? t.obligacion[0] : t.obligacion
                return oblig?.proceso?.some((p) => p.proceso_id === procesoId)
            })

            const tareaIds = tareasFiltradas.map((t) => t.tarea_id)

            if (tareaIds.length === 0) {
                setError('No hay tareas completadas en el rango de fechas seleccionado')
                setLoading(false)
                return
            }

            // 3. Obtener tarea_steps completados
            const { data: steps, error: stepsError } = await supabase
                .from('tarea_step')
                .select('proceso_paso_id, created_at, completado_at, tarea_id')
                .in('tarea_id', tareaIds)
                .eq('completado', true)
                .not('completado_at', 'is', null)

            if (stepsError) throw stepsError

            // 4. Calcular métricas por paso
            const metricasPorPaso: PasoMetrica[] = pasos.map(paso => {
                // Filtrar steps de este paso
                const stepsDelPaso = ((steps || []) as TareaStepData[]).filter((s) => s.proceso_paso_id === paso.paso_id)

                if (stepsDelPaso.length === 0) {
                    return {
                        paso_id: paso.paso_id,
                        nombre: paso.nombre,
                        orden: paso.orden,
                        tiempoPromedio: 0,
                        tiempoMinimo: 0,
                        tiempoMaximo: 0,
                        desviacionEstandar: 0,
                        cantidadTareas: 0,
                        esCuelloBotella: false
                    }
                }

                // Calcular tiempos en horas
                const tiempos = stepsDelPaso.map((s) => {
                    const inicio = new Date(s.created_at).getTime()
                    const fin = new Date(s.completado_at!).getTime()
                    return (fin - inicio) / (1000 * 60 * 60) // Convertir a horas
                })

                // Estadísticas
                const tiempoPromedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length
                const tiempoMinimo = Math.min(...tiempos)
                const tiempoMaximo = Math.max(...tiempos)

                // Desviación estándar
                const varianza = tiempos.reduce((sum, t) => sum + Math.pow(t - tiempoPromedio, 2), 0) / tiempos.length
                const desviacionEstandar = Math.sqrt(varianza)

                return {
                    paso_id: paso.paso_id,
                    nombre: paso.nombre,
                    orden: paso.orden,
                    tiempoPromedio,
                    tiempoMinimo,
                    tiempoMaximo,
                    desviacionEstandar,
                    cantidadTareas: tiempos.length,
                    esCuelloBotella: false // Se calculará después
                }
            })

            // 5. Identificar cuellos de botella
            const metricasConDatos = metricasPorPaso.filter(m => m.cantidadTareas > 0)
            if (metricasConDatos.length > 0) {
                metricasConDatos.forEach(m => {
                    // Un paso es cuello de botella si su tiempo promedio > promedio + 1 desviación estándar
                    m.esCuelloBotella = m.tiempoPromedio > (m.tiempoPromedio + m.desviacionEstandar)
                })
            }

            setMetricas(metricasPorPaso)
        } catch (err) {
            console.error('Error al cargar métricas:', err)
            setError('Error al cargar los datos de análisis')
        } finally {
            setLoading(false)
        }
    }, [supabase, procesoId, fechaInicio, fechaFin])

    useEffect(() => {
        if (procesoId && fechaInicio && fechaFin) {
            cargarMetricas()
        }
    }, [procesoId, fechaInicio, fechaFin, cargarMetricas])

    function formatearTiempo(horas: number): string {
        if (horas === 0) return 'N/A'
        if (horas < 1) {
            return `${Math.round(horas * 60)} min`
        } else if (horas < 24) {
            return `${horas.toFixed(1)} h`
        } else {
            const dias = Math.floor(horas / 24)
            const horasRestantes = Math.round(horas % 24)
            return `${dias}d ${horasRestantes}h`
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-slate-500">Analizando tiempos de ejecución...</p>
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

    if (metricas.length === 0) {
        return (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 border-dashed">
                <Activity className="text-slate-400 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-medium text-slate-900">No hay datos disponibles</h3>
                <p className="text-slate-500 mt-2">Selecciona un proceso y rango de fechas para ver el análisis</p>
            </div>
        )
    }

    // Calcular el tiempo máximo para las barras de progreso
    const tiempoMaximoGlobal = Math.max(...metricas.map(m => m.tiempoPromedio))

    // Estadísticas generales
    const metricasConDatos = metricas.filter(m => m.cantidadTareas > 0)
    const cuellosDeBotellaCount = metricasConDatos.filter(m => m.esCuelloBotella).length

    return (
        <div className="space-y-6">
            {/* Resumen de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-600 text-white rounded-lg">
                            <Activity size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Pasos Analizados</p>
                            <p className="text-2xl font-bold text-purple-900">{metricasConDatos.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-lg">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Tiempo Promedio Total</p>
                            <p className="text-2xl font-bold text-blue-900">
                                {formatearTiempo(metricasConDatos.reduce((sum, m) => sum + m.tiempoPromedio, 0))}
                            </p>
                        </div>
                    </div>
                </div>

                <div className={`bg-gradient-to-br rounded-lg p-4 border ${
                    cuellosDeBotellaCount > 0
                        ? 'from-red-50 to-red-100 border-red-200'
                        : 'from-green-50 to-green-100 border-green-200'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 text-white rounded-lg ${
                            cuellosDeBotellaCount > 0 ? 'bg-red-600' : 'bg-green-600'
                        }`}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className={`text-sm font-medium ${
                                cuellosDeBotellaCount > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                                Cuellos de Botella
                            </p>
                            <p className={`text-2xl font-bold ${
                                cuellosDeBotellaCount > 0 ? 'text-red-900' : 'text-green-900'
                            }`}>
                                {cuellosDeBotellaCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de métricas */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    #
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Paso
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Tiempo Promedio
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Mínimo
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Máximo
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Desv. Estándar
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Tareas
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Tiempo Relativo
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {metricas.map((metrica) => (
                                <tr
                                    key={metrica.paso_id}
                                    className={`hover:bg-slate-50 transition-colors ${
                                        metrica.esCuelloBotella ? 'bg-red-50' : ''
                                    }`}
                                >
                                    <td className="px-4 py-4">
                                        <span className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
                                            {metrica.orden}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-900">{metrica.nombre}</span>
                                            {metrica.esCuelloBotella && (
                                                <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                                    <AlertTriangle size={12} />
                                                    Cuello de botella
                                                </span>
                                            )}
                                        </div>
                                        {metrica.cantidadTareas === 0 && (
                                            <span className="text-xs text-slate-400">Sin datos</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`font-semibold ${
                                            metrica.esCuelloBotella ? 'text-red-700' : 'text-slate-900'
                                        }`}>
                                            {formatearTiempo(metrica.tiempoPromedio)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-slate-600">
                                        {formatearTiempo(metrica.tiempoMinimo)}
                                    </td>
                                    <td className="px-4 py-4 text-slate-600">
                                        {formatearTiempo(metrica.tiempoMaximo)}
                                    </td>
                                    <td className="px-4 py-4 text-slate-600">
                                        {formatearTiempo(metrica.desviacionEstandar)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                            {metrica.cantidadTareas}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {metrica.cantidadTareas > 0 && (
                                            <div className="w-full">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                                                        <div
                                                            className={`h-3 rounded-full transition-all ${
                                                                metrica.esCuelloBotella
                                                                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                                                                    : 'bg-gradient-to-r from-purple-500 to-purple-600'
                                                            }`}
                                                            style={{
                                                                width: `${(metrica.tiempoPromedio / tiempoMaximoGlobal) * 100}%`
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500 w-12 text-right">
                                                        {((metrica.tiempoPromedio / tiempoMaximoGlobal) * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sugerencias */}
            {cuellosDeBotellaCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <TrendingUp className="text-amber-600 flex-shrink-0 mt-1" size={20} />
                        <div>
                            <h4 className="font-semibold text-amber-900 mb-2">Recomendaciones</h4>
                            <ul className="space-y-1 text-sm text-amber-800">
                                {metricasConDatos
                                    .filter(m => m.esCuelloBotella)
                                    .map(m => (
                                        <li key={m.paso_id}>
                                            <strong>{m.nombre}:</strong> Este paso toma más tiempo del esperado.
                                            Considera revisar el proceso o asignar más recursos.
                                        </li>
                                    ))
                                }
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
