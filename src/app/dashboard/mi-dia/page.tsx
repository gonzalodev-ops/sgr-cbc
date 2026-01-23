'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  CalendarDays,
  AlertTriangle,
  Clock,
  CheckCircle,
  Play,
  Ban,
  Building2,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Search,
  LayoutGrid,
  Users
} from 'lucide-react'
import { usePeriodo } from '@/lib/context/PeriodoContext'
import {
  calcularDiasRestantes,
  formatearFecha,
  obtenerPeriodoActual,
  obtenerPeriodoAnterior,
  obtenerNombrePeriodo,
  obtenerCategoriaPrioridad,
  obtenerOrdenPrioridad,
  CategoriaPrioridadFecha
} from '@/lib/utils/dateCalculations'
import { normalizeRelation } from '@/lib/utils/dataTransformers'
import QuickActions from '@/components/tarea/QuickActions'
import TaskDetailModal from '@/components/tarea/TaskDetailModal'

interface TareaMiDia {
  tarea_id: string
  estado: string
  fecha_limite_oficial: string
  prioridad: string
  periodo_fiscal: string
  cliente: {
    nombre_comercial: string
  }
  contribuyente: {
    rfc: string
  }
  obligacion: {
    nombre_corto: string
  }
}

interface ColaboradorInfo {
  nombre: string
  equipo: string
}

type PrioridadCategoria = 'vencidas' | 'hoy' | 'proximos3dias' | 'bloqueadas' | 'resto'

interface TareaConCategoria extends TareaMiDia {
  categoria: PrioridadCategoria
  ordenPrioridad: number
  fechaLimiteDate: Date
  periodoTipo: 'conclusion' | 'corriente'
}

