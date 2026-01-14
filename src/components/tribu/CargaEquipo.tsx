'use client'
import { Users, AlertCircle } from 'lucide-react'

interface Miembro {
  user_id: string
  nombre: string
  rol_en_equipo: string
  tareasPendientes: number
  tareasEnCurso: number
}

interface CargaEquipoProps {
  miembros: Miembro[]
}

export default function CargaEquipo({ miembros }: CargaEquipoProps) {
  // Calcular promedio de tareas del equipo
  const totalTareas = miembros.reduce((sum, m) => sum + m.tareasPendientes + m.tareasEnCurso, 0)
  const promedio = miembros.length > 0 ? totalTareas / miembros.length : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Users size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Carga de Trabajo del Equipo</h2>
          <p className="text-sm text-slate-500">
            Promedio: {promedio.toFixed(1)} tareas por miembro
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {miembros.map((miembro) => {
          const totalMiembro = miembro.tareasPendientes + miembro.tareasEnCurso
          const porcentajeSobrePromedio = promedio > 0
            ? ((totalMiembro - promedio) / promedio) * 100
            : 0
          const sobrecargado = porcentajeSobrePromedio > 30

          // Calcular porcentaje de la barra
          const maxTareas = Math.max(...miembros.map(m => m.tareasPendientes + m.tareasEnCurso), 1)
          const porcentajeBarra = (totalMiembro / maxTareas) * 100

          return (
            <div
              key={miembro.user_id}
              className={`p-4 rounded-lg border ${
                sobrecargado
                  ? 'bg-red-50 border-red-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-slate-800">{miembro.nombre}</p>
                  <p className="text-xs text-slate-500">{miembro.rol_en_equipo}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-700">{totalMiembro}</p>
                  <p className="text-xs text-slate-500">tareas</p>
                </div>
              </div>

              {/* Desglose de tareas */}
              <div className="flex gap-3 mb-3 text-xs">
                <span className="text-slate-600">
                  <span className="font-semibold">{miembro.tareasPendientes}</span> pendientes
                </span>
                <span className="text-blue-600">
                  <span className="font-semibold">{miembro.tareasEnCurso}</span> en curso
                </span>
              </div>

              {/* Barra de progreso visual */}
              <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                    sobrecargado ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${porcentajeBarra}%` }}
                />
              </div>

              {/* Badge de advertencia */}
              {sobrecargado && (
                <div className="mt-3 flex items-center gap-2 text-red-700">
                  <AlertCircle size={14} />
                  <span className="text-xs font-medium">
                    {porcentajeSobrePromedio.toFixed(0)}% sobre el promedio
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {miembros.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Users size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay miembros en este equipo</p>
        </div>
      )}
    </div>
  )
}
