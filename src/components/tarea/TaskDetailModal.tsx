'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  X,
  Building2,
  FileText,
  Calendar,
  Clock,
  User,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Loader2,
  History,
  Paperclip,
  ExternalLink,
  Play,
  FileCheck,
  Send,
  Ban,
  RefreshCw
} from 'lucide-react'
import { formatearFecha, formatearFechaHora, calcularDiasRestantes } from '@/lib/utils/dateCalculations'
import { normalizeRelation } from '@/lib/utils/dataTransformers'

export interface TaskDetailModalProps {
  tareaId: string | null
  isOpen: boolean
  onClose: () => void
  onStateChange?: () => void
}

interface TareaDetalle {
  tarea_id: string
  estado: string
  fecha_limite_oficial: string
  prioridad: string
  periodo_fiscal: string
  created_at: string
  updated_at: string
  cliente: {
    nombre_comercial: string
    rfc?: string
  } | null
  contribuyente: {
    rfc: string
    razon_social?: string
  } | null
  obligacion: {
    nombre_corto: string
    nombre_largo?: string
  } | null
  responsable: {
    nombre: string
    email?: string
  } | null
}

interface TareaEvento {
  tarea_evento_id: string
  tipo_evento: string
  estado_anterior: string | null
  estado_nuevo: string | null
  metadata_json: any
  occurred_at: string
  actor: {
    nombre: string
  } | null
}

interface TareaDocumento {
  documento_id: string
  tipo_documento: string
  nombre_archivo: string
  url_archivo: string
  tamano_bytes: number
  created_at: string
}

/**
 * TaskDetailModal - Modal de detalle completo de tarea
 *
 * Muestra toda la informacion de una tarea sin necesidad de navegar.
 * Incluye timeline de eventos, documentos relacionados y acciones de estado.
 */
