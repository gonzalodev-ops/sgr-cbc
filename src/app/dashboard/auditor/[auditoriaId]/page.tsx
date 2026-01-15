'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useParams } from 'next/navigation'
import {
  Shield,
  ArrowLeft,
  Building2,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Save,
  Plus,
  Eye,
  Clock,
  Paperclip,
  Award,
  Star,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileCheck,
  X
} from 'lucide-react'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { StatusBadge } from '@/components/common/StatusBadge'

// Types
interface AuditoriaDetalle {
  auditoria_id: string
  tarea_id: string
  auditor_id: string
  periodo_fiscal: string
  fecha_seleccion: string
  fecha_inicio_revision: string | null
  fecha_fin_revision: string | null
  estado: string
  calificacion: number | null
  notas_auditor: string | null
  tipo_seleccion: string
}

interface TareaInfo {
  tarea_id: string
  estado: string
  fecha_limite_oficial: string
  periodo_fiscal: string
  cliente: {
    cliente_id: string
    nombre_comercial: string
  }
  obligacion: {
    id_obligacion: string
    nombre_corto: string
    descripcion: string
  }
  contribuyente: {
    rfc: string
    razon_social: string
  }
  responsable: {
    user_id: string
    nombre: string
  } | null
}

interface TareaPaso {
  tarea_step_id: string
  orden: number
  titulo: string
  completado: boolean
  completado_at: string | null
}

interface Hallazgo {
  hallazgo_id: string
  tipo: string
  gravedad: string
  descripcion: string
  recomendacion: string | null
  estado: string
  created_at: string
}

interface HallazgoFormData {
  tipo: string
  gravedad: string
  descripcion: string
  recomendacion: string
}

// Constants
const TIPOS_HALLAZGO = [
  { value: 'DOCUMENTACION', label: 'Documentacion', description: 'Falta documento o documento incorrecto' },
  { value: 'PROCESO', label: 'Proceso', description: 'No se siguio el proceso correcto' },
  { value: 'CALCULO', label: 'Calculo', description: 'Error en calculos numericos' },
  { value: 'PLAZO', label: 'Plazo', description: 'No se cumplio con fechas/plazos' },
  { value: 'NORMATIVO', label: 'Normativo', description: 'Incumplimiento de normas fiscales' },
  { value: 'OTRO', label: 'Otro', description: 'Otros hallazgos' }
]

