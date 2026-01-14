'use client'

import { useState, useEffect } from 'react'
import { History, Calendar, User, Clock, ChevronRight } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface HistorialFechasProps {
  tareaId: string
}

interface AjusteFecha {
  log_id: string
  fecha_anterior: string
  fecha_nueva: string
  motivo: string
  created_at: string
  usuario: {
    nombre: string
    email?: string
  }
}

export default function HistorialFechas({ tareaId }: HistorialFechasProps) {
  const [historial, setHistorial] = useState<AjusteFecha[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchHistorial() {
      setLoading(true)
      setError('')

      try {
        const { data, error: fetchError } = await supabase
          .from('fecha_ajuste_log')
          .select(`
            log_id,
            fecha_anterior,
            fecha_nueva,
            motivo,
            created_at,
            usuario:usuario_id (
              nombre,
              email
            )
          `)
          .eq('tarea_id', tareaId)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        // Transformar arrays de Supabase a objetos
        const transformedData = (data || []).map((h: any) => ({
          ...h,
          usuario: Array.isArray(h.usuario) ? h.usuario[0] : h.usuario
        }))
        setHistorial(transformedData)
      } catch (err) {
        console.error('Error al cargar historial:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar el historial')
      } finally {
        setLoading(false)
      }
    }

    if (tareaId) {
      fetchHistorial()
    }
  }, [tareaId, supabase])

  const formatFecha = (fecha: string) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatFechaHora = (fechaHora: string) => {
    return new Date(fechaHora).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Cargando historial de cambios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <div className="flex items-center gap-3 text-red-600">
          <History size={24} />
          <div>
            <p className="font-semibold">Error al cargar historial</p>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (historial.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="p-4 bg-slate-100 rounded-full">
            <History size={32} className="text-slate-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-700 mb-1">Sin cambios de fecha</p>
            <p className="text-sm text-slate-500">
              No hay ajustes de fecha registrados para esta tarea
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 text-white p-4 flex items-center gap-3">
        <div className="p-2 bg-slate-700 rounded-lg">
          <History size={20} />
        </div>
        <div>
          <h3 className="font-bold text-lg">Historial de Cambios de Fecha</h3>
          <p className="text-xs text-slate-300">
            {historial.length} cambio{historial.length !== 1 ? 's' : ''} registrado{historial.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        <div className="relative">
          {/* Línea vertical del timeline */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

          {/* Elementos del historial */}
          <div className="space-y-6">
            {historial.map((item, index) => (
              <div key={item.log_id} className="relative pl-14">
                {/* Punto en el timeline */}
                <div className="absolute left-4 top-2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-md" />

                {/* Contenido */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow">
                  {/* Fecha del cambio */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-xs text-slate-500 font-medium">
                        {formatFechaHora(item.created_at)}
                      </span>
                      {index === 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                          Más reciente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cambio de fecha */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700">
                        {formatFecha(item.fecha_anterior)}
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-slate-400" />
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                      <Calendar size={14} className="text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700">
                        {formatFecha(item.fecha_nueva)}
                      </span>
                    </div>
                  </div>

                  {/* Motivo */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Motivo:</p>
                    <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                      {item.motivo}
                    </p>
                  </div>

                  {/* Usuario */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User size={14} className="text-slate-400" />
                    <span>
                      Realizado por: <strong className="text-slate-700">{item.usuario?.nombre || 'Usuario desconocido'}</strong>
                      {item.usuario?.email && (
                        <span className="ml-1">({item.usuario.email})</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer con estadísticas */}
      <div className="bg-slate-50 border-t border-slate-200 p-4">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Total de ajustes: <strong>{historial.length}</strong></span>
          {historial.length > 0 && (
            <span>
              Último cambio: {formatFechaHora(historial[0].created_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
