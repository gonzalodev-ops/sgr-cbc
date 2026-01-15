'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Ban, Users, Clock, Building2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

interface TareaBloqueada {
  tarea_id: string
  estado: string
  fecha_limite_oficial: string
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

interface TareaDependiente {
  tarea_id: string
  estado: string
  fecha_limite_oficial: string
  responsable: {
    nombre: string
  }
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

interface BloqueosListProps {
  onCountChange?: (count: { bloqueadas: number; dependientes: number }) => void
}

export default function BloqueosList({ onCountChange }: BloqueosListProps) {
  const [tareasBloqueadas, setTareasBloqueadas] = useState<TareaBloqueada[]>([])
  const [tareasDependientes, setTareasDependientes] = useState<TareaDependiente[]>([])
  const [loading, setLoading] = useState(true)
  const [expandBloqueadas, setExpandBloqueadas] = useState(true)
  const [expandDependientes, setExpandDependientes] = useState(true)

  useEffect(() => {
    loadBloqueos()
  }, [])

  async function loadBloqueos() {
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

      // 2. Cargar tareas bloqueadas del usuario (estado = 'bloqueado_cliente')
      const { data: bloqueadasData, error: bloqueadasError } = await supabase
        .from('tarea')
        .select(`
          tarea_id,
          estado,
          fecha_limite_oficial,
          cliente:cliente_id(nombre_comercial),
          contribuyente:contribuyente_id(rfc),
          obligacion:id_obligacion(nombre_corto)
        `)
        .eq('responsable_usuario_id', user.id)
        .eq('estado', 'bloqueado_cliente')
        .order('fecha_limite_oficial', { ascending: true })

      if (bloqueadasError) {
        console.error('Error cargando tareas bloqueadas:', bloqueadasError)
      } else {
        const transformadas = (bloqueadasData || []).map((t: any) => ({
          ...t,
          cliente: Array.isArray(t.cliente) ? t.cliente[0] : t.cliente,
          contribuyente: Array.isArray(t.contribuyente) ? t.contribuyente[0] : t.contribuyente,
          obligacion: Array.isArray(t.obligacion) ? t.obligacion[0] : t.obligacion,
        }))
        setTareasBloqueadas(transformadas)
      }

      // 3. Obtener los clientes de las tareas del usuario para encontrar dependencias
      const { data: misTareas } = await supabase
        .from('tarea')
        .select('cliente_id, contribuyente_id')
        .eq('responsable_usuario_id', user.id)
        .not('estado', 'in', '("presentado","pagado","cerrado")')

      if (misTareas && misTareas.length > 0) {
        // Obtener IDs unicos de clientes/contribuyentes
        const clienteIds = [...new Set(misTareas.map(t => t.cliente_id))]
        const contribuyenteIds = [...new Set(misTareas.map(t => t.contribuyente_id))]

        // 4. Buscar tareas de otros usuarios que esten esperando en los mismos clientes/contribuyentes
        // Estas podrian ser tareas que dependen de mi trabajo
        const { data: dependientesData, error: dependientesError } = await supabase
          .from('tarea')
          .select(`
            tarea_id,
            estado,
            fecha_limite_oficial,
            responsable:responsable_usuario_id(nombre),
            cliente:cliente_id(nombre_comercial),
            contribuyente:contribuyente_id(rfc),
            obligacion:id_obligacion(nombre_corto)
          `)
          .in('contribuyente_id', contribuyenteIds)
          .neq('responsable_usuario_id', user.id)
          .in('estado', ['pendiente', 'en_curso', 'bloqueado_cliente'])
          .order('fecha_limite_oficial', { ascending: true })
          .limit(10)

        if (dependientesError) {
          console.error('Error cargando tareas dependientes:', dependientesError)
        } else {
          const transformadas = (dependientesData || []).map((t: any) => ({
            ...t,
            responsable: Array.isArray(t.responsable) ? t.responsable[0] : t.responsable,
            cliente: Array.isArray(t.cliente) ? t.cliente[0] : t.cliente,
            contribuyente: Array.isArray(t.contribuyente) ? t.contribuyente[0] : t.contribuyente,
            obligacion: Array.isArray(t.obligacion) ? t.obligacion[0] : t.obligacion,
          }))
          setTareasDependientes(transformadas)
        }
      }

    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Notificar conteos al componente padre
  useEffect(() => {
    if (onCountChange) {
      onCountChange({
        bloqueadas: tareasBloqueadas.length,
        dependientes: tareasDependientes.length
      })
    }
  }, [tareasBloqueadas.length, tareasDependientes.length, onCountChange])

  function getDiasRestantes(fechaLimite: string) {
    const hoy = new Date()
    const limite = new Date(fechaLimite)
    const diffDias = Math.ceil((limite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDias < 0) {
      return <span className="text-red-600 font-bold text-xs">Vencida ({Math.abs(diffDias)}d)</span>
    } else if (diffDias === 0) {
      return <span className="text-orange-600 font-bold text-xs">Hoy</span>
    } else if (diffDias <= 3) {
      return <span className="text-yellow-600 font-bold text-xs">{diffDias}d</span>
    } else {
      return <span className="text-slate-600 text-xs">{diffDias}d</span>
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500">Cargando bloqueos...</p>
        </div>
      </div>
    )
  }

  const hayBloqueos = tareasBloqueadas.length > 0 || tareasDependientes.length > 0

  if (!hayBloqueos) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-6">
        <div className="flex items-center justify-center gap-3 text-green-700">
          <Ban size={24} className="opacity-50" />
          <div>
            <p className="font-medium">Sin bloqueos activos</p>
            <p className="text-sm text-green-600">Todas tus tareas fluyen sin impedimentos</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Seccion: Mis tareas bloqueadas */}
      {tareasBloqueadas.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 overflow-hidden">
          <button
            onClick={() => setExpandBloqueadas(!expandBloqueadas)}
            className="w-full px-4 py-3 bg-red-100 border-b border-red-200 flex items-center justify-between hover:bg-red-150 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Ban size={18} className="text-red-600" />
              <h3 className="font-semibold text-red-800">
                Mis Tareas Bloqueadas ({tareasBloqueadas.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Esperando info/pago del cliente</span>
              {expandBloqueadas ? <ChevronUp size={18} className="text-red-600" /> : <ChevronDown size={18} className="text-red-600" />}
            </div>
          </button>

          {expandBloqueadas && (
            <div className="p-4 space-y-2">
              {tareasBloqueadas.map((tarea) => (
                <div
                  key={tarea.tarea_id}
                  className="bg-white rounded-lg p-3 border border-red-200 flex items-center justify-between hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-800 truncate text-sm">
                        {tarea.cliente?.nombre_comercial || 'Sin cliente'}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {tarea.contribuyente?.rfc || 'Sin RFC'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate">
                      {tarea.obligacion?.nombre_corto || 'Sin obligacion'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Vence</p>
                      {getDiasRestantes(tarea.fecha_limite_oficial)}
                    </div>
                    <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                      BLOQUEADA
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Seccion: Tareas que dependen de mi */}
      {tareasDependientes.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
          <button
            onClick={() => setExpandDependientes(!expandDependientes)}
            className="w-full px-4 py-3 bg-amber-100 border-b border-amber-200 flex items-center justify-between hover:bg-amber-150 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users size={18} className="text-amber-600" />
              <h3 className="font-semibold text-amber-800">
                Tareas Relacionadas de Companeros ({tareasDependientes.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-600">Mismo cliente/contribuyente</span>
              {expandDependientes ? <ChevronUp size={18} className="text-amber-600" /> : <ChevronDown size={18} className="text-amber-600" />}
            </div>
          </button>

          {expandDependientes && (
            <div className="p-4 space-y-2">
              {tareasDependientes.map((tarea) => (
                <div
                  key={tarea.tarea_id}
                  className="bg-white rounded-lg p-3 border border-amber-200 flex items-center justify-between hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-800 truncate text-sm">
                        {tarea.cliente?.nombre_comercial || 'Sin cliente'}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {tarea.contribuyente?.rfc || 'Sin RFC'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate">
                      {tarea.obligacion?.nombre_corto || 'Sin obligacion'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Responsable</p>
                      <p className="text-xs font-medium text-slate-700">
                        {tarea.responsable?.nombre || 'Sin asignar'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Vence</p>
                      {getDiasRestantes(tarea.fecha_limite_oficial)}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      tarea.estado === 'bloqueado_cliente'
                        ? 'bg-red-100 text-red-700'
                        : tarea.estado === 'en_curso'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {tarea.estado.replace(/_/g, ' ').toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nota informativa */}
      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <AlertTriangle size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500">
          Las tareas bloqueadas requieren informacion o pago del cliente para continuar.
          Las tareas relacionadas muestran el trabajo de companeros en los mismos contribuyentes
          que podria estar conectado con tu trabajo.
        </p>
      </div>
    </div>
  )
}
