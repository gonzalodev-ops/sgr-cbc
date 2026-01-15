'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  CalendarDays,
  AlertTriangle,
  Clock,
  CheckCircle,
  Play,
  Ban,
  Building2,
  FileText
} from 'lucide-react'

interface TareaMiDia {
  tarea_id: string
  estado: string
  fecha_limite_oficial: string
  prioridad: string
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

interface ColaboradorInfo {
  nombre: string
  equipo: string
}

type PrioridadCategoria = 'vencidas' | 'hoy' | 'proximos3dias' | 'bloqueadas' | 'resto'

export default function MiDiaPage() {
  const [tareas, setTareas] = useState<TareaMiDia[]>([])
  const [colaboradorInfo, setColaboradorInfo] = useState<ColaboradorInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [actualizando, setActualizando] = useState<string | null>(null)

  useEffect(() => {
    loadDatos()
  }, [])

  async function loadDatos() {
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

      // 2. Obtener información del usuario
      const { data: userData } = await supabase
        .from('users')
        .select(`
          nombre,
          team_members (
            teams:team_id (nombre)
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (userData) {
        const teamsData = userData.team_members?.[0]?.teams as any
        const equipoNombre = Array.isArray(teamsData) ? teamsData[0]?.nombre : teamsData?.nombre
        setColaboradorInfo({
          nombre: userData.nombre,
          equipo: equipoNombre || 'Sin equipo'
        })
      }

      // 3. Cargar tareas del usuario (solo pendientes o en curso)
      const { data: tareasData, error: tareasError } = await supabase
        .from('tarea')
        .select(`
          tarea_id,
          estado,
          fecha_limite_oficial,
          prioridad,
          cliente:cliente_id(nombre_comercial),
          contribuyente:contribuyente_id(rfc),
          obligacion:id_obligacion(nombre_corto)
        `)
        .eq('responsable_usuario_id', user.id)
        .not('estado', 'in', '("presentado","pagado","cerrado")')
        .order('fecha_limite_oficial', { ascending: true })

      if (tareasError) {
        console.error('Error cargando tareas:', tareasError)
      } else {
        // Transformar datos de Supabase (relaciones vienen como arrays)
        setTareas(tareasData?.map((t: any) => ({
          ...t,
          cliente: Array.isArray(t.cliente) ? t.cliente[0] : t.cliente,
          contribuyente: Array.isArray(t.contribuyente) ? t.contribuyente[0] : t.contribuyente,
          obligacion: Array.isArray(t.obligacion) ? t.obligacion[0] : t.obligacion,
        })) || [])
      }

    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Algoritmo de priorización
  const tareasOrdenadas = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const en3Dias = new Date(hoy)
    en3Dias.setDate(en3Dias.getDate() + 3)

    // Clasificar tareas
    const categorizadas = tareas.map(tarea => {
      const fechaLimite = new Date(tarea.fecha_limite_oficial)
      fechaLimite.setHours(0, 0, 0, 0)

      let categoria: PrioridadCategoria
      let ordenPrioridad: number

      if (tarea.estado === 'bloqueado_cliente') {
        // Las bloqueadas tienen prioridad 4
        categoria = 'bloqueadas'
        ordenPrioridad = 4
      } else if (fechaLimite < hoy) {
        // Prioridad 1: Tareas vencidas
        categoria = 'vencidas'
        ordenPrioridad = 1
      } else if (fechaLimite.getTime() === hoy.getTime()) {
        // Prioridad 2: Tareas que vencen hoy
        categoria = 'hoy'
        ordenPrioridad = 2
      } else if (fechaLimite <= en3Dias) {
        // Prioridad 3: Tareas que vencen en próximos 3 días
        categoria = 'proximos3dias'
        ordenPrioridad = 3
      } else {
        // Prioridad 5: Resto por fecha de deadline ascendente
        categoria = 'resto'
        ordenPrioridad = 5
      }

      return {
        ...tarea,
        categoria,
        ordenPrioridad,
        fechaLimiteDate: fechaLimite
      }
    })

    // Ordenar por prioridad y luego por fecha
    return categorizadas.sort((a, b) => {
      if (a.ordenPrioridad !== b.ordenPrioridad) {
        return a.ordenPrioridad - b.ordenPrioridad
      }
      return a.fechaLimiteDate.getTime() - b.fechaLimiteDate.getTime()
    })
  }, [tareas])

  // Cambiar estado de tarea
  async function cambiarEstado(tareaId: string, nuevoEstado: string) {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      setActualizando(tareaId)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Obtener estado anterior
      const tareaActual = tareas.find(t => t.tarea_id === tareaId)
      const estadoAnterior = tareaActual?.estado || 'pendiente'

      // Actualizar tarea
      const { error: updateError } = await supabase
        .from('tarea')
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq('tarea_id', tareaId)

      if (updateError) {
        console.error('Error actualizando tarea:', updateError)
        return
      }

      // Registrar evento
      await supabase
        .from('tarea_evento')
        .insert({
          tarea_id: tareaId,
          tipo_evento: 'cambio_estado',
          estado_anterior: estadoAnterior,
          estado_nuevo: nuevoEstado,
          actor_usuario_id: user.id,
          occurred_at: new Date().toISOString()
        })

      // Recargar datos
      await loadDatos()

    } catch (err) {
      console.error('Error:', err)
    } finally {
      setActualizando(null)
    }
  }

  function getIndicadorUrgencia(categoria: PrioridadCategoria, fechaLimite: string) {
    const hoy = new Date()
    const limite = new Date(fechaLimite)
    const diffDias = Math.ceil((limite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

    switch (categoria) {
      case 'vencidas':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            <AlertTriangle size={16} className="flex-shrink-0" />
            <span className="font-bold text-sm">VENCIDA ({Math.abs(diffDias)}d)</span>
          </div>
        )
      case 'hoy':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 border border-orange-300 text-orange-700 rounded-lg">
            <Clock size={16} className="flex-shrink-0" />
            <span className="font-bold text-sm">HOY</span>
          </div>
        )
      case 'proximos3dias':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-lg">
            <Clock size={16} className="flex-shrink-0" />
            <span className="font-bold text-sm">{diffDias} DIA{diffDias > 1 ? 'S' : ''}</span>
          </div>
        )
      case 'bloqueadas':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 border border-purple-300 text-purple-700 rounded-lg">
            <Ban size={16} className="flex-shrink-0" />
            <span className="font-bold text-sm">BLOQUEADA</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-600 rounded-lg">
            <CalendarDays size={16} className="flex-shrink-0" />
            <span className="font-medium text-sm">{diffDias}d</span>
          </div>
        )
    }
  }

  function getEstadoBadge(estado: string) {
    const config: Record<string, { label: string; className: string }> = {
      pendiente: { label: 'Pendiente', className: 'bg-slate-100 text-slate-700' },
      en_curso: { label: 'En Curso', className: 'bg-blue-100 text-blue-700' },
      pendiente_evidencia: { label: 'Pend. Evidencia', className: 'bg-purple-100 text-purple-700' },
      en_validacion: { label: 'En Validacion', className: 'bg-yellow-100 text-yellow-700' },
      bloqueado_cliente: { label: 'Bloqueado', className: 'bg-red-100 text-red-700' },
      rechazado: { label: 'Rechazado', className: 'bg-red-100 text-red-700' }
    }

    const { label, className } = config[estado] || { label: estado, className: 'bg-slate-100 text-slate-700' }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${className}`}>
        {label}
      </span>
    )
  }

