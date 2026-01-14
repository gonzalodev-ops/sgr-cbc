'use client'
import { useState } from 'react'
import { X, ArrowRightLeft, User, Calendar, Briefcase, FileText } from 'lucide-react'

interface Tarea {
  tarea_id: string
  estado: string
  fecha_limite_oficial: string
  responsable: {
    user_id: string
    nombre: string
  }
  cliente: {
    nombre_comercial: string
  }
  obligacion: {
    nombre_corto: string
  }
}

interface Miembro {
  user_id: string
  nombre: string
  rol_en_equipo: string
}

interface ReasignarModalProps {
  tarea: Tarea
  miembros: Miembro[]
  onReasignar: (nuevoResponsableId: string, motivo: string) => Promise<void>
  onClose: () => void
}

export default function ReasignarModal({ tarea, miembros, onReasignar, onClose }: ReasignarModalProps) {
  const [nuevoResponsableId, setNuevoResponsableId] = useState<string>('')
  const [motivo, setMotivo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nuevoResponsableId) {
      setError('Debes seleccionar un nuevo responsable')
      return
    }

    if (!motivo.trim()) {
      setError('Debes indicar el motivo de la reasignación')
      return
    }

    if (nuevoResponsableId === tarea.responsable.user_id) {
      setError('El nuevo responsable debe ser diferente al actual')
      return
    }

    setLoading(true)
    try {
      await onReasignar(nuevoResponsableId, motivo)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reasignar la tarea')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Reasignar Tarea</h2>
              <p className="text-sm text-slate-500">Cambiar responsable de la tarea</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información de la tarea actual */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-500 uppercase font-bold mb-3">Información de la Tarea</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Briefcase size={16} className="text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Cliente</p>
                  <p className="font-medium text-slate-800">{tarea.cliente.nombre_comercial}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText size={16} className="text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Obligación</p>
                  <p className="font-medium text-slate-800">{tarea.obligacion.nombre_corto}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={16} className="text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Fecha Límite</p>
                  <p className="font-medium text-slate-800">
                    {new Date(tarea.fecha_limite_oficial).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User size={16} className="text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Responsable Actual</p>
                  <p className="font-medium text-slate-800">{tarea.responsable.nombre}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 mt-0.5">
                  <div className={`w-3 h-3 rounded-full ${
                    tarea.estado === 'pendiente' ? 'bg-slate-400' :
                    tarea.estado === 'en_curso' ? 'bg-blue-500' :
                    tarea.estado === 'bloqueado_cliente' ? 'bg-red-500' :
                    'bg-green-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Estado</p>
                  <p className="font-medium text-slate-800 capitalize">
                    {tarea.estado.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de nuevo responsable */}
          <div>
            <label htmlFor="nuevoResponsable" className="block text-sm font-semibold text-slate-700 mb-2">
              Nuevo Responsable <span className="text-red-500">*</span>
            </label>
            <select
              id="nuevoResponsable"
              value={nuevoResponsableId}
              onChange={(e) => setNuevoResponsableId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={loading}
              required
            >
              <option value="">Seleccionar miembro del equipo...</option>
              {miembros
                .filter(m => m.user_id !== tarea.responsable.user_id)
                .map((miembro) => (
                  <option key={miembro.user_id} value={miembro.user_id}>
                    {miembro.nombre} - {miembro.rol_en_equipo}
                  </option>
                ))}
            </select>
          </div>

          {/* Motivo de reasignación */}
          <div>
            <label htmlFor="motivo" className="block text-sm font-semibold text-slate-700 mb-2">
              Motivo de la Reasignación <span className="text-red-500">*</span>
            </label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              rows={4}
              placeholder="Ejemplo: Redistribución de carga de trabajo, especialización en el tema, urgencia del cliente..."
              disabled={loading}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Mínimo 10 caracteres. Este motivo quedará registrado en el historial.
            </p>
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
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading || !nuevoResponsableId || !motivo.trim() || motivo.length < 10}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Reasignando...
                </>
              ) : (
                <>
                  <ArrowRightLeft size={16} />
                  Confirmar Reasignación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
