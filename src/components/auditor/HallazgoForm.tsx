'use client'

import { useState } from 'react'
import { Save, X, AlertTriangle } from 'lucide-react'

const TIPOS = [
  { value: 'ERROR_TECNICO', label: 'Error Técnico' },
  { value: 'DOCUMENTACION', label: 'Documentación' },
  { value: 'PROCESO', label: 'Proceso' },
  { value: 'COMUNICACION', label: 'Comunicación' }
]

const GRAVEDADES = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' }
]

interface HallazgoFormData {
  tipo: string
  gravedad: string
  descripcion: string
  genera_retrabajo: boolean
}

interface HallazgoFormProps {
  onSave: (hallazgo: HallazgoFormData) => void
  onCancel: () => void
}

export default function HallazgoForm({ onSave, onCancel }: HallazgoFormProps) {
  const [formData, setFormData] = useState<HallazgoFormData>({
    tipo: 'ERROR_TECNICO',
    gravedad: 'MEDIA',
    descripcion: '',
    genera_retrabajo: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.tipo) {
      newErrors.tipo = 'Debes seleccionar un tipo de hallazgo'
    }

    if (!formData.gravedad) {
      newErrors.gravedad = 'Debes seleccionar una gravedad'
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria'
    } else if (formData.descripcion.trim().length < 10) {
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      onSave(formData)
      // Reset form
      setFormData({
        tipo: 'ERROR_TECNICO',
        gravedad: 'MEDIA',
        descripcion: '',
        genera_retrabajo: false
      })
      setErrors({})
    }
  }

  const handleChange = (field: keyof HallazgoFormData, value: HallazgoFormData[keyof HallazgoFormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
        <AlertTriangle size={20} className="text-amber-600" />
        <h3 className="font-semibold text-slate-800">Registrar Hallazgo</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tipo de Hallazgo <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.tipo ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              {TIPOS.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
            {errors.tipo && (
              <p className="text-xs text-red-500 mt-1">{errors.tipo}</p>
            )}
          </div>

          {/* Gravedad */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gravedad <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.gravedad}
              onChange={(e) => handleChange('gravedad', e.target.value)}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.gravedad ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              {GRAVEDADES.map(gravedad => (
                <option key={gravedad.value} value={gravedad.value}>
                  {gravedad.label}
                </option>
              ))}
            </select>
            {errors.gravedad && (
              <p className="text-xs text-red-500 mt-1">{errors.gravedad}</p>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Descripción del Hallazgo <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Describe detalladamente el hallazgo encontrado..."
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.descripcion ? 'border-red-500' : 'border-slate-300'
            }`}
            rows={4}
          />
          {errors.descripcion && (
            <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            {formData.descripcion.length} caracteres (mínimo 10)
          </p>
        </div>

        {/* Genera Retrabajo */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <input
            type="checkbox"
            id="genera_retrabajo"
            checked={formData.genera_retrabajo}
            onChange={(e) => handleChange('genera_retrabajo', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="genera_retrabajo" className="text-sm text-slate-700 cursor-pointer">
            Este hallazgo genera retrabajo
          </label>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <X size={16} />
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Guardar Hallazgo
          </button>
        </div>
      </form>
    </div>
  )
}
