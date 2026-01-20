'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
  Building2,
  Shield,
  Filter,
  Eye,
  CheckSquare,
  X,
  AlertTriangle,
  ExternalLink,
  Download
} from 'lucide-react'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { KPICard, KPICardGrid } from '@/components/common/KPICard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EstadoTarea } from '@/lib/constants/enums'
import { calcularDiasRestantes, formatearFecha, formatearFechaHora } from '@/lib/utils/dateCalculations'

interface TaskForValidation {
  tarea_id: string
  estado: string
  fecha_limite_oficial: string
  prioridad: string
  vobo_lider: boolean
  responsable: {
    user_id: string
    nombre: string
  }
  cliente: {
    cliente_id: string
    nombre_comercial: string
  }
  obligacion: {
    nombre_corto: string
    periodicidad: string
  }
  documentos?: {
    documento_id: string
    nombre: string
    tipo_documento: string
    url: string
  }[]
}

interface TaskDetailModalProps {
  tarea: TaskForValidation
  onClose: () => void
  onApprove: (tareaId: string) => Promise<void>
  onReject: (tareaId: string, motivo: string) => Promise<void>
}

function TaskDetailModal({ tarea, onClose, onApprove, onReject }: TaskDetailModalProps) {
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [showRechazo, setShowRechazo] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    try {
      await onApprove(tarea.tarea_id)
      onClose()
    } catch (error) {
      console.error('Error approving:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!motivoRechazo.trim()) return
    setLoading(true)
    try {
      await onReject(tarea.tarea_id, motivoRechazo)
      onClose()
    } catch (error) {
      console.error('Error rejecting:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Validar Entregable</h2>
            <p className="text-sm text-slate-500">Revisa los detalles y evidencias</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Task Info */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Building2 size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Cliente</p>
                  <p className="font-medium text-slate-800">{tarea.cliente?.nombre_comercial || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Obligacion</p>
                  <p className="font-medium text-slate-800">{tarea.obligacion?.nombre_corto || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Responsable</p>
                  <p className="font-medium text-slate-800">{tarea.responsable?.nombre || 'Sin asignar'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Fecha Limite</p>
                  <p className="font-medium text-slate-800">{formatearFecha(tarea.fecha_limite_oficial, 'largo')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents / Evidence */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-3">Evidencias Adjuntas</h3>
            {!tarea.documentos || tarea.documentos.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <AlertTriangle className="mx-auto text-yellow-500 mb-2" size={24} />
                <p className="text-sm text-yellow-700">No hay evidencias adjuntas</p>
                <p className="text-xs text-yellow-600 mt-1">
                  El colaborador no ha subido documentos de evidencia
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tarea.documentos.map(doc => (
                  <div
                    key={doc.documento_id}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-700">{doc.nombre}</p>
                        <p className="text-xs text-slate-500">
                          {doc.tipo_documento}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                        title="Ver documento"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <a
                        href={doc.url}
                        download
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                        title="Descargar"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rejection reason */}
          {showRechazo && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Motivo del Rechazo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
                placeholder="Describe el motivo del rechazo para que el colaborador pueda corregirlo..."
                disabled={loading}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            {!showRechazo ? (
              <>
                <button
                  onClick={() => setShowRechazo(true)}
                  className="flex-1 px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <XCircle size={18} />
                  Rechazar
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Aprobar VoBo
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowRechazo(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={loading || !motivoRechazo.trim()}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <XCircle size={18} />
                      Confirmar Rechazo
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ValidacionesPage() {
  const { rol, isLoading: roleLoading, userId, canManageTeam } = useUserRole()

  const [tareas, setTareas] = useState<TaskForValidation[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroColaborador, setFiltroColaborador] = useState<string>('all')
  const [filtroEstado, setFiltroEstado] = useState<string>('all')
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [tareaDetalle, setTareaDetalle] = useState<TaskForValidation | null>(null)
  const [procesando, setProcesando] = useState(false)

  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])

  useEffect(() => {
    if (!supabase || !userId || roleLoading) return

    async function fetchTareasValidacion() {
      if (!supabase || !userId) return
      setLoading(true)

      try {
        // Get user's team first
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('team_id, rol_en_equipo')
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

        const memberIds = membersData.map((m: any) => m.user_id)

        // Get tasks pending validation (en_validacion or presentado)
        const { data: tareasData } = await supabase
          .from('tarea')
          .select(`
            tarea_id,
            estado,
            fecha_limite_oficial,
            prioridad,
            vobo_lider,
            responsable:users!tarea_responsable_usuario_id_fkey(user_id, nombre),
            cliente:cliente_id(cliente_id, nombre_comercial),
            obligacion:id_obligacion(nombre_corto, periodicidad)
          `)
          .in('responsable_usuario_id', memberIds)
          .in('estado', ['en_validacion', 'presentado', 'pendiente_evidencia'])
          .order('fecha_limite_oficial', { ascending: true })
          .limit(200)

        // Transform data
        const tareasTransformadas: TaskForValidation[] = (tareasData || []).map((t: any) => ({
          ...t,
          responsable: Array.isArray(t.responsable) ? t.responsable[0] : t.responsable,
          cliente: Array.isArray(t.cliente) ? t.cliente[0] : t.cliente,
          obligacion: Array.isArray(t.obligacion) ? t.obligacion[0] : t.obligacion,
        }))

        // Get documents for each task (join with documento table)
        const tareaIds = tareasTransformadas.map(t => t.tarea_id)
        if (tareaIds.length > 0) {
          const { data: documentos } = await supabase
            .from('tarea_documento')
            .select(`
              tarea_id,
              documento:documento_id (
                documento_id,
                nombre,
                tipo_documento,
                url
              )
            `)
            .in('tarea_id', tareaIds)

          // Attach documents to tasks (flatten the joined structure)
          interface DocResult {
            tarea_id: string
            documento: { documento_id: string; nombre: string; tipo_documento: string; url: string } |
                       { documento_id: string; nombre: string; tipo_documento: string; url: string }[] | null
          }
          tareasTransformadas.forEach(t => {
            const taskDocs = (documentos as DocResult[] || [])
              .filter(d => d.tarea_id === t.tarea_id)
              .map(d => {
                if (!d.documento) return null
                // Supabase puede devolver objeto o array dependiendo de la relación
                return Array.isArray(d.documento) ? d.documento[0] : d.documento
              })
              .filter((doc): doc is { documento_id: string; nombre: string; tipo_documento: string; url: string } => doc !== null)
            t.documentos = taskDocs
          })
        }

        setTareas(tareasTransformadas)
      } catch (error) {
        console.error('Error fetching validation tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTareasValidacion()
  }, [supabase, userId, roleLoading])

  // Get unique collaborators for filter
  const colaboradores = useMemo(() => {
    const unique = new Map<string, string>()
    tareas.forEach(t => {
      if (t.responsable?.user_id) {
        unique.set(t.responsable.user_id, t.responsable.nombre)
      }
    })
    return Array.from(unique.entries()).map(([id, nombre]) => ({ id, nombre }))
  }, [tareas])

  // Filter tasks
  const tareasFiltradas = useMemo(() => {
    return tareas.filter(t => {
      const matchColaborador = filtroColaborador === 'all' || t.responsable?.user_id === filtroColaborador
      const matchEstado = filtroEstado === 'all' || t.estado === filtroEstado
      return matchColaborador && matchEstado
    })
  }, [tareas, filtroColaborador, filtroEstado])

  // KPIs
  const kpis = useMemo(() => {
    const total = tareas.length
    const enValidacion = tareas.filter(t => t.estado === 'en_validacion').length
    const presentadas = tareas.filter(t => t.estado === 'presentado').length
    const pendientesEvidencia = tareas.filter(t => t.estado === 'pendiente_evidencia').length
    const conEvidencia = tareas.filter(t => t.documentos && t.documentos.length > 0).length

    return { total, enValidacion, presentadas, pendientesEvidencia, conEvidencia }
  }, [tareas])

  // Toggle selection
  const toggleSeleccion = (tareaId: string) => {
    const newSet = new Set(seleccionadas)
    if (newSet.has(tareaId)) {
      newSet.delete(tareaId)
    } else {
      newSet.add(tareaId)
    }
    setSeleccionadas(newSet)
  }

  // Select all
  const toggleSelectAll = () => {
    if (seleccionadas.size === tareasFiltradas.length) {
      setSeleccionadas(new Set())
    } else {
      setSeleccionadas(new Set(tareasFiltradas.map(t => t.tarea_id)))
    }
  }

  // Approve single task
  const aprobarTarea = async (tareaId: string) => {
    if (!supabase || !userId) return

    await supabase
      .from('tarea')
      .update({
        vobo_lider: true,
        updated_at: new Date().toISOString()
      })
      .eq('tarea_id', tareaId)

    // Log event
    await supabase
      .from('tarea_evento')
      .insert({
        tarea_id: tareaId,
        tipo_evento: 'validacion',
        estado_anterior: 'en_validacion',
        estado_nuevo: 'en_validacion',
        actor_usuario_id: userId,
        occurred_at: new Date().toISOString(),
        metadata_json: { accion: 'APROBADO' }
      })

    // Refresh list
    setTareas(prev => prev.filter(t => t.tarea_id !== tareaId))
  }

  // Reject single task
  const rechazarTarea = async (tareaId: string, motivo: string) => {
    if (!supabase || !userId) return

    const tarea = tareas.find(t => t.tarea_id === tareaId)

    await supabase
      .from('tarea')
      .update({
        estado: 'rechazado',
        vobo_lider: false,
        updated_at: new Date().toISOString()
      })
      .eq('tarea_id', tareaId)

    // Log event
    await supabase
      .from('tarea_evento')
      .insert({
        tarea_id: tareaId,
        tipo_evento: 'validacion',
        estado_anterior: tarea?.estado || 'en_validacion',
        estado_nuevo: 'rechazado',
        actor_usuario_id: userId,
        occurred_at: new Date().toISOString(),
        metadata_json: { accion: 'RECHAZADO', motivo }
      })

    // Refresh list
    setTareas(prev => prev.filter(t => t.tarea_id !== tareaId))
  }

  // Bulk approve
  const aprobarSeleccionadas = async () => {
    if (seleccionadas.size === 0) return
    setProcesando(true)

    try {
      for (const tareaId of seleccionadas) {
        await aprobarTarea(tareaId)
      }
      setSeleccionadas(new Set())
    } catch (error) {
      console.error('Error in bulk approve:', error)
    } finally {
      setProcesando(false)
    }
  }

  // Access check
  if (!roleLoading && !canManageTeam) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Shield className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Acceso Restringido</h2>
        <p className="text-slate-500 mt-2">
          No tienes permisos para acceder a las validaciones.
        </p>
      </div>
    )
  }

  if (loading || roleLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-medium">Cargando tareas pendientes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg">
              <CheckSquare size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Validaciones</h1>
              <p className="text-slate-500">Cola de entregables pendientes de VoBo</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICardGrid columns={4}>
        <KPICard
          title="Total Pendientes"
          value={kpis.total}
          subtitle="Requieren revision"
          icon={<Clock size={20} />}
          variant={kpis.total > 10 ? 'warning' : 'default'}
        />
        <KPICard
          title="En Validacion"
          value={kpis.enValidacion}
          subtitle="Esperando VoBo"
          icon={<CheckCircle size={20} />}
          variant="warning"
        />
        <KPICard
          title="Presentadas SAT"
          value={kpis.presentadas}
          subtitle="Falta confirmar pago"
          icon={<FileText size={20} />}
          variant="success"
        />
        <KPICard
          title="Con Evidencia"
          value={kpis.conEvidencia}
          subtitle={`De ${kpis.total} totales`}
          icon={<FileText size={20} />}
          progress={kpis.total > 0 ? (kpis.conEvidencia / kpis.total) * 100 : 0}
        />
      </KPICardGrid>

      {/* Filters and Bulk Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-slate-400" />
            <select
              value={filtroColaborador}
              onChange={(e) => setFiltroColaborador(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos los colaboradores</option>
              {colaboradores.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="en_validacion">En Validacion</option>
              <option value="presentado">Presentado</option>
              <option value="pendiente_evidencia">Pendiente Evidencia</option>
            </select>
          </div>

          {seleccionadas.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">
                {seleccionadas.size} seleccionada{seleccionadas.size > 1 ? 's' : ''}
              </span>
              <button
                onClick={aprobarSeleccionadas}
                disabled={procesando}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {procesando ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                Aprobar Seleccionadas
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={seleccionadas.size === tareasFiltradas.length && tareasFiltradas.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                />
              </th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Obligacion</th>
              <th className="px-4 py-3 text-center">Colaborador</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Evidencias</th>
              <th className="px-4 py-3 text-center">Vencimiento</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tareasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  <CheckCircle size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">Todo al dia</p>
                  <p className="text-sm mt-1">No hay tareas pendientes de validacion</p>
                </td>
              </tr>
            ) : (
              tareasFiltradas.map(tarea => {
                const diasRestantes = calcularDiasRestantes(tarea.fecha_limite_oficial)
                const isOverdue = diasRestantes < 0
                const hasEvidence = tarea.documentos && tarea.documentos.length > 0

                return (
                  <tr key={tarea.tarea_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={seleccionadas.has(tarea.tarea_id)}
                        onChange={() => toggleSeleccion(tarea.tarea_id)}
                        className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700 text-sm">
                        {tarea.cliente?.nombre_comercial || 'N/A'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {tarea.obligacion?.nombre_corto || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">
                      {tarea.responsable?.nombre || 'Sin asignar'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        status={tarea.estado as EstadoTarea}
                        type="estado"
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hasEvidence ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <FileText size={12} />
                          {tarea.documentos?.length}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          <AlertTriangle size={12} />
                          Sin evidencia
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm px-2 py-1 rounded ${
                        isOverdue ? 'bg-red-100 text-red-700' :
                        diasRestantes <= 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {formatearFecha(tarea.fecha_limite_oficial, 'corto')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setTareaDetalle(tarea)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => aprobarTarea(tarea.tarea_id)}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600"
                          title="Aprobar"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => setTareaDetalle(tarea)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500"
                          title="Rechazar"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {tareaDetalle && (
        <TaskDetailModal
          tarea={tareaDetalle}
          onClose={() => setTareaDetalle(null)}
          onApprove={aprobarTarea}
          onReject={rechazarTarea}
        />
      )}
    </div>
  )
}
