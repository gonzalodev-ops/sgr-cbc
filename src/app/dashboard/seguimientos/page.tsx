'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  TrendingUp,
  Clock,
  Filter,
  Plus,
  CheckCircle,
  AlertTriangle,
  Calendar,
  CreditCard,
  FileText,
  RotateCcw,
  X,
  Shield,
  Check
} from 'lucide-react'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { KPICard, KPICardGrid } from '@/components/common/KPICard'
import {
  CategoriaSeguimiento,
  PrioridadSeguimiento
} from '@/lib/constants/enums'
import { formatearFecha, diferenciaEnDias, formatearFechaHora } from '@/lib/utils/dateCalculations'

interface TareaInfo {
  tarea_id: string
  cliente?: {
    nombre_comercial: string
  }
  obligacion?: {
    nombre_corto: string
  }
  responsable?: {
    nombre: string
  }
}

interface Seguimiento {
  seguimiento_id: string
  tarea_id: string
  categoria: CategoriaSeguimiento
  descripcion: string
  prioridad: PrioridadSeguimiento
  fecha_creacion: string
  fecha_recordatorio: string | null
  cerrado: boolean
  fecha_cierre: string | null
  evidencia_cierre: string | null
  tarea?: TareaInfo
}

interface NuevoSeguimientoData {
  tarea_id: string
  categoria: CategoriaSeguimiento
  descripcion: string
  prioridad: PrioridadSeguimiento
  fecha_recordatorio: string
}

interface TareaQueryRecord {
  tarea_id: string
  cliente: { nombre_comercial: string } | { nombre_comercial: string }[] | null
  obligacion: { nombre_corto: string } | { nombre_corto: string }[] | null
  responsable: { nombre: string } | { nombre: string }[] | null
}

interface SeguimientoRecord {
  seguimiento_id: string
  tarea_id: string
  categoria: CategoriaSeguimiento
  descripcion: string
  prioridad: PrioridadSeguimiento
  fecha_creacion: string
  fecha_recordatorio: string | null
  cerrado: boolean
  fecha_cierre: string | null
  evidencia_cierre: string | null
}

interface TeamMemberRecord {
  user_id: string
}

interface NuevoSeguimientoModalProps {
  tareasDisponibles: TareaInfo[]
  onClose: () => void
  onSave: (data: NuevoSeguimientoData) => Promise<void>
}

