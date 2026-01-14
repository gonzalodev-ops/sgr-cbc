'use client'

import { useState, useEffect } from 'react'
import { X, Save, Calendar, User, Users, AlertCircle } from 'lucide-react'

interface Colaborador {
  user_id: string
  nombre: string
  email: string
  activo: boolean
}

interface AusenciaFormData {
  colaborador_id: string
  fecha_inicio: string
  fecha_fin: string
  tipo: 'VACACIONES' | 'INCAPACIDAD' | 'PERMISO' | 'OTRO'
  suplente_id: string | null
  motivo: string | null
}

interface AusenciaFormProps {
  colaboradores: Colaborador[]
  ausenciaInicial?: {
    ausencia_id: string
    colaborador_id: string
    fecha_inicio: string
    fecha_fin: string
    tipo: 'VACACIONES' | 'INCAPACIDAD' | 'PERMISO' | 'OTRO'
    suplente_id: string | null
    motivo: string | null
  }
  onGuardar: (data: AusenciaFormData) => Promise<void>
  onCancelar: () => void
}

const TIPOS_AUSENCIA = [
  { value: 'VACACIONES', label: 'Vacaciones' },
  { value: 'INCAPACIDAD', label: 'Incapacidad' },
  { value: 'PERMISO', label: 'Permiso' },
  { value: 'OTRO', label: 'Otro' }
] as const

export default function AusenciaForm({
  colaboradores,
  ausenciaInicial,
  onGuardar,
  onCancelar
}: AusenciaFormProps) {
  const [formData, setFormData] = useState<AusenciaFormData>({
    colaborador_id: ausenciaInicial?.colaborador_id || '',
    fecha_inicio: ausenciaInicial?.fecha_inicio || '',
    fecha_fin: ausenciaInicial?.fecha_fin || '',
    tipo: ausenciaInicial?.tipo || 'VACACIONES',
    suplente_id: ausenciaInicial?.suplente_id || '',
    motivo: ausenciaInicial?.motivo || ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [validacion, setValidacion] = useState<{ campo: string; mensaje: string } | null>(null)

  // Validar fechas
  useEffect(() => {
    if (formData.fecha_inicio && formData.fecha_fin) {
      if (formData.fecha_fin < formData.fecha_inicio) {
        setValidacion({
          campo: 'fecha_fin',
          mensaje: 'La fecha de fin debe ser posterior o igual a la fecha de inicio'
        })
      } else {
        setValidacion(null)
      }
    }
  }, [formData.fecha_inicio, formData.fecha_fin])

  const handleChange = (field: keyof AusenciaFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (!formData.colaborador_id) {
      setError('Debe seleccionar un colaborador')
      return
    }

    if (!formData.fecha_inicio || !formData.fecha_fin) {
      setError('Las fechas de inicio y fin son requeridas')
      return
    }

    if (formData.fecha_fin < formData.fecha_inicio) {
      setError('La fecha de fin debe ser posterior o igual a la fecha de inicio')
      return
    }

    if (formData.suplente_id === formData.colaborador_id) {
      setError('El suplente debe ser diferente al colaborador ausente')
      return
    }

    setLoading(true)
    try {
      await onGuardar(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la ausencia')
    } finally {
      setLoading(false)
    }
  }

  const colaboradorSeleccionado = colaboradores.find(c => c.user_id === formData.colaborador_id)
  const suplenteSeleccionado = colaboradores.find(c => c.user_id === formData.suplente_id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {ausenciaInicial ? 'Editar Ausencia' : 'Nueva Ausencia'}
              </h2>
              <p className="text-sm text-slate-500">
                Registrar ausencia y reasignar tareas automáticamente
              </p>
            </div>
          </div>
          <button
            onClick={onCancelar}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Colaborador */}
          <div>
            <label htmlFor="colaborador" className="block text-sm font-semibold text-slate-700 mb-2">
              Colaborador Ausente <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                id="colaborador"
                value={formData.colaborador_id}
                onChange={(e) => handleChange('colaborador_id', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                disabled={loading || !!ausenciaInicial}
                required
              >
                <option value="">Seleccionar colaborador...</option>
                {colaboradores
                  .filter(c => c.activo)
                  .map((colaborador) => (
                    <option key={colaborador.user_id} value={colaborador.user_id}>
                      {colaborador.nombre} ({colaborador.email})
                    </option>
                  ))}
              </select>
            </div>
            {ausenciaInicial && (
              <p className="text-xs text-slate-500 mt-1">
                El colaborador no puede modificarse después de crear la ausencia
              </p>
            )}
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fecha_inicio" className="block text-sm font-semibold text-slate-700 mb-2">
                Fecha de Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={(e) => handleChange('fecha_inicio', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="fecha_fin" className="block text-sm font-semibold text-slate-700 mb-2">
                Fecha de Fin <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="fecha_fin"
                value={formData.fecha_fin}
                onChange={(e) => handleChange('fecha_fin', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                  validacion?.campo === 'fecha_fin' ? 'border-red-300' : 'border-slate-300'
                }`}
                disabled={loading}
                required
              />
              {validacion?.campo === 'fecha_fin' && (
                <p className="text-xs text-red-600 mt-1">{validacion.mensaje}</p>
              )}
            </div>
          </div>

          {/* Tipo de Ausencia */}
          <div>
            <label htmlFor="tipo" className="block text-sm font-semibold text-slate-700 mb-2">
              Tipo de Ausencia <span className="text-red-500">*</span>
            </label>
            <select
              id="tipo"
              value={formData.tipo}
              onChange={(e) => handleChange('tipo', e.target.value as AusenciaFormData['tipo'])}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              disabled={loading}
              required
            >
              {TIPOS_AUSENCIA.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          {/* Suplente (opcional) */}
          <div>
            <label htmlFor="suplente" className="block text-sm font-semibold text-slate-700 mb-2">
              Suplente (Opcional)
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                id="suplente"
                value={formData.suplente_id || ''}
                onChange={(e) => handleChange('suplente_id', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                disabled={loading}
              >
                <option value="">Sin suplente (reasignar al líder del equipo)</option>
                {colaboradores
                  .filter(c => c.activo && c.user_id !== formData.colaborador_id)
                  .map((colaborador) => (
                    <option key={colaborador.user_id} value={colaborador.user_id}>
                      {colaborador.nombre}
                    </option>
                  ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Si no se selecciona suplente, las tareas se reasignarán automáticamente al líder del equipo
            </p>
          </div>

          {/* Motivo */}
          <div>
            <label htmlFor="motivo" className="block text-sm font-semibold text-slate-700 mb-2">
              Motivo / Observaciones
            </label>
            <textarea
              id="motivo"
              value={formData.motivo || ''}
              onChange={(e) => handleChange('motivo', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
              rows={3}
              placeholder="Información adicional sobre la ausencia..."
              disabled={loading}
            />
          </div>

          {/* Información de reasignación */}
          {formData.colaborador_id && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    Reasignación Automática
                  </p>
                  <p className="text-sm text-blue-700">
                    {formData.suplente_id ? (
                      <>
                        Las tareas activas de <strong>{colaboradorSeleccionado?.nombre}</strong> se
                        reasignarán automáticamente a <strong>{suplenteSeleccionado?.nombre}</strong>.
                      </>
                    ) : (
                      <>
                        Las tareas activas de <strong>{colaboradorSeleccionado?.nombre}</strong> se
                        reasignarán automáticamente al líder de su equipo.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

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
              onClick={onCancelar}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading || !!validacion}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {ausenciaInicial ? 'Actualizar Ausencia' : 'Registrar Ausencia'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
