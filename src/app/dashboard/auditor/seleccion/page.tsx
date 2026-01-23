'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import {
  Shield,
  ArrowLeft,
  Settings,
  Shuffle,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Search,
  Loader2,
  RefreshCw,
  Building2,
  FileText,
  User,
  Calendar,
  Plus,
  Percent,
  List,
  Save
} from 'lucide-react'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { KPICard, KPICardGrid } from '@/components/common/KPICard'
import { StatusBadge } from '@/components/common/StatusBadge'

// Types
interface TareaDisponible {
  tarea_id: string
  cliente_nombre: string
  obligacion_nombre: string
  responsable_nombre: string | null
  periodo_fiscal: string
  fecha_cierre: string
  selected: boolean
}

interface AuditorOption {
  user_id: string
  nombre: string
  email: string
}

interface PendingSelection {
  auditoria_id: string
  tarea_id: string
  cliente: string
  obligacion: string
  responsable: string | null
  fecha_seleccion: string
  tipo_seleccion: string
  auditor_nombre: string | null
}

interface SelectionStats {
  totalTareasCerradas: number
  tareasAuditadas: number
  pendientesAsignacion: number
  porcentajeAuditado: number
}

export default function AuditSelectionPage() {
  const router = useRouter()
  const { rol, userId, isLoading: roleLoading } = useUserRole()

  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Configuration
  const [porcentajeAuditoria, setPorcentajeAuditoria] = useState(10)
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('')
  const [auditorSeleccionado, setAuditorSeleccionado] = useState('')

  // Data
  const [stats, setStats] = useState<SelectionStats>({
    totalTareasCerradas: 0,
    tareasAuditadas: 0,
    pendientesAsignacion: 0,
    porcentajeAuditado: 0
  })
  const [tareasDisponibles, setTareasDisponibles] = useState<TareaDisponible[]>([])
  const [auditores, setAuditores] = useState<AuditorOption[]>([])
  const [pendingSelections, setPendingSelections] = useState<PendingSelection[]>([])

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlySelected, setShowOnlySelected] = useState(false)

  // View mode
  const [viewMode, setViewMode] = useState<'config' | 'manual' | 'pending'>('config')

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // Available periods (last 12 months)
  const periodos = useMemo(() => {
    const periods: string[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      periods.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
    }
    return periods
  }, [])

  // Set default period
  useEffect(() => {
    if (!periodoSeleccionado && periodos.length > 0) {
      setPeriodoSeleccionado(periodos[0])
    }
  }, [periodos])

  // Fetch data
  useEffect(() => {
    if (!roleLoading && userId && (rol === 'SOCIO' || rol === 'ADMIN')) {
      fetchData()
    } else if (!roleLoading && rol !== 'SOCIO' && rol !== 'ADMIN') {
      setLoading(false)
    }
  }, [roleLoading, userId, rol, periodoSeleccionado])

  const fetchData = async () => {
    if (!periodoSeleccionado) return

    try {
      // Fetch auditores
      const { data: auditoresData } = await supabase
        .from('users')
        .select('user_id, nombre, email')
        .eq('activo', true)
        .in('rol_global', ['AUDITOR', 'ADMIN', 'SOCIO'])
        .order('nombre')

      if (auditoresData) {
        setAuditores(auditoresData)
        // Set default auditor if not set
        if (!auditorSeleccionado && auditoresData.length > 0) {
          setAuditorSeleccionado(auditoresData[0].user_id)
        }
      }

      // Fetch stats
      const { count: totalCerradas } = await supabase
        .from('tarea')
        .select('tarea_id', { count: 'exact', head: true })
        .in('estado', ['cerrado', 'pagado'])
        .eq('periodo_fiscal', periodoSeleccionado)

      const { count: yaAuditadas } = await supabase
        .from('auditoria')
        .select('auditoria_id', { count: 'exact', head: true })
        .eq('periodo_fiscal', periodoSeleccionado)

      const { count: pendientes } = await supabase
        .from('auditoria')
        .select('auditoria_id', { count: 'exact', head: true })
        .eq('periodo_fiscal', periodoSeleccionado)
        .eq('estado', 'SELECCIONADA')

      setStats({
        totalTareasCerradas: totalCerradas || 0,
        tareasAuditadas: yaAuditadas || 0,
        pendientesAsignacion: pendientes || 0,
        porcentajeAuditado: totalCerradas ? Math.round(((yaAuditadas || 0) / totalCerradas) * 100) : 0
      })

      // Fetch tareas disponibles (cerradas pero no auditadas)
      const { data: tareasData } = await supabase
        .from('tarea')
        .select(`
          tarea_id,
          periodo_fiscal,
          updated_at,
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
        .in('estado', ['cerrado', 'pagado'])
        .eq('periodo_fiscal', periodoSeleccionado)
        .order('updated_at', { ascending: false })
        .limit(100)

      // Filter out already audited
      const { data: auditadasIds } = await supabase
        .from('auditoria')
        .select('tarea_id')
        .eq('periodo_fiscal', periodoSeleccionado)

      const auditadasSet = new Set((auditadasIds || []).map(a => a.tarea_id))

      if (tareasData) {
        const disponibles: TareaDisponible[] = tareasData
          .filter((t: any) => !auditadasSet.has(t.tarea_id))
          .map((t: any) => ({
            tarea_id: t.tarea_id,
            cliente_nombre: t.cliente?.nombre_comercial || 'Sin cliente',
            obligacion_nombre: t.obligacion?.nombre_corto || 'Sin obligacion',
            responsable_nombre: t.responsable?.nombre || null,
            periodo_fiscal: t.periodo_fiscal,
            fecha_cierre: t.updated_at,
            selected: false
          }))
        setTareasDisponibles(disponibles)
      }

      // Fetch pending selections
      const { data: pendingData } = await supabase
        .from('auditoria')
        .select(`
          auditoria_id,
          tarea_id,
          fecha_seleccion,
          tipo_seleccion,
          auditor:auditor_id (
            nombre
          ),
          tarea:tarea_id (
            cliente:cliente_id (
              nombre_comercial
            ),
            obligacion:id_obligacion (
              nombre_corto
            ),
            responsable:responsable_usuario_id (
              nombre
            )
          )
        `)
        .eq('periodo_fiscal', periodoSeleccionado)
        .eq('estado', 'SELECCIONADA')
        .order('fecha_seleccion', { ascending: false })

      if (pendingData) {
        const pending: PendingSelection[] = pendingData.map((p: any) => ({
          auditoria_id: p.auditoria_id,
          tarea_id: p.tarea_id,
          cliente: p.tarea?.cliente?.nombre_comercial || 'Sin cliente',
          obligacion: p.tarea?.obligacion?.nombre_corto || 'Sin obligacion',
          responsable: p.tarea?.responsable?.nombre || null,
          fecha_seleccion: p.fecha_seleccion,
          tipo_seleccion: p.tipo_seleccion,
          auditor_nombre: p.auditor?.nombre || null
        }))
        setPendingSelections(pending)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Handle random selection
  const handleSeleccionAleatoria = async () => {
    if (!auditorSeleccionado) {
      alert('Debes seleccionar un auditor')
      return
    }

    if (tareasDisponibles.length === 0) {
      alert('No hay tareas disponibles para auditar en este periodo')
      return
    }

    setSaving(true)
    try {
      // Calculate how many to select
      const cantidadASeleccionar = Math.ceil(tareasDisponibles.length * (porcentajeAuditoria / 100))

      // Randomly select tasks
      const shuffled = [...tareasDisponibles].sort(() => Math.random() - 0.5)
      const seleccionadas = shuffled.slice(0, cantidadASeleccionar)

      // Create auditoria records
      const auditorias = seleccionadas.map(t => ({
        tarea_id: t.tarea_id,
        auditor_id: auditorSeleccionado,
        periodo_fiscal: periodoSeleccionado,
        tipo_seleccion: 'ALEATORIO',
        estado: 'SELECCIONADA'
      }))

      const { error } = await supabase
        .from('auditoria')
        .insert(auditorias)

      if (error) throw error

      alert(`Se seleccionaron ${cantidadASeleccionar} tareas para auditoria`)
      fetchData() // Refresh data
    } catch (error) {
      console.error('Error creating auditorias:', error)
      alert('Error al crear las auditorias')
    } finally {
      setSaving(false)
    }
  }

  // Handle manual selection
  const toggleTareaSelection = (tareaId: string) => {
    setTareasDisponibles(prev =>
      prev.map(t =>
        t.tarea_id === tareaId ? { ...t, selected: !t.selected } : t
      )
    )
  }

  const handleSeleccionManual = async () => {
    const seleccionadas = tareasDisponibles.filter(t => t.selected)

    if (seleccionadas.length === 0) {
      alert('Debes seleccionar al menos una tarea')
      return
    }

    if (!auditorSeleccionado) {
      alert('Debes seleccionar un auditor')
      return
    }

    setSaving(true)
    try {
      const auditorias = seleccionadas.map(t => ({
        tarea_id: t.tarea_id,
        auditor_id: auditorSeleccionado,
        periodo_fiscal: periodoSeleccionado,
        tipo_seleccion: 'MANUAL',
        estado: 'SELECCIONADA'
      }))

      const { error } = await supabase
        .from('auditoria')
        .insert(auditorias)

      if (error) throw error

      alert(`Se seleccionaron ${seleccionadas.length} tareas para auditoria`)
      fetchData() // Refresh data
    } catch (error) {
      console.error('Error creating auditorias:', error)
      alert('Error al crear las auditorias')
    } finally {
      setSaving(false)
    }
  }

  // Filter tareas
  const filteredTareas = useMemo(() => {
    return tareasDisponibles.filter(t => {
      const matchesSearch = !searchTerm ||
        t.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.obligacion_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.responsable_nombre && t.responsable_nombre.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesSelected = !showOnlySelected || t.selected

      return matchesSearch && matchesSelected
    })
  }, [tareasDisponibles, searchTerm, showOnlySelected])

  const selectedCount = tareasDisponibles.filter(t => t.selected).length

  // Loading state
  if (roleLoading || loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-slate-600 font-medium">Cargando configuracion de auditorias...</p>
        </div>
      </div>
    )
  }

  // Access denied (not SOCIO or ADMIN)
  if (rol !== 'SOCIO' && rol !== 'ADMIN') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Acceso Restringido</h1>
          <p className="text-slate-600 mb-4">
            Esta seccion es exclusiva para Socios y Administradores.
          </p>
          <button
            onClick={() => router.push('/dashboard/auditor')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Volver al Panel de Auditor
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/auditor')}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <Settings size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Seleccion de Auditorias</h1>
                <p className="text-indigo-200 mt-1">
                  Configurar y seleccionar tareas para auditoria de calidad
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setRefreshing(true)
                fetchData()
              }}
              disabled={refreshing}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              className="bg-white/20 border-0 rounded-lg px-3 py-2 text-white font-medium focus:ring-2 focus:ring-white/50"
            >
              {periodos.map(p => (
                <option key={p} value={p} className="text-slate-800">{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <KPICardGrid columns={4}>
        <KPICard
          title="Tareas Cerradas"
          value={stats.totalTareasCerradas}
          icon={<CheckCircle2 size={24} />}
          variant="default"
          subtitle={`Periodo ${periodoSeleccionado}`}
        />
        <KPICard
          title="Ya Auditadas"
          value={stats.tareasAuditadas}
          icon={<Shield size={24} />}
          variant="success"
          subtitle="Con auditoria asignada"
        />
        <KPICard
          title="Pendientes Asignacion"
          value={stats.pendientesAsignacion}
          icon={<UserCheck size={24} />}
          variant={stats.pendientesAsignacion > 0 ? 'warning' : 'default'}
          subtitle="En cola del auditor"
        />
        <KPICard
          title="% Auditado"
          value={stats.porcentajeAuditado}
          valueIsPercent
          icon={<Percent size={24} />}
          variant={stats.porcentajeAuditado >= porcentajeAuditoria ? 'success' : 'warning'}
          progress={stats.porcentajeAuditado}
          subtitle={`Meta: ${porcentajeAuditoria}%`}
        />
      </KPICardGrid>

      {/* View Mode Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex">
            <button
              onClick={() => setViewMode('config')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                viewMode === 'config'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Shuffle size={18} />
              Seleccion Aleatoria
            </button>
            <button
              onClick={() => setViewMode('manual')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                viewMode === 'manual'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <List size={18} />
              Seleccion Manual
            </button>
            <button
              onClick={() => setViewMode('pending')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                viewMode === 'pending'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserCheck size={18} />
              Pendientes ({pendingSelections.length})
            </button>
          </nav>
        </div>

        {/* Config View - Random Selection */}
        {viewMode === 'config' && (
          <div className="p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Porcentaje slider */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Percent size={18} />
                  Porcentaje de Tareas a Auditar
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={porcentajeAuditoria}
                      onChange={(e) => setPorcentajeAuditoria(Number(e.target.value))}
                      className="flex-1 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="w-20 text-center">
                      <span className="text-3xl font-bold text-purple-600">{porcentajeAuditoria}</span>
                      <span className="text-lg text-slate-500">%</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    Se seleccionaran aproximadamente {Math.ceil(tareasDisponibles.length * (porcentajeAuditoria / 100))} tareas
                    de {tareasDisponibles.length} disponibles
                  </p>
                </div>
              </div>

              {/* Auditor selection */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <UserCheck size={18} />
                  Asignar Auditor
                </h3>
                <select
                  value={auditorSeleccionado}
                  onChange={(e) => setAuditorSeleccionado(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Seleccionar auditor...</option>
                  {auditores.map(a => (
                    <option key={a.user_id} value={a.user_id}>
                      {a.nombre} ({a.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action button */}
              <div className="text-center pt-4">
                <button
                  onClick={handleSeleccionAleatoria}
                  disabled={saving || !auditorSeleccionado || tareasDisponibles.length === 0}
                  className="px-8 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold text-lg disabled:opacity-50 flex items-center gap-3 mx-auto"
                >
                  {saving ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <Shuffle size={24} />
                  )}
                  Ejecutar Seleccion Aleatoria
                </button>
                {tareasDisponibles.length === 0 && (
                  <p className="text-amber-600 text-sm mt-3">
                    No hay tareas disponibles para auditar en este periodo
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual View */}
        {viewMode === 'manual' && (
          <div className="p-6">
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, obligacion o responsable..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlySelected}
                  onChange={(e) => setShowOnlySelected(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                />
                Solo seleccionadas ({selectedCount})
              </label>
              <select
                value={auditorSeleccionado}
                onChange={(e) => setAuditorSeleccionado(e.target.value)}
                className="p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Asignar a...</option>
                {auditores.map(a => (
                  <option key={a.user_id} value={a.user_id}>{a.nombre}</option>
                ))}
              </select>
              <button
                onClick={handleSeleccionManual}
                disabled={saving || selectedCount === 0 || !auditorSeleccionado}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Crear Auditorias ({selectedCount})
              </button>
            </div>

            {/* Tasks list */}
            {filteredTareas.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText size={48} className="mx-auto mb-3 opacity-50" />
                <p>No hay tareas disponibles para auditar</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          <input
                            type="checkbox"
                            checked={filteredTareas.length > 0 && filteredTareas.every(t => t.selected)}
                            onChange={(e) => {
                              const ids = new Set(filteredTareas.map(t => t.tarea_id))
                              setTareasDisponibles(prev =>
                                prev.map(t => ids.has(t.tarea_id) ? { ...t, selected: e.target.checked } : t)
                              )
                            }}
                            className="w-4 h-4 text-purple-600 border-slate-300 rounded"
                          />
                        </th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">Cliente</th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">Obligacion</th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">Responsable</th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">Fecha Cierre</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTareas.map((tarea) => (
                        <tr
                          key={tarea.tarea_id}
                          className={`hover:bg-slate-50 cursor-pointer ${tarea.selected ? 'bg-purple-50' : ''}`}
                          onClick={() => toggleTareaSelection(tarea.tarea_id)}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={tarea.selected}
                              onChange={() => toggleTareaSelection(tarea.tarea_id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-purple-600 border-slate-300 rounded"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Building2 size={14} className="text-slate-400" />
                              <span className="font-medium text-slate-800">{tarea.cliente_nombre}</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600">{tarea.obligacion_nombre}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-slate-400" />
                              <span className="text-slate-600">{tarea.responsable_nombre || 'Sin asignar'}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-slate-500">
                            {new Date(tarea.fecha_cierre).toLocaleDateString('es-MX')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending View */}
        {viewMode === 'pending' && (
          <div className="p-6">
            {pendingSelections.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 size={48} className="mx-auto mb-3 opacity-50" />
                <p>No hay auditorias pendientes de asignacion</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">Cliente</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">Obligacion</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">Responsable</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">Auditor</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">Fecha Seleccion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingSelections.map((pending) => (
                      <tr key={pending.auditoria_id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-slate-400" />
                            <span className="font-medium text-slate-800">{pending.cliente}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">{pending.obligacion}</td>
                        <td className="p-3 text-slate-600">{pending.responsable || 'Sin asignar'}</td>
                        <td className="p-3">
                          <StatusBadge
                            status={pending.tipo_seleccion}
                            type="custom"
                            variant={pending.tipo_seleccion === 'ALEATORIO' ? 'info' : 'default'}
                            label={pending.tipo_seleccion}
                            size="sm"
                            showIcon={false}
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <UserCheck size={14} className="text-purple-600" />
                            <span className="text-slate-600">{pending.auditor_nombre || 'Sin asignar'}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-slate-500">
                          {new Date(pending.fecha_seleccion).toLocaleDateString('es-MX')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