const GRAVEDADES = [
  { value: 'LEVE', label: 'Leve', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', description: 'Observacion menor' },
  { value: 'MODERADO', label: 'Moderado', color: 'bg-orange-100 text-orange-800 border-orange-200', description: 'Requiere correccion' },
  { value: 'GRAVE', label: 'Grave', color: 'bg-red-100 text-red-800 border-red-200', description: 'Afecta el entregable' },
  { value: 'CRITICO', label: 'Critico', color: 'bg-red-200 text-red-900 border-red-300', description: 'Riesgo legal/fiscal' }
]

const ESTADOS_EVALUACION = [
  { value: 'APROBADO', label: 'Aprobado', icon: CheckCircle2, color: 'bg-green-600 hover:bg-green-700' },
  { value: 'CORREGIR', label: 'Requiere Correccion', icon: AlertTriangle, color: 'bg-amber-600 hover:bg-amber-700' },
  { value: 'RECHAZADO', label: 'Rechazado', icon: XCircle, color: 'bg-red-600 hover:bg-red-700' },
  { value: 'DESTACADO', label: 'Destacado', icon: Star, color: 'bg-purple-600 hover:bg-purple-700' }
]

export default function AuditoriaReviewPage() {
  const router = useRouter()
  const params = useParams()
  const auditoriaId = params.auditoriaId as string
  const { userId, canAudit, isLoading: roleLoading } = useUserRole()

  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [auditoria, setAuditoria] = useState<AuditoriaDetalle | null>(null)
  const [tareaInfo, setTareaInfo] = useState<TareaInfo | null>(null)
  const [pasos, setPasos] = useState<TareaPaso[]>([])
  const [hallazgos, setHallazgos] = useState<Hallazgo[]>([])
  const [showHallazgoForm, setShowHallazgoForm] = useState(false)
  const [showEvaluacionForm, setShowEvaluacionForm] = useState(false)
  const [expandedPasos, setExpandedPasos] = useState(true)

  // Form state
  const [hallazgoForm, setHallazgoForm] = useState<HallazgoFormData>({
    tipo: 'DOCUMENTACION',
    gravedad: 'MODERADO',
    descripcion: '',
    recomendacion: ''
  })
  const [hallazgoErrors, setHallazgoErrors] = useState<Record<string, string>>({})

  // Evaluation form state
  const [calificacion, setCalificacion] = useState<number>(80)
  const [notasAuditor, setNotasAuditor] = useState('')
  const [estadoFinal, setEstadoFinal] = useState<string>('')

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // Fetch data
  useEffect(() => {
    if (!roleLoading && userId && canAudit && auditoriaId) {
      fetchAuditoriaData()
    } else if (!roleLoading && !canAudit) {
      setLoading(false)
    }
  }, [roleLoading, userId, canAudit, auditoriaId])

  const fetchAuditoriaData = async () => {
    try {
      // Fetch auditoria
      const { data: auditoriaData, error: auditoriaError } = await supabase
        .from('auditoria')
        .select('*')
        .eq('auditoria_id', auditoriaId)
        .single()

      if (auditoriaError) throw auditoriaError
      setAuditoria(auditoriaData)

      // Update calificacion and notas if already set
      if (auditoriaData.calificacion !== null) {
        setCalificacion(auditoriaData.calificacion)
      }
      if (auditoriaData.notas_auditor) {
        setNotasAuditor(auditoriaData.notas_auditor)
      }
      if (auditoriaData.estado && auditoriaData.estado !== 'SELECCIONADA' && auditoriaData.estado !== 'EN_REVISION') {
        setEstadoFinal(auditoriaData.estado)
      }

      // Fetch tarea info
      const { data: tareaData } = await supabase
        .from('tarea')
        .select(`
          tarea_id,
          estado,
          fecha_limite_oficial,
          periodo_fiscal,
          cliente:cliente_id (
            cliente_id,
            nombre_comercial
          ),
          obligacion:id_obligacion (
            id_obligacion,
            nombre_corto,
            descripcion
          ),
          contribuyente:contribuyente_id (
            rfc,
            razon_social
          ),
          responsable:responsable_usuario_id (
            user_id,
            nombre
          )
        `)
        .eq('tarea_id', auditoriaData.tarea_id)
        .single()

      if (tareaData) {
        setTareaInfo(tareaData as any)
      }

      // Fetch pasos de la tarea
      const { data: pasosData } = await supabase
        .from('tarea_step')
        .select('tarea_step_id, orden, titulo, completado, completado_at')
        .eq('tarea_id', auditoriaData.tarea_id)
        .order('orden', { ascending: true })

      if (pasosData) {
        setPasos(pasosData)
      }

      // Fetch hallazgos
      const { data: hallazgosData } = await supabase
        .from('hallazgo')
        .select('hallazgo_id, tipo, gravedad, descripcion, recomendacion, estado, created_at')
        .eq('auditoria_id', auditoriaId)
        .order('created_at', { ascending: false })

      if (hallazgosData) {
        setHallazgos(hallazgosData)
      }

    } catch (error) {
      console.error('Error fetching auditoria data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Start review (change state to EN_REVISION)
  const handleIniciarRevision = async () => {
    if (!auditoria || auditoria.estado !== 'SELECCIONADA') return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('auditoria')
        .update({
          estado: 'EN_REVISION',
          fecha_inicio_revision: new Date().toISOString()
        })
        .eq('auditoria_id', auditoriaId)

      if (error) throw error

      setAuditoria(prev => prev ? {
        ...prev,
        estado: 'EN_REVISION',
        fecha_inicio_revision: new Date().toISOString()
      } : null)
    } catch (error) {
      console.error('Error starting review:', error)
      alert('Error al iniciar la revision')
    } finally {
      setSaving(false)
    }
  }

  // Validate hallazgo form
  const validateHallazgoForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!hallazgoForm.descripcion.trim()) {
      errors.descripcion = 'La descripcion es obligatoria'
    } else if (hallazgoForm.descripcion.trim().length < 10) {
      errors.descripcion = 'La descripcion debe tener al menos 10 caracteres'
    }

    setHallazgoErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Save hallazgo
  const handleSaveHallazgo = async () => {
    if (!validateHallazgoForm()) return

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('hallazgo')
        .insert({
          auditoria_id: auditoriaId,
          tipo: hallazgoForm.tipo,
          gravedad: hallazgoForm.gravedad,
          descripcion: hallazgoForm.descripcion.trim(),
          recomendacion: hallazgoForm.recomendacion.trim() || null,
          estado: 'ABIERTO'
        })
        .select()
        .single()

      if (error) throw error

      setHallazgos(prev => [data, ...prev])
      setHallazgoForm({
        tipo: 'DOCUMENTACION',
        gravedad: 'MODERADO',
        descripcion: '',
        recomendacion: ''
      })
      setShowHallazgoForm(false)
    } catch (error) {
      console.error('Error saving hallazgo:', error)
      alert('Error al guardar el hallazgo')
    } finally {
      setSaving(false)
    }
  }

  // Save final evaluation
  const handleSaveEvaluacion = async () => {
    if (!estadoFinal) {
      alert('Debes seleccionar un resultado de evaluacion')
      return
    }

    if (calificacion < 0 || calificacion > 100) {
      alert('La calificacion debe estar entre 0 y 100')
      return
    }

    // Validate hallazgos for certain states
    if ((estadoFinal === 'CORREGIR' || estadoFinal === 'RECHAZADO') && hallazgos.length === 0) {
      alert('Debes registrar al menos un hallazgo para este resultado')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('auditoria')
        .update({
          estado: estadoFinal,
          calificacion: calificacion,
          notas_auditor: notasAuditor.trim() || null,
          fecha_fin_revision: new Date().toISOString()
        })
        .eq('auditoria_id', auditoriaId)

      if (error) throw error

      setAuditoria(prev => prev ? {
        ...prev,
        estado: estadoFinal,
        calificacion: calificacion,
        notas_auditor: notasAuditor,
        fecha_fin_revision: new Date().toISOString()
      } : null)

      setShowEvaluacionForm(false)
      alert('Evaluacion guardada exitosamente')
    } catch (error) {
      console.error('Error saving evaluation:', error)
      alert('Error al guardar la evaluacion')
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (roleLoading || loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-slate-600 font-medium">Cargando auditoria...</p>
        </div>
      </div>
    )
  }

  // Access denied
  if (!canAudit) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Acceso Restringido</h1>
          <p className="text-slate-600">No tienes permisos para acceder a esta seccion.</p>
        </div>
      </div>
    )
  }

  // Not found
  if (!auditoria || !tareaInfo) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Auditoria no encontrada</h1>
          <p className="text-slate-600 mb-4">La auditoria solicitada no existe o no tienes acceso.</p>
          <button
            onClick={() => router.push('/dashboard/auditor')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Volver al Panel
          </button>
        </div>
      </div>
    )
  }

  const isReadOnly = ['APROBADO', 'RECHAZADO', 'DESTACADO'].includes(auditoria.estado)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
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
                <Shield size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Revision de Auditoria</h1>
                <p className="text-purple-200 mt-1">
                  {tareaInfo.cliente.nombre_comercial} - {tareaInfo.obligacion.nombre_corto}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge
              status={auditoria.estado}
              type="custom"
              variant={
                auditoria.estado === 'SELECCIONADA' ? 'warning' :
                auditoria.estado === 'EN_REVISION' ? 'info' :
                auditoria.estado === 'APROBADO' || auditoria.estado === 'DESTACADO' ? 'success' :
                auditoria.estado === 'RECHAZADO' ? 'danger' : 'warning'
              }
              label={auditoria.estado.replace('_', ' ')}
              size="lg"
              showIcon={false}
              pill
            />
            {auditoria.calificacion !== null && (
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <p className="text-xs text-purple-200">Calificacion</p>
                <p className="text-2xl font-bold">{auditoria.calificacion}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Review Button */}
      {auditoria.estado === 'SELECCIONADA' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertTriangle size={32} className="mx-auto text-amber-600 mb-3" />
          <h2 className="text-lg font-semibold text-amber-800 mb-2">Auditoria Pendiente de Iniciar</h2>
          <p className="text-amber-700 mb-4">Inicia la revision para poder registrar hallazgos y evaluar la tarea.</p>
          <button
            onClick={handleIniciarRevision}
            disabled={saving}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? 'Iniciando...' : 'Iniciar Revision'}
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Task Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Information Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <FileText size={18} />
                Informacion de la Tarea
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Cliente */}
                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <Building2 size={14} />
                    Cliente
                  </div>
                  <p className="font-medium text-slate-800">{tareaInfo.cliente.nombre_comercial}</p>
                  <p className="text-sm text-slate-500">{tareaInfo.contribuyente.rfc}</p>
                </div>

                {/* Obligacion */}
                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <FileCheck size={14} />
                    Obligacion
                  </div>
                  <p className="font-medium text-slate-800">{tareaInfo.obligacion.nombre_corto}</p>
                  <p className="text-sm text-slate-500">{tareaInfo.obligacion.descripcion}</p>
                </div>

                {/* Responsable */}
                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <User size={14} />
                    Responsable
                  </div>
                  <p className="font-medium text-slate-800">
                    {tareaInfo.responsable?.nombre || 'Sin asignar'}
                  </p>
                </div>

                {/* Periodo */}
                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <Calendar size={14} />
                    Periodo
                  </div>
                  <p className="font-medium text-slate-800">{tareaInfo.periodo_fiscal}</p>
                  <p className="text-sm text-slate-500">
                    Limite: {new Date(tareaInfo.fecha_limite_oficial).toLocaleDateString('es-MX')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist / Steps */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div
              className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedPasos(!expandedPasos)}
            >
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle2 size={18} />
                Pasos Completados ({pasos.filter(p => p.completado).length}/{pasos.length})
              </h2>
              {expandedPasos ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedPasos && (
              <div className="divide-y divide-slate-100">
                {pasos.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p>No hay pasos registrados para esta tarea</p>
                  </div>
                ) : (
                  pasos.map((paso) => (
                    <div key={paso.tarea_step_id} className="p-4 flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        paso.completado ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {paso.completado ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${paso.completado ? 'text-slate-800' : 'text-slate-500'}`}>
                          {paso.orden}. {paso.titulo}
                        </p>
                        {paso.completado_at && (
                          <p className="text-xs text-slate-400">
                            Completado: {new Date(paso.completado_at).toLocaleDateString('es-MX')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Evidence Viewer Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Paperclip size={18} />
                Evidencias Adjuntas
              </h2>
            </div>
            <div className="p-8 text-center text-slate-400">
              <Paperclip size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Visor de evidencias (pendiente de implementacion)</p>
            </div>
          </div>
        </div>

        {/* Right Column - Findings & Evaluation */}
        <div className="space-y-6">
          {/* Hallazgos Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
              <h2 className="font-semibold text-amber-800 flex items-center gap-2">
                <AlertTriangle size={18} />
                Hallazgos ({hallazgos.length})
              </h2>
              {!isReadOnly && auditoria.estado === 'EN_REVISION' && !showHallazgoForm && (
                <button
                  onClick={() => setShowHallazgoForm(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition-colors"
                >
                  <Plus size={16} />
                  Agregar
                </button>
              )}
            </div>

            {/* Hallazgo Form */}
            {showHallazgoForm && (
              <div className="p-4 bg-amber-50/50 border-b border-amber-200">
                <div className="space-y-4">
                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tipo de Hallazgo <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={hallazgoForm.tipo}
                      onChange={(e) => setHallazgoForm(prev => ({ ...prev, tipo: e.target.value }))}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {TIPOS_HALLAZGO.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label} - {tipo.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gravedad */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Gravedad <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {GRAVEDADES.map(grav => (
                        <button
                          key={grav.value}
                          onClick={() => setHallazgoForm(prev => ({ ...prev, gravedad: grav.value }))}
                          className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                            hallazgoForm.gravedad === grav.value
                              ? grav.color + ' ring-2 ring-offset-1 ring-current'
                              : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                          }`}
                        >
                          {grav.label}
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
                      value={hallazgoForm.descripcion}
                      onChange={(e) => {
                        setHallazgoForm(prev => ({ ...prev, descripcion: e.target.value }))
                        if (hallazgoErrors.descripcion) {
                          setHallazgoErrors(prev => ({ ...prev, descripcion: '' }))
                        }
                      }}
                      placeholder="Describe detalladamente el hallazgo encontrado..."
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        hallazgoErrors.descripcion ? 'border-red-500' : 'border-slate-300'
                      }`}
                      rows={3}
                    />
                    {hallazgoErrors.descripcion && (
                      <p className="text-xs text-red-500 mt-1">{hallazgoErrors.descripcion}</p>
                    )}
                  </div>

                  {/* Recomendacion */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Recomendacion (opcional)
                    </label>
                    <textarea
                      value={hallazgoForm.recomendacion}
                      onChange={(e) => setHallazgoForm(prev => ({ ...prev, recomendacion: e.target.value }))}
                      placeholder="Sugiere como corregir este hallazgo..."
                      className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      rows={2}
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowHallazgoForm(false)
                        setHallazgoForm({
                          tipo: 'DOCUMENTACION',
                          gravedad: 'MODERADO',
                          descripcion: '',
                          recomendacion: ''
                        })
                        setHallazgoErrors({})
                      }}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveHallazgo}
                      disabled={saving}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Hallazgos List */}
            {hallazgos.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertTriangle size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay hallazgos registrados</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {hallazgos.map((hallazgo) => (
                  <div key={hallazgo.hallazgo_id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        GRAVEDADES.find(g => g.value === hallazgo.gravedad)?.color || 'bg-slate-100'
                      }`}>
                        {hallazgo.gravedad}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-500 mb-1">
                          {TIPOS_HALLAZGO.find(t => t.value === hallazgo.tipo)?.label || hallazgo.tipo}
                        </p>
                        <p className="text-sm text-slate-700">{hallazgo.descripcion}</p>
                        {hallazgo.recomendacion && (
                          <p className="text-xs text-slate-500 mt-2 italic">
                            Recomendacion: {hallazgo.recomendacion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Final Evaluation Section */}
          {auditoria.estado === 'EN_REVISION' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-purple-50 px-6 py-4 border-b border-purple-200">
                <h2 className="font-semibold text-purple-800 flex items-center gap-2">
                  <Award size={18} />
                  Evaluacion Final
                </h2>
              </div>

              {!showEvaluacionForm ? (
                <div className="p-6 text-center">
                  <button
                    onClick={() => setShowEvaluacionForm(true)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Completar Evaluacion
                  </button>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {/* Estado Final */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Resultado de la Evaluacion <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ESTADOS_EVALUACION.map(estado => {
                        const Icon = estado.icon
                        return (
                          <button
                            key={estado.value}
                            onClick={() => setEstadoFinal(estado.value)}
                            className={`p-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                              estadoFinal === estado.value
                                ? `${estado.color} text-white`
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <Icon size={16} />
                            {estado.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Calificacion */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Calificacion (0-100) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={calificacion}
                        onChange={(e) => setCalificacion(Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={calificacion}
                        onChange={(e) => setCalificacion(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-20 p-2 border border-slate-300 rounded-lg text-center font-bold text-lg"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>0</span>
                      <span className={`font-medium ${
                        calificacion >= 80 ? 'text-green-600' :
                        calificacion >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {calificacion >= 80 ? 'Excelente' :
                         calificacion >= 60 ? 'Aceptable' : 'Deficiente'}
                      </span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Notas del Auditor (opcional)
                    </label>
                    <textarea
                      value={notasAuditor}
                      onChange={(e) => setNotasAuditor(e.target.value)}
                      placeholder="Comentarios adicionales sobre la revision..."
                      className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowEvaluacionForm(false)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEvaluacion}
                      disabled={saving || !estadoFinal}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Guardar Evaluacion
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Read-only evaluation summary */}
          {isReadOnly && auditoria.calificacion !== null && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-green-50 px-6 py-4 border-b border-green-200">
                <h2 className="font-semibold text-green-800 flex items-center gap-2">
                  <Award size={18} />
                  Evaluacion Completada
                </h2>
              </div>
              <div className="p-6 text-center">
                <p className={`text-5xl font-bold mb-2 ${
                  auditoria.calificacion >= 80 ? 'text-green-600' :
                  auditoria.calificacion >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {auditoria.calificacion}
                </p>
                <p className="text-slate-500 text-sm mb-4">Puntos de 100</p>
                {auditoria.notas_auditor && (
                  <div className="bg-slate-50 p-4 rounded-lg text-left">
                    <p className="text-xs text-slate-500 mb-1">Notas del auditor:</p>
                    <p className="text-sm text-slate-700">{auditoria.notas_auditor}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
