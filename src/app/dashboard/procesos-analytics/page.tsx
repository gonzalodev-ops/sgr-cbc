'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  Calendar,
  Filter,
  PieChart,
  Activity,
  Zap
} from 'lucide-react'
import { KPICard, KPICardGrid } from '@/components/common/KPICard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TrendIndicator } from '@/components/common/TrendIndicator'
import {
  EstadoTarea,
  ESTADO_TAREA_CONFIG,
  getEstadosFinales,
  getEstadosActivos
} from '@/lib/constants/enums'
import {
  formatearFecha,
  obtenerPeriodoActual,
  obtenerPeriodoAnterior,
  obtenerNombrePeriodo,
  calcularDiasRestantes
} from '@/lib/utils/dateCalculations'

// Types
interface ProcesoOperativo {
  proceso_id: string
  nombre: string
}

interface TareaConProceso {
  tarea_id: string
  estado: EstadoTarea
  fecha_limite_oficial: string
  created_at: string
  updated_at: string
  en_riesgo: boolean
  proceso_nombre: string
  proceso_id: string
}

interface KPIPorProceso {
  proceso_id: string
  proceso_nombre: string
  totalTareas: number
  completadas: number
  enCurso: number
  atrasadas: number
  enRiesgo: number
  tasaCompletacion: number
  tiempoPromedioHoras: number
}

interface DistribucionEstado {
  estado: EstadoTarea
  cantidad: number
  porcentaje: number
}

interface CuelloBotella {
  paso_id: string
  paso_nombre: string
  proceso_nombre: string
  tiempoPromedio: number
  cantidadTareas: number
  esCritico: boolean
}

interface TendenciaMensual {
  periodo: string
  periodoNombre: string
  totalTareas: number
  completadas: number
  tasaCompletacion: number
}

