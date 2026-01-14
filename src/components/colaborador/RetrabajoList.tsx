'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { AlertTriangle, RefreshCw, CheckCircle, Clock, FileText, Building2 } from 'lucide-react'

interface Retrabajo {
  retrabajo_id: string
  estado: string
  fecha_limite: string
  finding: {
    tipo: string
    gravedad: string
    descripcion: string
  }
  tarea: {
    cliente: {
      nombre_comercial: string
    }
    contribuyente: {
      rfc: string
    }
    obligacion: {
      nombre_corto: string
    }
  }
}

export default function RetrabajoList() {
  const [retrabajos, setRetrabajos] = useState<Retrabajo[]>([])
  const [loading, setLoading] = useState(true)
  const [completando, setCompletando] = useState<string | null>(null)

  useEffect(() => {
    loadRetrabajos()
  }, [])

  async function loadRetrabajos() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      setLoading(true)

      // 1. Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('Error obteniendo usuario:', userError)
        setLoading(false)
        return
      }

      // 2. Cargar retrabajos pendientes del usuario
      const { data, error } = await supabase
        .from('retrabajo')
        .select(`
          retrabajo_id,
          estado,
          fecha_limite,
          finding:finding_id(
            tipo,
            gravedad,
            descripcion
          ),
          tarea:tarea_id(
            cliente:cliente_id(nombre_comercial),
            contribuyente:contribuyente_id(rfc),
            obligacion:id_obligacion(nombre_corto)
          )
        `)
        .eq('responsable_id', user.id)
        .neq('estado', 'COMPLETADO')
        .order('fecha_limite', { ascending: true })

      if (error) {
        console.error('Error cargando retrabajos:', error)
      } else {
        setRetrabajos(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function marcarCompletado(retrabajoId: string) {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      setCompletando(retrabajoId)

      const { error } = await supabase
        .from('retrabajo')
        .update({
          estado: 'COMPLETADO',
          fecha_completado: new Date().toISOString()
        })
        .eq('retrabajo_id', retrabajoId)

      if (error) {
        console.error('Error completando retrabajo:', error)
        alert('Error al marcar como completado')
      } else {
        // Recargar lista
        await loadRetrabajos()
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Error al marcar como completado')
    } finally {
      setCompletando(null)
    }
  }

  function getUrgenciaBadge(fechaLimite: string) {
    const hoy = new Date()
    const limite = new Date(fechaLimite)
    const diffDias = Math.ceil((limite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDias < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
          <AlertTriangle size={12} />
          VENCIDO
        </span>
      )
    } else if (diffDias === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
          <Clock size={12} />
          HOY
        </span>
      )
    } else if (diffDias <= 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
          <Clock size={12} />
          {diffDias} DÍA{diffDias > 1 ? 'S' : ''}
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          <Clock size={12} />
          {diffDias} días
        </span>
      )
    }
  }

  function getGravedadColor(gravedad: string) {
    switch (gravedad?.toUpperCase()) {
      case 'CRÍTICO':
      case 'CRITICO':
        return 'bg-red-100 text-red-700'
      case 'ALTO':
        return 'bg-orange-100 text-orange-700'
      case 'MEDIO':
        return 'bg-yellow-100 text-yellow-700'
      case 'BAJO':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-3 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500">Cargando retrabajos...</p>
        </div>
      </div>
    )
  }

  if (retrabajos.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-8">
        <div className="flex items-center justify-center gap-3 text-green-700">
          <CheckCircle size={24} />
          <p className="font-medium">No tienes retrabajos pendientes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-orange-50 rounded-xl border-2 border-orange-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500 text-white rounded-lg">
            <RefreshCw size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Retrabajos Pendientes</h2>
            <p className="text-sm text-slate-600">Hallazgos que requieren corrección</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-full font-bold text-sm">
          <AlertTriangle size={16} />
          {retrabajos.length}
        </div>
      </div>

      <div className="space-y-3">
        {retrabajos.map((retrabajo) => (
          <div
            key={retrabajo.retrabajo_id}
            className="bg-white rounded-lg border border-orange-200 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                {/* Header con cliente y urgencia */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 text-slate-700">
                    <Building2 size={14} />
                    <span className="font-semibold text-sm">
                      {retrabajo.tarea?.cliente?.nombre_comercial || 'Sin cliente'}
                    </span>
                  </div>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs text-slate-600 font-mono">
                    {retrabajo.tarea?.contribuyente?.rfc || 'Sin RFC'}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs text-slate-600">
                    {retrabajo.tarea?.obligacion?.nombre_corto || 'Sin obligación'}
                  </span>
                </div>

                {/* Hallazgo */}
                <div className="flex items-start gap-2">
                  <FileText size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getGravedadColor(retrabajo.finding?.gravedad)}`}>
                        {retrabajo.finding?.gravedad?.toUpperCase() || 'SIN GRAVEDAD'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {retrabajo.finding?.tipo || 'Sin tipo'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      {retrabajo.finding?.descripcion || 'Sin descripción'}
                    </p>
                  </div>
                </div>

                {/* Footer con fecha límite */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Fecha límite:</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {new Date(retrabajo.fecha_limite).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  {getUrgenciaBadge(retrabajo.fecha_limite)}
                </div>
              </div>

              {/* Botón Completar */}
              <button
                onClick={() => marcarCompletado(retrabajo.retrabajo_id)}
                disabled={completando === retrabajo.retrabajo_id}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
              >
                {completando === retrabajo.retrabajo_id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Completar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
