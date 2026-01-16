'use client'

import { useState, useEffect } from 'react'
import { X, Save, Calendar, AlertCircle, Clock, History } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface AjusteFechaModalProps {
  tareaId: string
  fechaActual: string // formato YYYY-MM-DD
  onClose: () => void
  onSave: () => void
}

export default function AjusteFechaModal({
  tareaId,
  fechaActual,
  onClose,
  onSave
}: AjusteFechaModalProps) {
  const [fechaNueva, setFechaNueva] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [validacion, setValidacion] = useState<{ campo: string; mensaje: string } | null>(null)
  const [puedeAjustar, setPuedeAjustar] = useState(false)
  const [showHistorial, setShowHistorial] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Verificar permisos del usuario
  useEffect(() => {
    async function verificarPermisos() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('rol_global')
        .eq('user_id', user.id)
        .single()

      if (userData && ['LIDER', 'SOCIO', 'ADMIN'].includes(userData.rol_global)) {
        setPuedeAjustar(true)
      }
    }

    verificarPermisos()
  }, [supabase])

  // Validar fecha nueva
  useEffect(() => {
    if (fechaNueva) {
      if (fechaNueva === fechaActual) {
        setValidacion({
          campo: 'fecha_nueva',
          mensaje: 'La fecha nueva debe ser diferente a la fecha actual'
        })
      } else {
        setValidacion(null)
      }
    }
  }, [fechaNueva, fechaActual])

  // Validar motivo
  useEffect(() => {
    if (motivo && motivo.trim().length < 10) {
      setValidacion({
        campo: 'motivo',
        mensaje: 'El motivo debe tener al menos 10 caracteres'
      })
    } else if (motivo && motivo.trim().length >= 10 && validacion?.campo === 'motivo') {
      setValidacion(null)
    }
  }, [motivo, validacion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (!puedeAjustar) {
      setError('No tienes permisos para ajustar fechas. Rol requerido: LIDER, SOCIO o ADMIN')
      return
    }

    if (!fechaNueva) {
      setError('La fecha nueva es requerida')
      return
    }

    if (fechaNueva === fechaActual) {
      setError('La fecha nueva debe ser diferente a la fecha actual')
      return
    }

    if (!motivo || motivo.trim().length < 10) {
      setError('El motivo es obligatorio y debe tener al menos 10 caracteres')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // 1. Insertar en fecha_ajuste_log
      const { error: logError } = await supabase
        .from('fecha_ajuste_log')
        .insert({
          tarea_id: tareaId,
          fecha_anterior: fechaActual,
          fecha_nueva: fechaNueva,
          motivo: motivo.trim(),
          usuario_id: user.id
        })

      if (logError) throw logError

      // 2. Actualizar tarea.fecha_limite_oficial
      const { error: updateError } = await supabase
        .from('tarea')
        .update({ fecha_limite_oficial: fechaNueva })
        .eq('tarea_id', tareaId)

      if (updateError) throw updateError

      // 3. Insertar en tarea_evento tipo='CAMBIO_FECHA'
      const { error: eventoError } = await supabase
        .from('tarea_evento')
        .insert({
          tarea_id: tareaId,
          tipo_evento: 'CAMBIO_FECHA',
          estado_anterior: fechaActual,
          estado_nuevo: fechaNueva,
          actor_usuario_id: user.id,
          metadata_json: { motivo: motivo.trim() }
        })

      if (eventoError) {
        console.warn('Error al crear evento (no crítico):', eventoError)
      }

      // Éxito
      onSave()
      onClose()
    } catch (err) {
      console.error('Error al ajustar fecha:', err)
      setError(err instanceof Error ? err.message : 'Error al ajustar la fecha')
    } finally {
      setLoading(false)
    }
  }

  if (!puedeAjustar) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-full">
              <AlertCircle size={32} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Acceso Denegado</h2>
              <p className="text-slate-600">
                Solo usuarios con rol LIDER, SOCIO o ADMIN pueden ajustar fechas límite.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Ajustar Fecha Límite
              </h2>
              <p className="text-sm text-slate-500">
                Cambio de fecha con registro de auditoría
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistorial(!showHistorial)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Ver historial de cambios"
            >
              <History size={20} className="text-slate-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Fecha Actual (solo lectura) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Fecha Límite Actual
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="date"
                value={fechaActual}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                disabled
              />
            </div>
          </div>

          {/* Nueva Fecha */}
          <div>
            <label htmlFor="fecha_nueva" className="block text-sm font-semibold text-slate-700 mb-2">
              Nueva Fecha Límite <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="date"
                id="fecha_nueva"
                value={fechaNueva}
                onChange={(e) => setFechaNueva(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${validacion?.campo === 'fecha_nueva' ? 'border-red-300' : 'border-slate-300'
                  }`}
                disabled={loading}
                required
              />
            </div>
            {validacion?.campo === 'fecha_nueva' && (
              <p className="text-xs text-red-600 mt-1">{validacion.mensaje}</p>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label htmlFor="motivo" className="block text-sm font-semibold text-slate-700 mb-2">
              Motivo del Cambio <span className="text-red-500">*</span>
            </label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${validacion?.campo === 'motivo' ? 'border-red-300' : 'border-slate-300'
                }`}
              rows={4}
              placeholder="Explica la razón del cambio de fecha (mínimo 10 caracteres)..."
              disabled={loading}
              required
              minLength={10}
            />
            <div className="flex items-center justify-between mt-1">
              {validacion?.campo === 'motivo' && (
                <p className="text-xs text-red-600">{validacion.mensaje}</p>
              )}
              <p className={`text-xs ml-auto ${motivo.trim().length < 10 ? 'text-red-500' : 'text-slate-500'}`}>
                {motivo.trim().length} / 10 caracteres mínimo
              </p>
            </div>
          </div>

          {/* Información de auditoría */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  Registro de Auditoría
                </p>
                <p className="text-sm text-amber-700">
                  Este cambio quedará registrado en el historial de auditoría de la tarea,
                  incluyendo tu usuario, fecha y hora del cambio.
                </p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
              <X size={16} className="text-red-500 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading || !!validacion || !fechaNueva || motivo.trim().length < 10}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Guardar Cambio
                </>
              )}
            </button>
          </div>
        </form>

        {/* Historial expandible */}
        {showHistorial && (
          <div className="border-t border-slate-200 p-6 bg-slate-50">
            <div className="flex items-center gap-2 mb-4">
              <History size={18} className="text-slate-600" />
              <h3 className="font-semibold text-slate-800">Historial de Cambios</h3>
            </div>
            <HistorialFechasEmbed tareaId={tareaId} />
          </div>
        )}
      </div>
    </div>
  )
}

