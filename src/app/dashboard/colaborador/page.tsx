'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User, CheckCircle, Clock, AlertTriangle, ListTodo, RefreshCw } from 'lucide-react'
import RetrabajoList from '@/components/colaborador/RetrabajoList'

interface TareaData {
  tarea_id: string
  estado: string
  fecha_limite_oficial: string
  fecha_presentacion_estimada: string
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
  periodicidad: {
    nombre: string
  }
}

interface ColaboradorInfo {
  nombre: string
  email: string
  rol_global: string
  equipo: string
}

export default function AgendaColaboradorPage() {
  const [tareas, setTareas] = useState<TareaData[]>([])
  const [colaboradorInfo, setColaboradorInfo] = useState<ColaboradorInfo | null>(null)
  const [cantidadRetrabajos, setCantidadRetrabajos] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('all')

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
          email,
          rol_global,
          team_members (
            teams:team_id (nombre)
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (userData) {
        // teams puede venir como array de Supabase
        const teamsData = userData.team_members?.[0]?.teams as any
        const equipoNombre = Array.isArray(teamsData) ? teamsData[0]?.nombre : teamsData?.nombre
        setColaboradorInfo({
          nombre: userData.nombre,
          email: userData.email,
          rol_global: userData.rol_global,
          equipo: equipoNombre || 'Sin equipo'
        })
      }

      // 3. Cargar tareas del usuario
      const { data: tareasData, error: tareasError } = await supabase
        .from('tarea')
        .select(`
          tarea_id,
          estado,
          fecha_limite_oficial,
          fecha_presentacion_estimada,
          prioridad,
          cliente:cliente_id(nombre_comercial),
          contribuyente:contribuyente_id(rfc),
          obligacion:id_obligacion(nombre_corto),
          periodicidad:periodicidad_id(nombre)
        `)
        .eq('responsable_usuario_id', user.id)
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
          periodicidad: Array.isArray(t.periodicidad) ? t.periodicidad[0] : t.periodicidad,
        })) || [])
      }

      // 4. Cargar cantidad de retrabajos pendientes
      const { count } = await supabase
        .from('retrabajo')
        .select('*', { count: 'exact', head: true })
        .eq('responsable_id', user.id)
        .neq('estado', 'COMPLETADO')

      setCantidadRetrabajos(count || 0)

    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const tareasFiltradas = filtroEstado === 'all'
    ? tareas
    : tareas.filter(t => {
      if (filtroEstado === 'pendientes') return t.estado === 'pendiente'
      if (filtroEstado === 'en_curso') return ['en_curso', 'pendiente_evidencia', 'en_validacion'].includes(t.estado)
      if (filtroEstado === 'completadas') return ['presentado', 'pagado', 'cerrado'].includes(t.estado)
      return true
    })

  function getEstadoBadge(estado: string) {
    const config: Record<string, { label: string; className: string }> = {
      pendiente: { label: 'Pendiente', className: 'bg-slate-100 text-slate-700' },
      en_curso: { label: 'En Curso', className: 'bg-blue-100 text-blue-700' },
      pendiente_evidencia: { label: 'Pend. Evidencia', className: 'bg-purple-100 text-purple-700' },
      en_validacion: { label: 'En Validación', className: 'bg-yellow-100 text-yellow-700' },
      presentado: { label: 'Presentado', className: 'bg-green-100 text-green-700' },
      pagado: { label: 'Pagado', className: 'bg-green-100 text-green-700' },
      cerrado: { label: 'Cerrado', className: 'bg-slate-100 text-slate-500' }
    }

    const { label, className } = config[estado] || { label: estado, className: 'bg-slate-100 text-slate-700' }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${className}`}>
        {label}
      </span>
    )
  }

  function getPrioridadIcon(prioridad: string) {
    if (prioridad === 'ALTA') {
      return <AlertTriangle size={16} className="text-red-500" />
    }
    if (prioridad === 'MEDIA') {
      return <Clock size={16} className="text-yellow-500" />
    }
    return <Clock size={16} className="text-slate-400" />
  }

  function getDiasRestantes(fechaLimite: string) {
    const hoy = new Date()
    const limite = new Date(fechaLimite)
    const diffDias = Math.ceil((limite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDias < 0) {
      return <span className="text-red-600 font-bold">Vencido ({Math.abs(diffDias)}d)</span>
    } else if (diffDias === 0) {
      return <span className="text-orange-600 font-bold">Hoy</span>
    } else if (diffDias <= 3) {
      return <span className="text-yellow-600 font-bold">{diffDias} días</span>
    } else {
      return <span className="text-slate-600">{diffDias} días</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Cargando tu agenda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <User size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Mi Agenda</h1>
              <p className="text-slate-500">
                {colaboradorInfo?.nombre || 'Colaborador'} • {colaboradorInfo?.equipo || 'Sin equipo'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {cantidadRetrabajos > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-100 border-2 border-red-300 rounded-lg">
                <RefreshCw size={18} className="text-red-600" />
                <span className="text-sm font-bold text-red-700">
                  {cantidadRetrabajos} Retrabajo{cantidadRetrabajos > 1 ? 's' : ''}
                </span>
              </div>
            )}
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-bold">Tareas Activas</p>
              <p className="text-2xl font-bold text-blue-600">
                {tareas.filter(t => !['presentado', 'pagado', 'cerrado'].includes(t.estado)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Retrabajos */}
      <RetrabajoList />

      {/* Filtros */}
      <div className="flex gap-3">
        <button
          onClick={() => setFiltroEstado('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroEstado === 'all'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
        >
          Todas ({tareas.length})
        </button>
        <button
          onClick={() => setFiltroEstado('pendientes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroEstado === 'pendientes'
            ? 'bg-slate-600 text-white'
            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
        >
          Pendientes ({tareas.filter(t => t.estado === 'pendiente').length})
        </button>
        <button
          onClick={() => setFiltroEstado('en_curso')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroEstado === 'en_curso'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
        >
          En Curso ({tareas.filter(t => ['en_curso', 'pendiente_evidencia', 'en_validacion'].includes(t.estado)).length})
        </button>
        <button
          onClick={() => setFiltroEstado('completadas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroEstado === 'completadas'
            ? 'bg-green-600 text-white'
            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
        >
          Completadas ({tareas.filter(t => ['presentado', 'pagado', 'cerrado'].includes(t.estado)).length})
        </button>
      </div>

      {/* Tabla de Tareas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ListTodo size={20} className="text-slate-600" />
            <h2 className="text-lg font-bold text-slate-800">Mis Tareas</h2>
          </div>
        </div>

        {tareasFiltradas.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ListTodo className="mx-auto mb-3 opacity-50" size={40} />
            <p className="font-medium">No tienes tareas con este filtro</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-800 text-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">Cliente / RFC</th>
                  <th className="p-4">Obligación</th>
                  <th className="p-4 text-center">Periodicidad</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Prioridad</th>
                  <th className="p-4 text-center">Fecha Límite</th>
                  <th className="p-4 text-center">Días Restantes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {tareasFiltradas.map(tarea => (
                  <tr key={tarea.tarea_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-slate-700">
                        {tarea.cliente?.nombre_comercial || 'Sin cliente'}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {tarea.contribuyente?.rfc || 'Sin RFC'}
                      </p>
                    </td>
                    <td className="p-4 text-slate-600">
                      {tarea.obligacion?.nombre_corto || 'Sin obligación'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        {tarea.periodicidad?.nombre || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {getEstadoBadge(tarea.estado)}
                    </td>
                    <td className="p-4 text-center">
                      {getPrioridadIcon(tarea.prioridad)}
                    </td>
                    <td className="p-4 text-center text-slate-600 font-medium">
                      {new Date(tarea.fecha_limite_oficial).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 text-center text-sm">
                      {getDiasRestantes(tarea.fecha_limite_oficial)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