export default function TaskDetailModal({
  tareaId,
  isOpen,
  onClose,
  onStateChange
}: TaskDetailModalProps) {
  const [tarea, setTarea] = useState<TareaDetalle | null>(null)
  const [eventos, setEventos] = useState<TareaEvento[]>([])
  const [documentos, setDocumentos] = useState<TareaDocumento[]>([])
  const [loading, setLoading] = useState(true)
  const [actualizando, setActualizando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'docs'>('info')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Cargar datos de la tarea
  const loadTareaData = useCallback(async () => {
    if (!tareaId) return

    setLoading(true)
    setError(null)

    try {
      // Cargar tarea principal
      const { data: tareaData, error: tareaError } = await supabase
        .from('tarea')
        .select(`
          tarea_id,
          estado,
          fecha_limite_oficial,
          prioridad,
          periodo_fiscal,
          created_at,
          updated_at,
          cliente:cliente_id(nombre_comercial, rfc),
          contribuyente:contribuyente_id(rfc, razon_social),
          obligacion:id_obligacion(nombre_corto, nombre_largo),
          responsable:responsable_usuario_id(nombre, email)
        `)
        .eq('tarea_id', tareaId)
        .single()

      if (tareaError) throw tareaError

      setTarea({
        ...tareaData,
        cliente: normalizeRelation(tareaData.cliente),
        contribuyente: normalizeRelation(tareaData.contribuyente),
        obligacion: normalizeRelation(tareaData.obligacion),
        responsable: normalizeRelation(tareaData.responsable)
      })

      // Cargar eventos
      const { data: eventosData, error: eventosError } = await supabase
        .from('tarea_evento')
        .select(`
          tarea_evento_id,
          tipo_evento,
          estado_anterior,
          estado_nuevo,
          metadata_json,
          occurred_at,
          actor:actor_usuario_id(nombre)
        `)
        .eq('tarea_id', tareaId)
        .order('occurred_at', { ascending: false })
        .limit(20)

      if (!eventosError && eventosData) {
        setEventos(eventosData.map((e: any) => ({
          ...e,
          actor: normalizeRelation(e.actor)
        })))
      }

      // Cargar documentos
      const { data: docsData, error: docsError } = await supabase
        .from('tarea_documento')
        .select(`
          documento_id,
          tipo_documento,
          nombre_archivo,
          url_archivo,
          tamano_bytes,
          created_at
        `)
        .eq('tarea_id', tareaId)
        .order('created_at', { ascending: false })

      if (!docsError && docsData) {
        setDocumentos(docsData)
      }

    } catch (err) {
      console.error('Error cargando tarea:', err)
      setError('Error al cargar los datos de la tarea')
    } finally {
      setLoading(false)
    }
  }, [tareaId, supabase])

  useEffect(() => {
    if (isOpen && tareaId) {
      loadTareaData()
    }
  }, [isOpen, tareaId, loadTareaData])

  // Cambiar estado de la tarea
  async function cambiarEstado(nuevoEstado: string) {
    if (!tarea) return

    setActualizando(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const estadoAnterior = tarea.estado

      // Actualizar tarea
      const { error: updateError } = await supabase
        .from('tarea')
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq('tarea_id', tarea.tarea_id)

      if (updateError) throw updateError

      // Registrar evento
      await supabase
        .from('tarea_evento')
        .insert({
          tarea_id: tarea.tarea_id,
          tipo_evento: 'cambio_estado',
          estado_anterior: estadoAnterior,
          estado_nuevo: nuevoEstado,
          actor_usuario_id: user.id,
          occurred_at: new Date().toISOString()
        })

      // Recargar datos
      await loadTareaData()
      onStateChange?.()

    } catch (err) {
      console.error('Error cambiando estado:', err)
      setError('Error al cambiar el estado')
    } finally {
      setActualizando(false)
    }
  }

  // Obtener configuracion de estado
  function getEstadoConfig(estado: string) {
    const config: Record<string, { label: string; color: string; bgColor: string }> = {
      pendiente: { label: 'Pendiente', color: 'text-slate-700', bgColor: 'bg-slate-100' },
      en_curso: { label: 'En Curso', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      pendiente_evidencia: { label: 'Pendiente Evidencia', color: 'text-purple-700', bgColor: 'bg-purple-100' },
      en_validacion: { label: 'En Validacion', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
      presentado: { label: 'Presentado', color: 'text-green-700', bgColor: 'bg-green-100' },
      pagado: { label: 'Pagado', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
      cerrado: { label: 'Cerrado', color: 'text-slate-700', bgColor: 'bg-slate-200' },
      bloqueado_cliente: { label: 'Bloqueado por Cliente', color: 'text-red-700', bgColor: 'bg-red-100' },
      rechazado: { label: 'Rechazado', color: 'text-orange-700', bgColor: 'bg-orange-100' }
    }
    return config[estado] || { label: estado, color: 'text-slate-700', bgColor: 'bg-slate-100' }
  }

  // Obtener icono de evento
  function getEventoIcon(tipoEvento: string) {
    switch (tipoEvento) {
      case 'cambio_estado': return ChevronRight
      case 'documento_subido': return Paperclip
      case 'CAMBIO_FECHA': return Calendar
      default: return History
    }
  }

  // Formatear tamano de archivo
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // No renderizar si no esta abierto
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Detalle de Tarea
              </h2>
              {tarea && (
                <p className="text-sm text-slate-500">
                  {tarea.obligacion?.nombre_corto || 'Sin obligacion'} - {tarea.cliente?.nombre_comercial || 'Sin cliente'}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={40} className="text-blue-600 animate-spin" />
              <p className="text-slate-500">Cargando informacion...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-4 text-red-600">
              <AlertTriangle size={40} />
              <p>{error}</p>
              <button
                onClick={loadTareaData}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Reintentar
              </button>
            </div>
          </div>
        ) : tarea ? (
          <>
            {/* Estado y acciones */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Estado actual */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">Estado:</span>
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getEstadoConfig(tarea.estado).bgColor} ${getEstadoConfig(tarea.estado).color}`}>
                    {getEstadoConfig(tarea.estado).label}
                  </span>
                </div>

                {/* Acciones de estado */}
                <div className="flex items-center gap-2">
                  {tarea.estado === 'pendiente' && (
                    <button
                      onClick={() => cambiarEstado('en_curso')}
                      disabled={actualizando}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actualizando ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      Iniciar
                    </button>
                  )}
                  {tarea.estado === 'en_curso' && (
                    <button
                      onClick={() => cambiarEstado('pendiente_evidencia')}
                      disabled={actualizando}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actualizando ? <Loader2 size={14} className="animate-spin" /> : <FileCheck size={14} />}
                      Marcar Completado
                    </button>
                  )}
                  {(tarea.estado === 'pendiente_evidencia' || tarea.estado === 'rechazado') && (
                    <button
                      onClick={() => cambiarEstado('en_validacion')}
                      disabled={actualizando}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actualizando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Enviar a Validacion
                    </button>
                  )}
                  {tarea.estado === 'bloqueado_cliente' && (
                    <button
                      onClick={() => cambiarEstado('en_curso')}
                      disabled={actualizando}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actualizando ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                      Desbloquear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Informacion
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'timeline'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Timeline ({eventos.length})
                </button>
                <button
                  onClick={() => setActiveTab('docs')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'docs'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Documentos ({documentos.length})
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Tab: Informacion */}
              {activeTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cliente */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 size={16} className="text-slate-500" />
                      <h3 className="font-semibold text-slate-700">Cliente</h3>
                    </div>
                    <p className="text-lg font-medium text-slate-800">
                      {tarea.cliente?.nombre_comercial || 'Sin cliente'}
                    </p>
                    {tarea.cliente?.rfc && (
                      <p className="text-sm text-slate-500 font-mono mt-1">
                        {tarea.cliente.rfc}
                      </p>
                    )}
                  </div>

                  {/* Contribuyente */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className="text-slate-500" />
                      <h3 className="font-semibold text-slate-700">Contribuyente</h3>
                    </div>
                    <p className="text-lg font-medium text-slate-800">
                      {tarea.contribuyente?.razon_social || tarea.contribuyente?.rfc || 'Sin contribuyente'}
                    </p>
                    {tarea.contribuyente?.rfc && (
                      <p className="text-sm text-slate-500 font-mono mt-1">
                        RFC: {tarea.contribuyente.rfc}
                      </p>
                    )}
                  </div>

                  {/* Obligacion */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className="text-slate-500" />
                      <h3 className="font-semibold text-slate-700">Obligacion</h3>
                    </div>
                    <p className="text-lg font-medium text-slate-800">
                      {tarea.obligacion?.nombre_corto || 'Sin obligacion'}
                    </p>
                    {tarea.obligacion?.nombre_largo && (
                      <p className="text-sm text-slate-500 mt-1">
                        {tarea.obligacion.nombre_largo}
                      </p>
                    )}
                  </div>

                  {/* Responsable */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={16} className="text-slate-500" />
                      <h3 className="font-semibold text-slate-700">Responsable</h3>
                    </div>
                    <p className="text-lg font-medium text-slate-800">
                      {tarea.responsable?.nombre || 'Sin asignar'}
                    </p>
                    {tarea.responsable?.email && (
                      <p className="text-sm text-slate-500 mt-1">
                        {tarea.responsable.email}
                      </p>
                    )}
                  </div>

                  {/* Fechas */}
                  <div className="bg-slate-50 rounded-xl p-4 md:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={16} className="text-slate-500" />
                      <h3 className="font-semibold text-slate-700">Fechas</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Fecha Limite</p>
                        <p className="text-sm font-medium text-slate-800 mt-1">
                          {formatearFecha(tarea.fecha_limite_oficial, 'largo')}
                        </p>
                        {(() => {
                          const dias = calcularDiasRestantes(tarea.fecha_limite_oficial)
                          if (dias < 0) {
                            return <p className="text-xs text-red-600 font-bold mt-1">Vencida hace {Math.abs(dias)} dias</p>
                          } else if (dias === 0) {
                            return <p className="text-xs text-orange-600 font-bold mt-1">Vence HOY</p>
                          } else if (dias <= 3) {
                            return <p className="text-xs text-yellow-600 font-bold mt-1">Vence en {dias} dias</p>
                          }
                          return <p className="text-xs text-slate-500 mt-1">{dias} dias restantes</p>
                        })()}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Periodo</p>
                        <p className="text-sm font-medium text-slate-800 mt-1">
                          {tarea.periodo_fiscal || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Creada</p>
                        <p className="text-sm font-medium text-slate-800 mt-1">
                          {formatearFechaHora(tarea.created_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Actualizada</p>
                        <p className="text-sm font-medium text-slate-800 mt-1">
                          {formatearFechaHora(tarea.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prioridad */}
                  <div className="bg-slate-50 rounded-xl p-4 md:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={16} className="text-slate-500" />
                      <h3 className="font-semibold text-slate-700">Prioridad</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                        tarea.prioridad === 'alta' ? 'bg-red-100 text-red-700' :
                        tarea.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {tarea.prioridad?.toUpperCase() || 'NORMAL'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Timeline */}
              {activeTab === 'timeline' && (
                <div className="relative">
                  {eventos.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="mx-auto mb-4 text-slate-300" size={48} />
                      <p className="text-slate-500">No hay eventos registrados</p>
                    </div>
                  ) : (
                    <>
                      {/* Linea vertical */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

                      {/* Eventos */}
                      <div className="space-y-4">
                        {eventos.map((evento, index) => {
                          const IconComponent = getEventoIcon(evento.tipo_evento)
                          return (
                            <div key={evento.tarea_evento_id} className="relative pl-14">
                              {/* Punto en timeline */}
                              <div className="absolute left-4 top-2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow" />

                              {/* Contenido del evento */}
                              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <IconComponent size={14} className="text-slate-500" />
                                    <span className="font-medium text-slate-800">
                                      {evento.tipo_evento === 'cambio_estado' && 'Cambio de Estado'}
                                      {evento.tipo_evento === 'documento_subido' && 'Documento Subido'}
                                      {evento.tipo_evento === 'CAMBIO_FECHA' && 'Cambio de Fecha'}
                                      {!['cambio_estado', 'documento_subido', 'CAMBIO_FECHA'].includes(evento.tipo_evento) && evento.tipo_evento}
                                    </span>
                                    {index === 0 && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                        Mas reciente
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    {formatearFechaHora(evento.occurred_at)}
                                  </span>
                                </div>

                                {/* Detalles del evento */}
                                {evento.tipo_evento === 'cambio_estado' && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className={`px-2 py-1 rounded ${getEstadoConfig(evento.estado_anterior || '').bgColor} ${getEstadoConfig(evento.estado_anterior || '').color} text-xs font-bold`}>
                                      {getEstadoConfig(evento.estado_anterior || '').label}
                                    </span>
                                    <ChevronRight size={14} className="text-slate-400" />
                                    <span className={`px-2 py-1 rounded ${getEstadoConfig(evento.estado_nuevo || '').bgColor} ${getEstadoConfig(evento.estado_nuevo || '').color} text-xs font-bold`}>
                                      {getEstadoConfig(evento.estado_nuevo || '').label}
                                    </span>
                                  </div>
                                )}

                                {evento.tipo_evento === 'documento_subido' && evento.metadata_json && (
                                  <p className="text-sm text-slate-600">
                                    Archivo: {evento.metadata_json.nombre_archivo}
                                  </p>
                                )}

                                {/* Actor */}
                                {evento.actor && (
                                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                                    <User size={12} />
                                    <span>Por: {evento.actor.nombre}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab: Documentos */}
              {activeTab === 'docs' && (
                <div>
                  {documentos.length === 0 ? (
                    <div className="text-center py-12">
                      <Paperclip className="mx-auto mb-4 text-slate-300" size={48} />
                      <p className="text-slate-500">No hay documentos adjuntos</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documentos.map((doc) => (
                        <div
                          key={doc.documento_id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                              <Paperclip size={18} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{doc.nombre_archivo}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                <span>{doc.tipo_documento}</span>
                                <span>-</span>
                                <span>{formatFileSize(doc.tamano_bytes)}</span>
                                <span>-</span>
                                <span>{formatearFecha(doc.created_at, 'corto')}</span>
                              </div>
                            </div>
                          </div>
                          <a
                            href={doc.url_archivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <ExternalLink size={14} />
                            <span>Abrir</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  ID: {tarea.tarea_id}
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12">
            <p className="text-slate-500">No se encontro la tarea</p>
          </div>
        )}
      </div>
    </div>
  )
}