export default function MiDiaPage() {
  const [tareas, setTareas] = useState<TareaMiDia[]>([])
  const [colaboradorInfo, setColaboradorInfo] = useState<ColaboradorInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [actualizando, setActualizando] = useState<string | null>(null)
  const [seccionConclusionExpandida, setSeccionConclusionExpandida] = useState(true)
  const [seccionCorrienteExpandida, setSeccionCorrienteExpandida] = useState(true)
  const [selectedTareaId, setSelectedTareaId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  // MEJORA-002: Toggle grouping (urgencia vs cliente)
  const [groupBy, setGroupBy] = useState<'urgencia' | 'cliente'>('urgencia')
  // MEJORA-003: Quick search by RFC or cliente
  const [searchTerm, setSearchTerm] = useState('')

  const { periodoEnConclusion, periodoCorriente, getPeriodoLabel } = usePeriodo()

  // Fallback para periodos si el contexto aun no esta listo
  const periodoAnterior = periodoEnConclusion || obtenerPeriodoAnterior()
  const periodoActual = periodoCorriente || obtenerPeriodoActual()

  useEffect(() => {
    loadDatos()
  }, [])

  async function loadDatos() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      setLoading(true)

      // 1. Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('Error obteniendo usuario:', userError)
        setLoading(false)
        return
      }

      // 2. Obtener información del usuario
      const { data: userData } = await supabase
        .from('users')
        .select(`
          nombre,
          team_members (
            teams:team_id (nombre)
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (userData) {
        const teamsData = userData.team_members?.[0]?.teams as any
        const equipoNombre = Array.isArray(teamsData) ? teamsData[0]?.nombre : teamsData?.nombre
        setColaboradorInfo({
          nombre: userData.nombre,
          equipo: equipoNombre || 'Sin equipo'
        })
      }

      // 3. Cargar tareas del usuario (solo pendientes o en curso)
      const { data: tareasData, error: tareasError } = await supabase
        .from('tarea')
        .select(`
          tarea_id,
          estado,
          fecha_limite_oficial,
          prioridad,
          periodo_fiscal,
          cliente:cliente_id(nombre_comercial),
          contribuyente:contribuyente_id(rfc),
          obligacion:id_obligacion(nombre_corto)
        `)
        .eq('responsable_usuario_id', user.id)
        .not('estado', 'in', '("presentado","pagado","cerrado")')
        .order('fecha_limite_oficial', { ascending: true })

      if (tareasError) {
        console.error('Error cargando tareas:', tareasError)
      } else {
        // Transformar datos de Supabase (relaciones vienen como arrays)
        setTareas(tareasData?.map((t: any) => ({
          ...t,
          cliente: normalizeRelation(t.cliente),
          contribuyente: normalizeRelation(t.contribuyente),
          obligacion: normalizeRelation(t.obligacion),
        })) || [])
      }

    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // MEJORA-003: Filter tasks by search term
  const tareasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return tareas
    const term = searchTerm.toLowerCase().trim()
    return tareas.filter(t =>
      t.contribuyente?.rfc?.toLowerCase().includes(term) ||
      t.cliente?.nombre_comercial?.toLowerCase().includes(term)
    )
  }, [tareas, searchTerm])

  // Algoritmo de priorización y agrupación por periodo
  const { tareasConclusion, tareasCorriente, contadores } = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // Clasificar tareas por periodo y prioridad (usando tareas filtradas)
    const categorizadas: TareaConCategoria[] = tareasFiltradas.map(tarea => {
      const fechaLimite = new Date(tarea.fecha_limite_oficial)
      fechaLimite.setHours(0, 0, 0, 0)

      const estaBloqueada = tarea.estado === 'bloqueado_cliente'
      const categoria = obtenerCategoriaPrioridad(fechaLimite, estaBloqueada)
      const ordenPrioridad = obtenerOrdenPrioridad(categoria)

      // Determinar si es del periodo anterior o actual basandose en periodo_fiscal
      const periodoTipo: 'conclusion' | 'corriente' =
        tarea.periodo_fiscal && tarea.periodo_fiscal < periodoActual
          ? 'conclusion'
          : 'corriente'

      return {
        ...tarea,
        categoria,
        ordenPrioridad,
        fechaLimiteDate: fechaLimite,
        periodoTipo
      }
    })

    // Separar tareas por periodo
    // BUG-001 FIX: Tareas vencidas van SIEMPRE a conclusión (URGENTE), no a corriente
    const tareasConclusion = categorizadas
      .filter(t => t.periodoTipo === 'conclusion' || t.categoria === 'vencidas')
      .sort((a, b) => {
        if (a.ordenPrioridad !== b.ordenPrioridad) {
          return a.ordenPrioridad - b.ordenPrioridad
        }
        return a.fechaLimiteDate.getTime() - b.fechaLimiteDate.getTime()
      })

    const tareasCorriente = categorizadas
      .filter(t => t.periodoTipo === 'corriente' && t.categoria !== 'vencidas')
      .sort((a, b) => {
        if (a.ordenPrioridad !== b.ordenPrioridad) {
          return a.ordenPrioridad - b.ordenPrioridad
        }
        return a.fechaLimiteDate.getTime() - b.fechaLimiteDate.getTime()
      })

    // Contadores generales
    const contadores = {
      vencidas: categorizadas.filter(t => t.categoria === 'vencidas').length,
      hoy: categorizadas.filter(t => t.categoria === 'hoy').length,
      proximos3dias: categorizadas.filter(t => t.categoria === 'proximos3dias').length,
      bloqueadas: categorizadas.filter(t => t.categoria === 'bloqueadas').length,
      totalConclusion: tareasConclusion.length,
      totalCorriente: tareasCorriente.length,
      total: categorizadas.length
    }

    return { tareasConclusion, tareasCorriente, contadores }
  }, [tareasFiltradas, periodoActual])

  // MEJORA-002: Group tasks by client when groupBy is 'cliente'
  const tareasPorCliente = useMemo(() => {
    if (groupBy !== 'cliente') return null

    const allTareas = [...tareasConclusion, ...tareasCorriente]
    const grouped = new Map<string, TareaConCategoria[]>()

    allTareas.forEach(tarea => {
      const clienteNombre = tarea.cliente?.nombre_comercial || 'Sin Cliente'
      if (!grouped.has(clienteNombre)) {
        grouped.set(clienteNombre, [])
      }
      grouped.get(clienteNombre)!.push(tarea)
    })

    // Sort clients by number of tasks (descending) and sort tasks within each client by priority
    return Array.from(grouped.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([cliente, tareas]) => ({
        cliente,
        tareas: tareas.sort((a, b) => a.ordenPrioridad - b.ordenPrioridad)
      }))
  }, [tareasConclusion, tareasCorriente, groupBy])

  // Cambiar estado de tarea
  async function cambiarEstado(tareaId: string, nuevoEstado: string) {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      setActualizando(tareaId)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Obtener estado anterior
      const tareaActual = tareas.find(t => t.tarea_id === tareaId)
      const estadoAnterior = tareaActual?.estado || 'pendiente'

      // Actualizar tarea
      const { error: updateError } = await supabase
        .from('tarea')
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq('tarea_id', tareaId)

      if (updateError) {
        console.error('Error actualizando tarea:', updateError)
        return
      }

      // Registrar evento
      await supabase
        .from('tarea_evento')
        .insert({
          tarea_id: tareaId,
          tipo_evento: 'cambio_estado',
          estado_anterior: estadoAnterior,
          estado_nuevo: nuevoEstado,
          actor_usuario_id: user.id,
          occurred_at: new Date().toISOString()
        })

      // Recargar datos
      await loadDatos()

    } catch (err) {
      console.error('Error:', err)
    } finally {
      setActualizando(null)
    }
  }

  function handleComplete(tareaId: string) {
    const tarea = tareas.find(t => t.tarea_id === tareaId)
    if (!tarea) return

    // Determinar siguiente estado basado en el actual
    if (tarea.estado === 'pendiente') {
      cambiarEstado(tareaId, 'en_curso')
    } else if (tarea.estado === 'en_curso') {
      cambiarEstado(tareaId, 'pendiente_evidencia')
    } else if (tarea.estado === 'pendiente_evidencia' || tarea.estado === 'rechazado') {
      cambiarEstado(tareaId, 'en_validacion')
    }
  }

  function handleViewDetail(tareaId: string) {
    setSelectedTareaId(tareaId)
    setIsModalOpen(true)
  }

  function getIndicadorUrgencia(categoria: PrioridadCategoria, fechaLimite: string) {
    const diasRestantes = calcularDiasRestantes(fechaLimite)

    switch (categoria) {
      case 'vencidas':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            <AlertTriangle size={16} className="flex-shrink-0" />
            <span className="font-bold text-sm">VENCIDA ({Math.abs(diasRestantes)}d)</span>
          </div>
        )
      case 'hoy':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 border border-orange-300 text-orange-700 rounded-lg">
            <Clock size={16} className="flex-shrink-0" />
            <span className="font-bold text-sm">HOY</span>
          </div>
        )
      case 'proximos3dias':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-lg">
            <Clock size={16} className="flex-shrink-0" />
            <span className="font-bold text-sm">{diasRestantes} DIA{diasRestantes > 1 ? 'S' : ''}</span>
          </div>
        )
      case 'bloqueadas':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 border border-purple-300 text-purple-700 rounded-lg">
            <Ban size={16} className="flex-shrink-0" />
            <span className="font-bold text-sm">BLOQUEADA</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-600 rounded-lg">
            <CalendarDays size={16} className="flex-shrink-0" />
            <span className="font-medium text-sm">{diasRestantes}d</span>
          </div>
        )
    }
  }

  function getEstadoBadge(estado: string) {
    const config: Record<string, { label: string; className: string }> = {
      pendiente: { label: 'Pendiente', className: 'bg-slate-100 text-slate-700' },
      en_curso: { label: 'En Curso', className: 'bg-blue-100 text-blue-700' },
      pendiente_evidencia: { label: 'Pend. Evidencia', className: 'bg-purple-100 text-purple-700' },
      en_validacion: { label: 'En Validacion', className: 'bg-yellow-100 text-yellow-700' },
      bloqueado_cliente: { label: 'Bloqueado', className: 'bg-red-100 text-red-700' },
      rechazado: { label: 'Rechazado', className: 'bg-red-100 text-red-700' }
    }

    const { label, className } = config[estado] || { label: estado, className: 'bg-slate-100 text-slate-700' }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${className}`}>
        {label}
      </span>
    )
  }

  function getBorderColor(categoria: PrioridadCategoria) {
    switch (categoria) {
      case 'vencidas': return 'border-l-4 border-l-red-500'
      case 'hoy': return 'border-l-4 border-l-orange-500'
      case 'proximos3dias': return 'border-l-4 border-l-yellow-500'
      case 'bloqueadas': return 'border-l-4 border-l-purple-500'
      default: return 'border-l-4 border-l-slate-300'
    }
  }

  // Renderizar lista de tareas
  function renderTareasList(tareas: TareaConCategoria[], startIndex: number = 1) {
    return tareas.map((tarea, index) => (
      <div
        key={tarea.tarea_id}
        className={`p-4 hover:bg-slate-50 transition-colors ${getBorderColor(tarea.categoria)}`}
      >
        <div className="flex items-center gap-4">
          {/* Numero de orden */}
          <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-slate-600">{startIndex + index}</span>
          </div>

          {/* Informacion de la tarea */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={14} className="text-slate-400 flex-shrink-0" />
              <span className="font-semibold text-slate-800 truncate">
                {tarea.cliente?.nombre_comercial || 'Sin cliente'}
              </span>
              <span className="text-slate-400">-</span>
              <span className="text-sm text-slate-600 font-mono truncate">
                {tarea.contribuyente?.rfc || 'Sin RFC'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                {tarea.obligacion?.nombre_corto || 'Sin obligacion'}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500">
                Vence: {formatearFecha(tarea.fecha_limite_oficial, 'corto')}
              </span>
            </div>
          </div>

          {/* Estado actual */}
          <div className="flex-shrink-0">
            {getEstadoBadge(tarea.estado)}
          </div>

          {/* Indicador de urgencia */}
          <div className="flex-shrink-0">
            {getIndicadorUrgencia(tarea.categoria, tarea.fecha_limite_oficial)}
          </div>

          {/* Acciones rapidas */}
          <div className="flex-shrink-0">
            <QuickActions
              tareaId={tarea.tarea_id}
              estadoActual={tarea.estado}
              onComplete={handleComplete}
              onViewDetail={handleViewDetail}
              isLoading={actualizando === tarea.tarea_id}
            />
          </div>
        </div>
      </div>
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Cargando tu dia...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 shadow-lg text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <CalendarDays size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Mi Dia</h1>
              <p className="text-blue-100">
                {colaboradorInfo?.nombre || 'Colaborador'} - {colaboradorInfo?.equipo || 'Sin equipo'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-200">
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            <p className="text-3xl font-bold mt-1">{contadores.total} tareas</p>
          </div>
        </div>
      </div>

      {/* KPIs de urgencia */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{contadores.vencidas}</p>
              <p className="text-xs text-slate-500 uppercase font-bold">Vencidas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{contadores.hoy}</p>
              <p className="text-xs text-slate-500 uppercase font-bold">Hoy</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{contadores.proximos3dias}</p>
              <p className="text-xs text-slate-500 uppercase font-bold">Prox. 3 dias</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Ban size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{contadores.bloqueadas}</p>
              <p className="text-xs text-slate-500 uppercase font-bold">Bloqueadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* MEJORA-002 & MEJORA-003: Toolbar with search and grouping toggle */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por RFC o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Grouping toggle */}
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setGroupBy('urgencia')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              groupBy === 'urgencia'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid size={16} />
            <span>Por Urgencia</span>
          </button>
          <button
            onClick={() => setGroupBy('cliente')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              groupBy === 'cliente'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={16} />
            <span>Por Cliente</span>
          </button>
        </div>
      </div>

      {/* Conditional rendering based on groupBy */}
      {groupBy === 'urgencia' ? (
        <>
          {/* Seccion EN CONCLUSION - Mes anterior */}
      {contadores.totalConclusion > 0 && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 overflow-hidden">
          <button
            onClick={() => setSeccionConclusionExpandida(!seccionConclusionExpandida)}
            className="w-full px-6 py-4 bg-red-50 border-b border-red-200 flex items-center justify-between hover:bg-red-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 text-white rounded-lg">
                <AlertCircle size={20} />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-red-800">
                  URGENTE: EN CONCLUSION ({getPeriodoLabel ? getPeriodoLabel(periodoAnterior) : obtenerNombrePeriodo(periodoAnterior)})
                </h2>
                <p className="text-sm text-red-600">
                  Tareas del mes anterior que deben cerrarse ESTA SEMANA
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold">
                {contadores.totalConclusion} tareas
              </span>
              {seccionConclusionExpandida ? (
                <ChevronUp size={20} className="text-red-600" />
              ) : (
                <ChevronDown size={20} className="text-red-600" />
              )}
            </div>
          </button>

          {seccionConclusionExpandida && (
            <div className="divide-y divide-slate-100">
              {tareasConclusion.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="mx-auto mb-4 text-green-500" size={40} />
                  <p className="text-slate-600">Todas las tareas del mes anterior estan cerradas</p>
                </div>
              ) : (
                renderTareasList(tareasConclusion, 1)
              )}
            </div>
          )}
        </div>
      )}

      {/* Seccion CORRIENTE - Mes actual */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <button
          onClick={() => setSeccionCorrienteExpandida(!seccionCorrienteExpandida)}
          className="w-full px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 text-white rounded-lg">
              <FileText size={20} />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold text-slate-800">
                CORRIENTE ({getPeriodoLabel ? getPeriodoLabel(periodoActual) : obtenerNombrePeriodo(periodoActual)})
              </h2>
              <p className="text-sm text-slate-500">
                Tareas del mes actual ordenadas por prioridad
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-bold">
              {contadores.totalCorriente} tareas
            </span>
            {seccionCorrienteExpandida ? (
              <ChevronUp size={20} className="text-slate-600" />
            ) : (
              <ChevronDown size={20} className="text-slate-600" />
            )}
          </div>
        </button>

        {seccionCorrienteExpandida && (
          <div className="divide-y divide-slate-100">
            {tareasCorriente.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
                <h3 className="text-lg font-medium text-slate-800 mb-2">No tienes tareas pendientes</h3>
                <p className="text-slate-500">Todas tus tareas estan completadas o no tienes tareas asignadas.</p>
              </div>
            ) : (
              renderTareasList(tareasCorriente, contadores.totalConclusion + 1)
            )}
          </div>
        )}
      </div>
        </>
      ) : (
        /* MEJORA-002: Client grouping view */
        <div className="space-y-4">
          {tareasPorCliente && tareasPorCliente.length > 0 ? (
            tareasPorCliente.map(({ cliente, tareas }) => (
              <div key={cliente} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500 text-white rounded-lg">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">{cliente}</h2>
                      <p className="text-sm text-slate-500">{tareas.length} tarea{tareas.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {renderTareasList(tareas, 1)}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
              <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
              <h3 className="text-lg font-medium text-slate-800 mb-2">No hay tareas</h3>
              <p className="text-slate-500">No se encontraron tareas con los filtros actuales.</p>
            </div>
          )}
        </div>
      )}

      {/* Leyenda */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="text-xs text-slate-500 uppercase font-bold mb-3">Leyenda de Prioridad</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-slate-600">Vencidas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-slate-600">Vencen hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-slate-600">Proximos 3 dias</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-slate-600">Bloqueadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-300 rounded"></div>
            <span className="text-slate-600">Resto (por fecha)</span>
          </div>
        </div>
      </div>

      {/* Modal de detalle de tarea */}
      <TaskDetailModal
        tareaId={selectedTareaId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTareaId(null)
        }}
        onStateChange={loadDatos}
      />
    </div>
  )
}