export default function ProcesosAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [procesos, setProcesos] = useState<ProcesoOperativo[]>([])
  const [procesoSeleccionado, setProcesoSeleccionado] = useState<string>('todos')
  const [rangoMeses, setRangoMeses] = useState(3)

  // Data states
  const [kpisPorProceso, setKpisPorProceso] = useState<KPIPorProceso[]>([])
  const [distribucionEstados, setDistribucionEstados] = useState<DistribucionEstado[]>([])
  const [cuellosDeBottella, setCuellosDeBottella] = useState<CuelloBotella[]>([])
  const [tendencias, setTendencias] = useState<TendenciaMensual[]>([])

  // Computed KPIs
  const [kpiGlobal, setKpiGlobal] = useState({
    totalTareas: 0,
    tasaCompletacion: 0,
    tiempoPromedio: 0,
    tareasEnRiesgo: 0,
    tareasAtrasadas: 0,
    deltaTareas: 0,
    deltaTasaCompletacion: 0
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    cargarDatos()
  }, [rangoMeses])

  useEffect(() => {
    if (kpisPorProceso.length > 0) {
      calcularDistribucionEstados()
    }
  }, [procesoSeleccionado, kpisPorProceso])

  async function cargarDatos() {
    setLoading(true)
    try {
      await Promise.all([
        cargarProcesos(),
        cargarKPIsPorProceso(),
        cargarCuellosDeBottella(),
        cargarTendencias()
      ])
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  async function cargarProcesos() {
    const { data } = await supabase
      .from('proceso_operativo')
      .select('proceso_id, nombre')
      .eq('activo', true)
      .order('nombre')

    if (data) {
      setProcesos(data)
    }
  }

  async function cargarKPIsPorProceso() {
    const hoy = new Date()
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - rangoMeses, 1)
    const fechaInicioAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - (rangoMeses * 2), 1)

    // Get all tasks with their process info
    const { data: tareas } = await supabase
      .from('tarea')
      .select(`
        tarea_id,
        estado,
        fecha_limite_oficial,
        created_at,
        updated_at,
        en_riesgo,
        obligacion:id_obligacion (
          nombre_corto,
          obligacion_proceso (
            proceso:proceso_id (
              proceso_id,
              nombre
            )
          )
        )
      `)
      .gte('fecha_limite_oficial', fechaInicio.toISOString())

    // Get previous period tasks for comparison
    const { data: tareasAnterior } = await supabase
      .from('tarea')
      .select('tarea_id, estado')
      .gte('fecha_limite_oficial', fechaInicioAnterior.toISOString())
      .lt('fecha_limite_oficial', fechaInicio.toISOString())

    if (tareas) {
      // Map tasks to their processes
      const tareasPorProceso = new Map<string, TareaConProceso[]>()

      tareas.forEach((tarea: any) => {
        const procesos = tarea.obligacion?.obligacion_proceso || []
        procesos.forEach((op: any) => {
          if (op.proceso) {
            const procesoId = op.proceso.proceso_id
            const procesoNombre = op.proceso.nombre

            if (!tareasPorProceso.has(procesoId)) {
              tareasPorProceso.set(procesoId, [])
            }

            tareasPorProceso.get(procesoId)!.push({
              tarea_id: tarea.tarea_id,
              estado: tarea.estado,
              fecha_limite_oficial: tarea.fecha_limite_oficial,
              created_at: tarea.created_at,
              updated_at: tarea.updated_at,
              en_riesgo: tarea.en_riesgo,
              proceso_nombre: procesoNombre,
              proceso_id: procesoId
            })
          }
        })
      })

      // Calculate KPIs per process
      const estadosFinales = getEstadosFinales()
      const estadosActivos = getEstadosActivos()

      const kpis: KPIPorProceso[] = []
      let totalGlobalTareas = 0
      let totalGlobalCompletadas = 0
      let totalGlobalEnRiesgo = 0
      let totalGlobalAtrasadas = 0
      let totalTiempoCompletacion = 0
      let countTiempo = 0

      tareasPorProceso.forEach((tareasList, procesoId) => {
        const proceso = tareasList[0]?.proceso_nombre || 'Sin nombre'

        const completadas = tareasList.filter(t =>
          estadosFinales.includes(t.estado as EstadoTarea)
        ).length

        const enCurso = tareasList.filter(t =>
          estadosActivos.includes(t.estado as EstadoTarea) &&
          t.estado !== EstadoTarea.BLOQUEADO_CLIENTE
        ).length

        const enRiesgo = tareasList.filter(t => t.en_riesgo).length

        const atrasadas = tareasList.filter(t => {
          const diasRestantes = calcularDiasRestantes(t.fecha_limite_oficial)
          return diasRestantes < 0 && !estadosFinales.includes(t.estado as EstadoTarea)
        }).length

        // Calculate average completion time for completed tasks
        const tareasCompletadas = tareasList.filter(t =>
          estadosFinales.includes(t.estado as EstadoTarea)
        )

        let tiempoPromedio = 0
        if (tareasCompletadas.length > 0) {
          const tiempos = tareasCompletadas.map(t => {
            const inicio = new Date(t.created_at).getTime()
            const fin = new Date(t.updated_at).getTime()
            return (fin - inicio) / (1000 * 60 * 60) // hours
          })
          tiempoPromedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length
          totalTiempoCompletacion += tiempoPromedio * tareasCompletadas.length
          countTiempo += tareasCompletadas.length
        }

        const tasaCompletacion = tareasList.length > 0
          ? (completadas / tareasList.length) * 100
          : 0

        kpis.push({
          proceso_id: procesoId,
          proceso_nombre: proceso,
          totalTareas: tareasList.length,
          completadas,
          enCurso,
          atrasadas,
          enRiesgo,
          tasaCompletacion,
          tiempoPromedioHoras: tiempoPromedio
        })

        totalGlobalTareas += tareasList.length
        totalGlobalCompletadas += completadas
        totalGlobalEnRiesgo += enRiesgo
        totalGlobalAtrasadas += atrasadas
      })

      // Sort by total tasks descending
      kpis.sort((a, b) => b.totalTareas - a.totalTareas)
      setKpisPorProceso(kpis)

      // Calculate deltas with previous period
      const tareasAnteriorCount = tareasAnterior?.length || 0
      const completadasAnterior = tareasAnterior?.filter(t =>
        estadosFinales.includes(t.estado as EstadoTarea)
      ).length || 0
      const tasaAnterior = tareasAnteriorCount > 0
        ? (completadasAnterior / tareasAnteriorCount) * 100
        : 0

      const tasaActual = totalGlobalTareas > 0
        ? (totalGlobalCompletadas / totalGlobalTareas) * 100
        : 0

      setKpiGlobal({
        totalTareas: totalGlobalTareas,
        tasaCompletacion: tasaActual,
        tiempoPromedio: countTiempo > 0 ? totalTiempoCompletacion / countTiempo : 0,
        tareasEnRiesgo: totalGlobalEnRiesgo,
        tareasAtrasadas: totalGlobalAtrasadas,
        deltaTareas: totalGlobalTareas - tareasAnteriorCount,
        deltaTasaCompletacion: Math.round(tasaActual - tasaAnterior)
      })

      // Calculate distribution by status
      calcularDistribucionEstados()
    }
  }

  async function calcularDistribucionEstados() {
    const { data: tareas } = await supabase
      .from('tarea')
      .select(`
        tarea_id,
        estado,
        obligacion:id_obligacion (
          obligacion_proceso (
            proceso_id
          )
        )
      `)

    if (tareas) {
      let tareasFiltradas = tareas

      // Filter by selected process
      if (procesoSeleccionado !== 'todos') {
        tareasFiltradas = tareas.filter((t: any) =>
          t.obligacion?.obligacion_proceso?.some(
            (op: any) => op.proceso_id === procesoSeleccionado
          )
        )
      }

      // Count by status
      const conteoEstados = new Map<EstadoTarea, number>()
      Object.values(EstadoTarea).forEach(estado => {
        conteoEstados.set(estado, 0)
      })

      tareasFiltradas.forEach((t: any) => {
        const estado = t.estado as EstadoTarea
        conteoEstados.set(estado, (conteoEstados.get(estado) || 0) + 1)
      })

      const total = tareasFiltradas.length
      const distribucion: DistribucionEstado[] = []

      conteoEstados.forEach((cantidad, estado) => {
        if (cantidad > 0) {
          distribucion.push({
            estado,
            cantidad,
            porcentaje: total > 0 ? (cantidad / total) * 100 : 0
          })
        }
      })

      // Sort by quantity descending
      distribucion.sort((a, b) => b.cantidad - a.cantidad)
      setDistribucionEstados(distribucion)
    }
  }

  async function cargarCuellosDeBottella() {
    // Get process steps with completion times
    const { data: steps } = await supabase
      .from('tarea_step')
      .select(`
        proceso_paso_id,
        created_at,
        completado_at,
        completado,
        proceso_paso:proceso_paso_id (
          paso_id,
          nombre,
          orden,
          proceso:proceso_id (
            nombre
          )
        )
      `)
      .eq('completado', true)
      .not('completado_at', 'is', null)

    if (steps) {
      // Group by process step and calculate average time
      const tiemposPorPaso = new Map<string, {
        paso_id: string
        paso_nombre: string
        proceso_nombre: string
        tiempos: number[]
      }>()

      steps.forEach((step: any) => {
        if (step.proceso_paso) {
          const pasoId = step.proceso_paso.paso_id
          const pasoNombre = step.proceso_paso.nombre
          const procesoNombre = step.proceso_paso.proceso?.nombre || 'Sin proceso'

          const inicio = new Date(step.created_at).getTime()
          const fin = new Date(step.completado_at).getTime()
          const tiempoHoras = (fin - inicio) / (1000 * 60 * 60)

          if (!tiemposPorPaso.has(pasoId)) {
            tiemposPorPaso.set(pasoId, {
              paso_id: pasoId,
              paso_nombre: pasoNombre,
              proceso_nombre: procesoNombre,
              tiempos: []
            })
          }

          tiemposPorPaso.get(pasoId)!.tiempos.push(tiempoHoras)
        }
      })

      // Calculate averages and identify bottlenecks
      const cuellos: CuelloBotella[] = []
      const promedioGlobal = Array.from(tiemposPorPaso.values())
        .flatMap(p => p.tiempos)
        .reduce((a, b, _, arr) => a + b / arr.length, 0)

      tiemposPorPaso.forEach(data => {
        const promedio = data.tiempos.reduce((a, b) => a + b, 0) / data.tiempos.length
        const esCritico = promedio > promedioGlobal * 1.5 && data.tiempos.length >= 5

        cuellos.push({
          paso_id: data.paso_id,
          paso_nombre: data.paso_nombre,
          proceso_nombre: data.proceso_nombre,
          tiempoPromedio: promedio,
          cantidadTareas: data.tiempos.length,
          esCritico
        })
      })

      // Sort by average time descending and take top 10
      cuellos.sort((a, b) => b.tiempoPromedio - a.tiempoPromedio)
      setCuellosDeBottella(cuellos.slice(0, 10))
    }
  }

  async function cargarTendencias() {
    const tendenciasData: TendenciaMensual[] = []
    const estadosFinales = getEstadosFinales()

    // Get data for last 6 months
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date()
      fecha.setMonth(fecha.getMonth() - i)
      const year = fecha.getFullYear()
      const month = fecha.getMonth()

      const inicioMes = new Date(year, month, 1).toISOString()
      const finMes = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
      const periodo = `${year}-${String(month + 1).padStart(2, '0')}`

      const { data: tareasMes } = await supabase
        .from('tarea')
        .select('tarea_id, estado')
        .gte('fecha_limite_oficial', inicioMes)
        .lte('fecha_limite_oficial', finMes)

      if (tareasMes) {
        const total = tareasMes.length
        const completadas = tareasMes.filter(t =>
          estadosFinales.includes(t.estado as EstadoTarea)
        ).length

        tendenciasData.push({
          periodo,
          periodoNombre: obtenerNombrePeriodo(periodo),
          totalTareas: total,
          completadas,
          tasaCompletacion: total > 0 ? (completadas / total) * 100 : 0
        })
      }
    }

    setTendencias(tendenciasData)
  }

  function formatearTiempo(horas: number): string {
    if (horas === 0) return 'N/A'
    if (horas < 1) {
      return `${Math.round(horas * 60)} min`
    } else if (horas < 24) {
      return `${horas.toFixed(1)} h`
    } else {
      const dias = Math.floor(horas / 24)
      return `${dias}d`
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Analytics de Procesos</h1>
              <p className="text-slate-500">Cargando datos...</p>
            </div>
          </div>
        </div>
        <KPICardGrid>
          {[1, 2, 3, 4].map(i => (
            <KPICard key={i} title="" value="" loading />
          ))}
        </KPICardGrid>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <BarChart3 size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Analytics de Procesos</h1>
              <p className="text-indigo-200 mt-1">
                KPIs y metricas por tipo de proceso
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-indigo-200">Periodo</p>
              <p className="text-lg font-semibold">
                Ultimos {rangoMeses} meses
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filtros:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Proceso:</label>
            <select
              value={procesoSeleccionado}
              onChange={(e) => setProcesoSeleccionado(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="todos">Todos los procesos</option>
              {procesos.map(p => (
                <option key={p.proceso_id} value={p.proceso_id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Rango:</label>
            <select
              value={rangoMeses}
              onChange={(e) => setRangoMeses(Number(e.target.value))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value={1}>Ultimo mes</option>
              <option value={3}>Ultimos 3 meses</option>
              <option value={6}>Ultimos 6 meses</option>
              <option value={12}>Ultimo ano</option>
            </select>
          </div>
        </div>
      </div>

      {/* Global KPIs */}
      <KPICardGrid columns={5}>
        <KPICard
          title="Total Tareas"
          value={kpiGlobal.totalTareas}
          icon={<Target size={24} />}
          trend={{
            value: kpiGlobal.deltaTareas,
            direction: kpiGlobal.deltaTareas > 0 ? 'up' : kpiGlobal.deltaTareas < 0 ? 'down' : 'neutral',
            label: 'vs anterior'
          }}
          variant="default"
        />
        <KPICard
          title="Tasa Completacion"
          value={kpiGlobal.tasaCompletacion.toFixed(1)}
          valueIsPercent
          icon={<CheckCircle size={24} />}
          trend={{
            value: kpiGlobal.deltaTasaCompletacion,
            direction: kpiGlobal.deltaTasaCompletacion > 0 ? 'up' : kpiGlobal.deltaTasaCompletacion < 0 ? 'down' : 'neutral'
          }}
          variant="success"
          progress={kpiGlobal.tasaCompletacion}
        />
        <KPICard
          title="Tiempo Promedio"
          value={formatearTiempo(kpiGlobal.tiempoPromedio)}
          subtitle="Por tarea completada"
          icon={<Clock size={24} />}
          variant="default"
        />
        <KPICard
          title="Tareas en Riesgo"
          value={kpiGlobal.tareasEnRiesgo}
          subtitle="Requieren atencion"
          icon={<AlertTriangle size={24} />}
          variant={kpiGlobal.tareasEnRiesgo > 0 ? 'warning' : 'default'}
        />
        <KPICard
          title="Tareas Atrasadas"
          value={kpiGlobal.tareasAtrasadas}
          subtitle="Fecha limite vencida"
          icon={<AlertTriangle size={24} />}
          variant={kpiGlobal.tareasAtrasadas > 0 ? 'danger' : 'success'}
        />
      </KPICardGrid>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPIs by Process */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">KPIs por Proceso</h2>
          </div>

          {kpisPorProceso.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No hay datos disponibles
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {kpisPorProceso.map((kpi) => (
                <div
                  key={kpi.proceso_id}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-800">{kpi.proceso_nombre}</h3>
                    <span className="text-sm text-slate-500">{kpi.totalTareas} tareas</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xs text-slate-500">Completadas</p>
                      <p className="font-bold text-green-600">{kpi.completadas}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">En curso</p>
                      <p className="font-bold text-blue-600">{kpi.enCurso}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Atrasadas</p>
                      <p className={`font-bold ${kpi.atrasadas > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {kpi.atrasadas}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">% Completado</p>
                      <p className={`font-bold ${
                        kpi.tasaCompletacion >= 80 ? 'text-green-600' :
                        kpi.tasaCompletacion >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {kpi.tasaCompletacion.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        kpi.tasaCompletacion >= 80 ? 'bg-green-500' :
                        kpi.tasaCompletacion >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${kpi.tasaCompletacion}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribution by Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Distribucion por Estado</h2>
          </div>

          {distribucionEstados.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No hay datos disponibles
            </div>
          ) : (
            <div className="space-y-3">
              {distribucionEstados.map((item) => {
                const config = ESTADO_TAREA_CONFIG[item.estado]
                return (
                  <div key={item.estado} className="flex items-center gap-3">
                    <StatusBadge
                      status={item.estado}
                      type="estado"
                      size="sm"
                      showIcon={false}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600">{item.cantidad} tareas</span>
                        <span className="font-medium text-slate-800">
                          {item.porcentaje.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${config?.bgColor?.replace('bg-', 'bg-') || 'bg-slate-400'}`}
                          style={{
                            width: `${item.porcentaje}%`,
                            backgroundColor: config?.bgColor?.includes('green') ? '#22c55e' :
                              config?.bgColor?.includes('blue') ? '#3b82f6' :
                              config?.bgColor?.includes('yellow') ? '#eab308' :
                              config?.bgColor?.includes('red') ? '#ef4444' :
                              config?.bgColor?.includes('purple') ? '#a855f7' : '#64748b'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-indigo-600" size={20} />
          <h2 className="text-lg font-semibold text-slate-800">Tendencias de Completacion</h2>
        </div>

        {tendencias.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No hay datos disponibles
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {tendencias.map((t, idx) => {
              const tendenciaAnterior = idx > 0 ? tendencias[idx - 1].tasaCompletacion : t.tasaCompletacion
              const delta = t.tasaCompletacion - tendenciaAnterior

              return (
                <div
                  key={t.periodo}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center"
                >
                  <p className="text-xs text-slate-500 mb-1">{t.periodoNombre}</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {t.tasaCompletacion.toFixed(0)}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.completadas}/{t.totalTareas}
                  </p>
                  {idx > 0 && (
                    <div className="mt-2">
                      <TrendIndicator
                        value={Math.round(delta)}
                        direction={delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral'}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottlenecks */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="text-amber-600" size={20} />
          <h2 className="text-lg font-semibold text-slate-800">
            Pasos con Mayor Tiempo (Cuellos de Botella)
          </h2>
        </div>

        {cuellosDeBottella.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No hay datos suficientes para identificar cuellos de botella
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Paso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Proceso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Tiempo Promedio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Tareas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cuellosDeBottella.map((cuello, idx) => (
                  <tr
                    key={cuello.paso_id}
                    className={`hover:bg-slate-50 ${cuello.esCritico ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-800">{cuello.paso_nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{cuello.proceso_nombre}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${cuello.esCritico ? 'text-red-600' : 'text-slate-800'}`}>
                        {formatearTiempo(cuello.tiempoPromedio)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {cuello.cantidadTareas}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {cuello.esCritico ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                          <AlertTriangle size={12} />
                          Critico
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recommendations */}
        {cuellosDeBottella.some(c => c.esCritico) && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">Recomendaciones</h4>
                <ul className="space-y-1 text-sm text-amber-800">
                  {cuellosDeBottella.filter(c => c.esCritico).map(c => (
                    <li key={c.paso_id}>
                      <strong>{c.paso_nombre}</strong> en <strong>{c.proceso_nombre}</strong>:
                      {' '}Considere revisar el proceso o asignar mas recursos para reducir el tiempo de{' '}
                      {formatearTiempo(c.tiempoPromedio)}.
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