// Interface for historial items in embed component
interface HistorialItemEmbed {
  log_id: string
  fecha_anterior: string
  fecha_nueva: string
  motivo: string
  created_at: string
  usuario: { nombre: string } | { nombre: string }[] | null
}

// Componente interno simplificado para mostrar historial dentro del modal
function HistorialFechasEmbed({ tareaId }: { tareaId: string }) {
  const [historial, setHistorial] = useState<HistorialItemEmbed[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchHistorial() {
      const { data, error } = await supabase
        .from('fecha_ajuste_log')
        .select(`
          log_id,
          fecha_anterior,
          fecha_nueva,
          motivo,
          created_at,
          usuario:usuario_id (nombre)
        `)
        .eq('tarea_id', tareaId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error al cargar historial:', error)
      } else {
        setHistorial(data || [])
      }
      setLoading(false)
    }

    fetchHistorial()
  }, [tareaId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (historial.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-4">
        No hay cambios de fecha registrados para esta tarea.
      </p>
    )
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {historial.map((item) => (
        <div key={item.log_id} className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-slate-700">
                {item.fecha_anterior} → {item.fecha_nueva}
              </div>
            </div>
            <div className="text-xs text-slate-500">
              {new Date(item.created_at).toLocaleString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-1">{item.motivo}</p>
          <p className="text-xs text-slate-500">
            Por: {(Array.isArray(item.usuario) ? item.usuario[0]?.nombre : item.usuario?.nombre) || 'Usuario desconocido'}
          </p>
        </div>
      ))}
    </div>
  )
}