function NuevoSeguimientoModal({ tareasDisponibles, onClose, onSave }: NuevoSeguimientoModalProps) {
  const [form, setForm] = useState({
    tarea_id: '',
    categoria: 'PAGO' as CategoriaSeguimiento,
    descripcion: '',
    prioridad: 'MEDIA' as PrioridadSeguimiento,
    fecha_recordatorio: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.tarea_id || !form.descripcion.trim()) return

    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } catch (error) {
      console.error('Error creating seguimiento:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Nuevo Seguimiento</h2>
            <p className="text-sm text-slate-500">Crea un recordatorio de seguimiento</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tarea */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tarea Relacionada <span className="text-red-500">*</span>
            </label>
            <select
              value={form.tarea_id}
              onChange={(e) => setForm({ ...form, tarea_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar tarea...</option>
              {tareasDisponibles.map(t => (
                <option key={t.tarea_id} value={t.tarea_id}>
                  {t.cliente?.nombre_comercial} - {t.obligacion?.nombre_corto}
                </option>
              ))}
            </select>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Categoria <span className="text-red-500">*</span>
            </label>
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value as CategoriaSeguimiento })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PAGO">Pago</option>
              <option value="TRAMITE">Tramite</option>
              <option value="CAMBIO">Cambio</option>
              <option value="DOCUMENTACION">Documentacion</option>
              <option value="REQUERIMIENTO">Requerimiento</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
            <div className="flex gap-2">
              {['ALTA', 'MEDIA', 'BAJA'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, prioridad: p as PrioridadSeguimiento })}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    form.prioridad === p
                      ? p === 'ALTA' ? 'bg-red-100 border-red-300 text-red-700' :
                        p === 'MEDIA' ? 'bg-yellow-100 border-yellow-300 text-yellow-700' :
                        'bg-green-100 border-green-300 text-green-700'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Descripcion */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripcion <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Describe el seguimiento necesario..."
              required
            />
          </div>

          {/* Fecha Recordatorio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fecha Recordatorio (opcional)
            </label>
            <input
              type="date"
              value={form.fecha_recordatorio}
              onChange={(e) => setForm({ ...form, fecha_recordatorio: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading || !form.tarea_id || !form.descripcion.trim()}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus size={18} />
                  Crear Seguimiento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface CerrarSeguimientoModalProps {
  seguimiento: Seguimiento
  onClose: () => void
  onCerrar: (seguimientoId: string, evidencia: string) => Promise<void>
}

function CerrarSeguimientoModal({ seguimiento, onClose, onCerrar }: CerrarSeguimientoModalProps) {
  const [evidencia, setEvidencia] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!evidencia.trim()) return

    setLoading(true)
    try {
      await onCerrar(seguimiento.seguimiento_id, evidencia)
      onClose()
    } catch (error) {
      console.error('Error closing seguimiento:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Cerrar Seguimiento</h2>
            <p className="text-sm text-slate-500">Registra la evidencia de cierre</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info del seguimiento */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-600">{seguimiento.descripcion}</p>
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {formatearFecha(seguimiento.fecha_creacion, 'corto')}
              </span>
              <span className={`px-2 py-0.5 rounded ${
                seguimiento.prioridad === 'ALTA' ? 'bg-red-100 text-red-700' :
                seguimiento.prioridad === 'MEDIA' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {seguimiento.prioridad}
              </span>
            </div>
          </div>

          {/* Evidencia */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Evidencia de Cierre <span className="text-red-500">*</span>
            </label>
            <textarea
              value={evidencia}
              onChange={(e) => setEvidencia(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Describe como se resolvio este seguimiento, numero de referencia, confirmacion recibida, etc..."
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading || !evidencia.trim()}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={18} />
                  Cerrar Seguimiento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Category icons and colors
const CATEGORIA_CONFIG: Record<CategoriaSeguimiento, { icon: React.ComponentType<{ size?: number; className?: string }>; bgColor: string; textColor: string }> = {
  PAGO: { icon: CreditCard, bgColor: 'bg-green-100', textColor: 'text-green-700' },
  TRAMITE: { icon: FileText, bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  CAMBIO: { icon: RotateCcw, bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  DOCUMENTACION: { icon: FileText, bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  REQUERIMIENTO: { icon: AlertTriangle, bgColor: 'bg-red-100', textColor: 'text-red-700' },
  OTRO: { icon: Clock, bgColor: 'bg-slate-100', textColor: 'text-slate-700' }
}

export default function SeguimientosPage() {
  const { rol, isLoading: roleLoading, userId, canManageTeam } = useUserRole()

  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])
  const [tareasEquipo, setTareasEquipo] = useState<TareaInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('all')
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('all')
  const [filtroEstado, setFiltroEstado] = useState<string>('pendientes')
  const [showNuevoModal, setShowNuevoModal] = useState(false)
  const [seguimientoCerrar, setSeguimientoCerrar] = useState<Seguimiento | null>(null)

  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])

  useEffect(() => {
    if (!supabase || !userId || roleLoading) return

    async function fetchData() {
      if (!supabase || !userId) return
      setLoading(true)

      try {
        // Get user's team
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId)
          .eq('activo', true)
          .single()

        if (!teamMember?.team_id) {
          setLoading(false)
          return
        }

        // Get team members
        const { data: membersData } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', teamMember.team_id)
          .eq('activo', true)

        if (!membersData || membersData.length === 0) {
          setLoading(false)
          return
        }

        const memberIds = membersData.map((m: TeamMemberRecord) => m.user_id)

        // Get team's tasks (for creating new seguimientos)
        const { data: tareasData } = await supabase
          .from('tarea')
          .select(`
            tarea_id,
            cliente:cliente_id(nombre_comercial),
            obligacion:id_obligacion(nombre_corto),
            responsable:users!tarea_responsable_usuario_id_fkey(nombre)
          `)
          .in('responsable_usuario_id', memberIds)
          .not('estado', 'in', '("cerrado","pagado")')
          .limit(200)

        const tareasTransformadas: TareaInfo[] = (tareasData || []).map((t: TareaQueryRecord) => ({
          tarea_id: t.tarea_id,
          cliente: Array.isArray(t.cliente) ? t.cliente[0] : t.cliente ?? undefined,
          obligacion: Array.isArray(t.obligacion) ? t.obligacion[0] : t.obligacion ?? undefined,
          responsable: Array.isArray(t.responsable) ? t.responsable[0] : t.responsable ?? undefined,
        }))

        setTareasEquipo(tareasTransformadas)

        // Get seguimientos - using pendiente_seguimiento table
        // Note: If this table doesn't exist, we'll create it or use an alternative
        const { data: seguimientosData, error } = await supabase
          .from('pendiente_seguimiento')
          .select(`
            seguimiento_id,
            tarea_id,
            categoria,
            descripcion,
            prioridad,
            fecha_creacion,
            fecha_recordatorio,
            cerrado,
            fecha_cierre,
            evidencia_cierre
          `)
          .order('fecha_creacion', { ascending: false })
          .limit(200)

        if (error) {
          console.error('Error fetching seguimientos:', error)
          // Table might not exist - create empty state
          setSeguimientos([])
          setLoading(false)
          return
        }

        // Enrich with task data
        const enrichedSeguimientos: Seguimiento[] = (seguimientosData || []).map((s: SeguimientoRecord) => {
          const tarea = tareasTransformadas.find((t: TareaInfo) => t.tarea_id === s.tarea_id)
          return { ...s, tarea }
        })

        setSeguimientos(enrichedSeguimientos)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, userId, roleLoading])

  // KPIs
  const kpis = useMemo(() => {
    const total = seguimientos.length
    const pendientes = seguimientos.filter(s => !s.cerrado).length
    const cerrados = seguimientos.filter(s => s.cerrado).length
    const altaPrioridad = seguimientos.filter(s => !s.cerrado && s.prioridad === 'ALTA').length

    // Calculate average days since creation for open items
    const diasPromedio = pendientes > 0
      ? Math.round(
          seguimientos
            .filter(s => !s.cerrado)
            .reduce((sum, s) => sum + Math.abs(diferenciaEnDias(new Date(), s.fecha_creacion)), 0) / pendientes
        )
      : 0

    return { total, pendientes, cerrados, altaPrioridad, diasPromedio }
  }, [seguimientos])

  // Filter seguimientos
  const seguimientosFiltrados = useMemo(() => {
    return seguimientos.filter(s => {
      const matchCategoria = filtroCategoria === 'all' || s.categoria === filtroCategoria
      const matchPrioridad = filtroPrioridad === 'all' || s.prioridad === filtroPrioridad
      const matchEstado = filtroEstado === 'all' ||
        (filtroEstado === 'pendientes' && !s.cerrado) ||
        (filtroEstado === 'cerrados' && s.cerrado)
      return matchCategoria && matchPrioridad && matchEstado
    })
  }, [seguimientos, filtroCategoria, filtroPrioridad, filtroEstado])

  // Create new seguimiento
  const crearSeguimiento = async (data: NuevoSeguimientoData) => {
    if (!supabase || !userId) return

    const { data: newSeguimiento, error } = await supabase
      .from('pendiente_seguimiento')
      .insert({
        tarea_id: data.tarea_id,
        categoria: data.categoria,
        descripcion: data.descripcion,
        prioridad: data.prioridad,
        fecha_creacion: new Date().toISOString(),
        fecha_recordatorio: data.fecha_recordatorio || null,
        cerrado: false,
        creado_por: userId
      })
      .select()
      .single()

    if (error) throw error

    // Add to state with tarea info
    const tarea = tareasEquipo.find(t => t.tarea_id === data.tarea_id)
    setSeguimientos(prev => [{
      ...newSeguimiento,
      tarea
    }, ...prev])
  }

  // Close seguimiento
  const cerrarSeguimiento = async (seguimientoId: string, evidencia: string) => {
    if (!supabase) return

    const { error } = await supabase
      .from('pendiente_seguimiento')
      .update({
        cerrado: true,
        fecha_cierre: new Date().toISOString(),
        evidencia_cierre: evidencia
      })
      .eq('seguimiento_id', seguimientoId)

    if (error) throw error

    // Update state
    setSeguimientos(prev => prev.map(s =>
      s.seguimiento_id === seguimientoId
        ? { ...s, cerrado: true, fecha_cierre: new Date().toISOString(), evidencia_cierre: evidencia }
        : s
    ))
  }

  // Access check
  if (!roleLoading && !canManageTeam) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Shield className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Acceso Restringido</h2>
        <p className="text-slate-500 mt-2">
          No tienes permisos para acceder a seguimientos.
        </p>
      </div>
    )
  }

  if (loading || roleLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-medium">Cargando seguimientos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg">
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Seguimientos</h1>
              <p className="text-slate-500">Pendientes y recordatorios del equipo</p>
            </div>
          </div>
          <button
            onClick={() => setShowNuevoModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <Plus size={18} />
            Nuevo Seguimiento
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICardGrid columns={4}>
        <KPICard
          title="Pendientes"
          value={kpis.pendientes}
          subtitle={`De ${kpis.total} totales`}
          icon={<Clock size={20} />}
          variant={kpis.pendientes > 10 ? 'warning' : 'default'}
        />
        <KPICard
          title="Alta Prioridad"
          value={kpis.altaPrioridad}
          subtitle="Requieren atencion"
          icon={<AlertTriangle size={20} />}
          variant={kpis.altaPrioridad > 0 ? 'danger' : 'success'}
        />
        <KPICard
          title="Dias Promedio"
          value={kpis.diasPromedio}
          subtitle="Desde creacion"
          icon={<Calendar size={20} />}
          variant={kpis.diasPromedio > 7 ? 'warning' : 'default'}
        />
        <KPICard
          title="Cerrados"
          value={kpis.cerrados}
          subtitle="Completados"
          icon={<CheckCircle size={20} />}
          variant="success"
        />
      </KPICardGrid>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Filtrar:</span>
          </div>

          {/* Estado */}
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
            {['pendientes', 'cerrados', 'all'].map(estado => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  filtroEstado === estado
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {estado === 'pendientes' ? 'Pendientes' : estado === 'cerrados' ? 'Cerrados' : 'Todos'}
              </button>
            ))}
          </div>

          {/* Categoria */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las categorias</option>
            <option value="PAGO">Pago</option>
            <option value="TRAMITE">Tramite</option>
            <option value="CAMBIO">Cambio</option>
            <option value="DOCUMENTACION">Documentacion</option>
            <option value="REQUERIMIENTO">Requerimiento</option>
            <option value="OTRO">Otro</option>
          </select>

          {/* Prioridad */}
          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las prioridades</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>
        </div>
      </div>

      {/* Seguimientos List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {seguimientosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Sin seguimientos</p>
            <p className="text-sm mt-1">
              {filtroEstado === 'pendientes'
                ? 'No hay seguimientos pendientes'
                : 'No se encontraron seguimientos con estos filtros'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {seguimientosFiltrados.map(seguimiento => {
              const diasDesdeCreacion = Math.abs(diferenciaEnDias(new Date(), seguimiento.fecha_creacion))
              const categoriaConfig = CATEGORIA_CONFIG[seguimiento.categoria] || CATEGORIA_CONFIG.OTRO
              const CategoriaIcon = categoriaConfig.icon

              return (
                <div
                  key={seguimiento.seguimiento_id}
                  className={`p-4 hover:bg-slate-50 transition-colors ${
                    seguimiento.cerrado ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Category Icon */}
                    <div className={`p-2 rounded-lg ${categoriaConfig.bgColor}`}>
                      <CategoriaIcon size={20} className={categoriaConfig.textColor} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <p className={`font-medium ${seguimiento.cerrado ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                            {seguimiento.descripcion}
                          </p>
                          {seguimiento.tarea && (
                            <p className="text-sm text-slate-500 mt-1">
                              <span className="font-medium">{seguimiento.tarea.cliente?.nombre_comercial}</span>
                              {' - '}
                              {seguimiento.tarea.obligacion?.nombre_corto}
                            </p>
                          )}
                        </div>

                        {/* Priority & Status */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            seguimiento.prioridad === 'ALTA' ? 'bg-red-100 text-red-700' :
                            seguimiento.prioridad === 'MEDIA' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {seguimiento.prioridad}
                          </span>
                          {seguimiento.cerrado && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                              Cerrado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatearFecha(seguimiento.fecha_creacion, 'corto')}
                        </span>
                        {!seguimiento.cerrado && (
                          <span className={`flex items-center gap-1 ${
                            diasDesdeCreacion > 7 ? 'text-red-600 font-medium' :
                            diasDesdeCreacion > 3 ? 'text-yellow-600' : ''
                          }`}>
                            <Clock size={12} />
                            {diasDesdeCreacion} dia{diasDesdeCreacion !== 1 ? 's' : ''} abierto
                          </span>
                        )}
                        {seguimiento.fecha_recordatorio && (
                          <span className="flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Recordar: {formatearFecha(seguimiento.fecha_recordatorio, 'corto')}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded ${categoriaConfig.bgColor} ${categoriaConfig.textColor}`}>
                          {seguimiento.categoria}
                        </span>
                      </div>

                      {/* Closed Evidence */}
                      {seguimiento.cerrado && seguimiento.evidencia_cierre && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs text-green-700">
                            <span className="font-medium">Evidencia de cierre:</span>{' '}
                            {seguimiento.evidencia_cierre}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Cerrado el {formatearFechaHora(seguimiento.fecha_cierre)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!seguimiento.cerrado && (
                      <button
                        onClick={() => setSeguimientoCerrar(seguimiento)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1 flex-shrink-0"
                      >
                        <Check size={14} />
                        Cerrar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* New Seguimiento Modal */}
      {showNuevoModal && (
        <NuevoSeguimientoModal
          tareasDisponibles={tareasEquipo}
          onClose={() => setShowNuevoModal(false)}
          onSave={crearSeguimiento}
        />
      )}

      {/* Close Seguimiento Modal */}
      {seguimientoCerrar && (
        <CerrarSeguimientoModal
          seguimiento={seguimientoCerrar}
          onClose={() => setSeguimientoCerrar(null)}
          onCerrar={cerrarSeguimiento}
        />
      )}
    </div>
  )
}