  function getBorderColor(categoria: PrioridadCategoria) {
    switch (categoria) {
      case 'vencidas': return 'border-l-4 border-l-red-500'
      case 'hoy': return 'border-l-4 border-l-orange-500'
      case 'proximos3dias': return 'border-l-4 border-l-yellow-500'
      case 'bloqueadas': return 'border-l-4 border-l-purple-500'
      default: return 'border-l-4 border-l-slate-300'
    }
  }

  // Contadores por categoria
  const contadores = useMemo(() => {
    return {
      vencidas: tareasOrdenadas.filter(t => t.categoria === 'vencidas').length,
      hoy: tareasOrdenadas.filter(t => t.categoria === 'hoy').length,
      proximos3dias: tareasOrdenadas.filter(t => t.categoria === 'proximos3dias').length,
      bloqueadas: tareasOrdenadas.filter(t => t.categoria === 'bloqueadas').length,
      total: tareasOrdenadas.length
    }
  }, [tareasOrdenadas])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Cargando tu dia...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 shadow-lg text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <CalendarDays size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Mi Dia</h1>
              <p className="text-blue-100">
                {colaboradorInfo?.nombre || 'Colaborador'} - {colaboradorInfo?.equipo || 'Sin equipo'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-200">
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            <p className="text-3xl font-bold mt-1">{contadores.total} tareas</p>
          </div>
        </div>
      </div>

      {/* KPIs de urgencia */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{contadores.vencidas}</p>
              <p className="text-xs text-slate-500 uppercase font-bold">Vencidas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{contadores.hoy}</p>
              <p className="text-xs text-slate-500 uppercase font-bold">Hoy</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{contadores.proximos3dias}</p>
              <p className="text-xs text-slate-500 uppercase font-bold">Prox. 3 dias</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Ban size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{contadores.bloqueadas}</p>
              <p className="text-xs text-slate-500 uppercase font-bold">Bloqueadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de tareas priorizada */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-slate-600" />
            <h2 className="text-lg font-bold text-slate-800">Agenda Priorizada</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">Tareas ordenadas por urgencia y prioridad</p>
        </div>

        {tareasOrdenadas.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No tienes tareas pendientes</h3>
            <p className="text-slate-500">Todas tus tareas estan completadas o no tienes tareas asignadas.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tareasOrdenadas.map((tarea, index) => (
              <div
                key={tarea.tarea_id}
                className={`p-4 hover:bg-slate-50 transition-colors ${getBorderColor(tarea.categoria)}`}
              >
                <div className="flex items-center gap-4">
                  {/* Numero de orden */}
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-600">{index + 1}</span>
                  </div>

                  {/* Informacion de la tarea */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {tarea.cliente?.nombre_comercial || 'Sin cliente'}
                      </span>
                      <span className="text-slate-400">-</span>
                      <span className="text-sm text-slate-600 font-mono truncate">
                        {tarea.contribuyente?.rfc || 'Sin RFC'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">
                        {tarea.obligacion?.nombre_corto || 'Sin obligacion'}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-xs text-slate-500">
                        Vence: {new Date(tarea.fecha_limite_oficial).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Estado actual */}
                  <div className="flex-shrink-0">
                    {getEstadoBadge(tarea.estado)}
                  </div>

                  {/* Indicador de urgencia */}
                  <div className="flex-shrink-0">
                    {getIndicadorUrgencia(tarea.categoria, tarea.fecha_limite_oficial)}
                  </div>

                  {/* Acciones rapidas */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {tarea.estado === 'pendiente' && (
                      <button
                        onClick={() => cambiarEstado(tarea.tarea_id, 'en_curso')}
                        disabled={actualizando === tarea.tarea_id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors"
                        title="Iniciar tarea"
                      >
                        {actualizando === tarea.tarea_id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Play size={14} />
                        )}
                        <span>Iniciar</span>
                      </button>
                    )}
                    {tarea.estado === 'en_curso' && (
                      <button
                        onClick={() => cambiarEstado(tarea.tarea_id, 'pendiente_evidencia')}
                        disabled={actualizando === tarea.tarea_id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors"
                        title="Marcar para evidencia"
                      >
                        {actualizando === tarea.tarea_id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <FileText size={14} />
                        )}
                        <span>Evidencia</span>
                      </button>
                    )}
                    {(tarea.estado === 'pendiente_evidencia' || tarea.estado === 'rechazado') && (
                      <button
                        onClick={() => cambiarEstado(tarea.tarea_id, 'en_validacion')}
                        disabled={actualizando === tarea.tarea_id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors"
                        title="Enviar a validacion"
                      >
                        {actualizando === tarea.tarea_id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        <span>Validar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="text-xs text-slate-500 uppercase font-bold mb-3">Leyenda de Prioridad</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-slate-600">Vencidas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-slate-600">Vencen hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-slate-600">Proximos 3 dias</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-slate-600">Bloqueadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-300 rounded"></div>
            <span className="text-slate-600">Resto (por fecha)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
