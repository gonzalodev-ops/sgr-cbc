'use client'

import { useState } from 'react'
import { AlertTriangle, Filter, X } from 'lucide-react'

const GRAVEDAD_COLORS = {
  BAJA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  MEDIA: 'bg-orange-100 text-orange-800 border-orange-200',
  ALTA: 'bg-red-100 text-red-800 border-red-200',
  CRITICA: 'bg-red-200 text-red-900 border-red-300 font-bold'
}

const TIPO_LABELS: Record<string, string> = {
  ERROR_TECNICO: 'Error Técnico',
  DOCUMENTACION: 'Documentación',
  PROCESO: 'Proceso',
  COMUNICACION: 'Comunicación'
}

interface Hallazgo {
  id: string
  tipo: string
  gravedad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  descripcion: string
  genera_retrabajo: boolean
}

interface HallazgoListProps {
  hallazgos: Hallazgo[]
}

export default function HallazgoList({ hallazgos }: HallazgoListProps) {
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [filtroGravedad, setFiltroGravedad] = useState<string>('')

  // Aplicar filtros
  const hallazgosFiltrados = hallazgos.filter(h => {
    const cumpleTipo = !filtroTipo || h.tipo === filtroTipo
    const cumpleGravedad = !filtroGravedad || h.gravedad === filtroGravedad
    return cumpleTipo && cumpleGravedad
  })

  const resetFiltros = () => {
    setFiltroTipo('')
    setFiltroGravedad('')
  }

  const tieneFiltrosActivos = filtroTipo || filtroGravedad

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Header con filtros */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-slate-600" />
            <h3 className="font-semibold text-slate-800">
              Hallazgos Registrados ({hallazgosFiltrados.length})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Filtro Tipo */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-500" />
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="text-sm p-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los tipos</option>
                <option value="ERROR_TECNICO">Error Técnico</option>
                <option value="DOCUMENTACION">Documentación</option>
                <option value="PROCESO">Proceso</option>
                <option value="COMUNICACION">Comunicación</option>
              </select>
            </div>

            {/* Filtro Gravedad */}
            <select
              value={filtroGravedad}
              onChange={(e) => setFiltroGravedad(e.target.value)}
              className="text-sm p-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las gravedades</option>
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="CRITICA">Crítica</option>
            </select>

            {tieneFiltrosActivos && (
              <button
                onClick={resetFiltros}
                className="text-xs text-slate-600 hover:text-slate-800 underline flex items-center gap-1"
              >
                <X size={12} />
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de hallazgos */}
      {hallazgosFiltrados.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          {hallazgos.length === 0 ? (
            <p>No hay hallazgos registrados todavía</p>
          ) : (
            <p>No hay hallazgos que coincidan con los filtros seleccionados</p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {hallazgosFiltrados.map((hallazgo) => (
            <div key={hallazgo.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                      {TIPO_LABELS[hallazgo.tipo]}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded border ${GRAVEDAD_COLORS[hallazgo.gravedad]}`}>
                      {hallazgo.gravedad}
                    </span>
                    {hallazgo.genera_retrabajo && (
                      <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded border border-purple-200">
                        Genera Retrabajo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {hallazgo.descripcion}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
