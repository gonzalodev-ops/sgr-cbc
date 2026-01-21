'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Users,
  CheckCircle,
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  Shield,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  ListTodo
} from 'lucide-react'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EstadoTarea, ESTADO_TAREA_CONFIG } from '@/lib/constants/enums'
import { calcularDiasRestantes, formatearFecha, formatearFechaRelativa } from '@/lib/utils/dateCalculations'
import ReasignarModal from '@/components/tribu/ReasignarModal'

interface TeamMember {
  user_id: string
  nombre: string
  rol_en_equipo: string
  tareasPendientes: number
  tareasEnCurso: number
  tareasCompletadas: number
  tareasEnRiesgo: number
  puntosAcumulados: number
}

interface TeamTask {
  tarea_id: string
  estado: string
  fecha_limite_oficial: string
  prioridad: string
  en_riesgo: boolean
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

interface TeamDeadline {
  fecha: string
  tareas: TeamTask[]
}

export default function EquipoPage() {
  const { rol, isLoading: roleLoading, userId, canManageTeam } = useUserRole()

  const [teamId, setTeamId] = useState<string | null>(null)
  const [teamName, setTeamName] = useState<string>('')
  const [miembros, setMiembros] = useState<TeamMember[]>([])
  const [tareas, setTareas] = useState<TeamTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroMiembro, setFiltroMiembro] = useState<string>('all')
  const [filtroEstado, setFiltroEstado] = useState<string>('all')
  const [tareaSeleccionada, setTareaSeleccionada] = useState<TeamTask | null>(null)
  const [showReasignarModal, setShowReasignarModal] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showAllTasks, setShowAllTasks] = useState(false)

  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])

  useEffect(() => {
    if (!supabase || !userId || roleLoading) return

    async function fetchTeamData() {
      if (!supabase || !userId) return
      setLoading(true)

      try {
        // 1. Get user's team
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('team_id, rol_en_equipo, teams:team_id(nombre)')
          .eq('user_id', userId)
          .eq('activo', true)
          .single()

        if (!teamMember?.team_id) {
          setLoading(false)
          return
        }

        setTeamId(teamMember.team_id)
        setTeamName((teamMember.teams as any)?.nombre || 'Mi Equipo')

        // 2. Get all team members
        const { data: membersData } = await supabase
          .from('team_members')
          .select(`
            user_id,
            rol_en_equipo,
            users:user_id (user_id, nombre)
          `)
          .eq('team_id', teamMember.team_id)
          .eq('activo', true)

        if (!membersData || membersData.length === 0) {
          setLoading(false)
          return
        }

        const memberIds = membersData.map((m: any) => m.user_id).filter(Boolean)

        // 3. Get contribuyentes del equipo (filtro correcto por team_id)
        const { data: contribuyentes } = await supabase
          .from('contribuyente')
          .select('contribuyente_id')
          .eq('team_id', teamMember.team_id)

        const contribuyenteIds = (contribuyentes || []).map((c: { contribuyente_id: string }) => c.contribuyente_id)

        // 4. Get all tasks for the team via contribuyente.team_id
        let tareasData: any[] = []
        if (contribuyenteIds.length > 0) {
          const { data } = await supabase
            .from('tarea')
            .select(`
              tarea_id,
              estado,
              fecha_limite_oficial,
              prioridad,
              en_riesgo,
              contribuyente_id,
              responsable:users!tarea_responsable_usuario_id_fkey(user_id, nombre),
              cliente:cliente_id(nombre_comercial),
              obligacion:id_obligacion(nombre_corto)
            `)
            .in('contribuyente_id', contribuyenteIds)
            .order('fecha_limite_oficial', { ascending: true })
            .limit(500)

          tareasData = data || []
        }

        // Transform tasks data (Supabase returns relations as arrays sometimes)
        const tareasTransformadas: TeamTask[] = (tareasData || []).map((t: any) => ({
          ...t,
          responsable: Array.isArray(t.responsable) ? t.responsable[0] : t.responsable,
          cliente: Array.isArray(t.cliente) ? t.cliente[0] : t.cliente,
          obligacion: Array.isArray(t.obligacion) ? t.obligacion[0] : t.obligacion,
        }))

        setTareas(tareasTransformadas)

        // 4. Build member stats
        const memberStats: TeamMember[] = membersData.map((m: any) => {
          const tareasUsuario = tareasTransformadas.filter(
            (t) => t.responsable?.user_id === m.users?.user_id
          )

          const pendientes = tareasUsuario.filter(t => t.estado === 'no_iniciado').length
          const enCurso = tareasUsuario.filter(t =>
            ['en_curso', 'revision'].includes(t.estado)
          ).length
          const completadas = tareasUsuario.filter(t =>
            ['presentado', 'pagado', 'cerrado'].includes(t.estado)
          ).length

          // En Riesgo por colaborador: vencidas, flag en_riesgo, bloqueadas o rechazadas
          const hoy = new Date()
          hoy.setHours(0, 0, 0, 0)
          const enRiesgo = tareasUsuario.filter(t => {
            const fechaLimite = t.fecha_limite_oficial ? new Date(t.fecha_limite_oficial) : null
            const estaVencida = fechaLimite ? fechaLimite < hoy : false
            return t.en_riesgo ||
                   estaVencida ||
                   ['bloqueado_cliente', 'rechazado'].includes(t.estado)
          }).length

          return {
            user_id: m.users?.user_id,
            nombre: m.users?.nombre || 'Sin nombre',
            rol_en_equipo: m.rol_en_equipo,
            tareasPendientes: pendientes,
            tareasEnCurso: enCurso,
            tareasCompletadas: completadas,
            tareasEnRiesgo: enRiesgo,
            puntosAcumulados: completadas * 50
          }
        })

        setMiembros(memberStats)
      } catch (error) {
        console.error('Error fetching team data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [supabase, userId, roleLoading])

  // Calculate team KPIs
  const kpis = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const totalTareas = tareas.length
    const completadas = tareas.filter(t =>
      ['presentado', 'pagado', 'cerrado'].includes(t.estado)
    ).length

    // Tareas vencidas (fecha limite pasada)
    const vencidas = tareas.filter(t => {
      const fechaLimite = t.fecha_limite_oficial ? new Date(t.fecha_limite_oficial) : null
      return fechaLimite ? fechaLimite < hoy : false
    }).length

    const bloqueadas = tareas.filter(t => t.estado === 'bloqueado_cliente').length

    // En Riesgo combinado: vencidas + bloqueadas (para mostrar en KPI compacto)
    const enRiesgoTotal = vencidas + bloqueadas

    const tasaCompletado = totalTareas > 0
      ? Math.round((completadas / totalTareas) * 100)
      : 0

    return {
      totalTareas,
      completadas,
      enRiesgoTotal,
      vencidas,
      bloqueadas,
      tasaCompletado
    }
  }, [tareas])

  // Filter tasks
  const tareasFiltradas = useMemo(() => {
    return tareas.filter(t => {
      const matchMiembro = filtroMiembro === 'all' || t.responsable?.user_id === filtroMiembro
      const matchEstado = filtroEstado === 'all' || t.estado === filtroEstado
      // Only show active tasks (not closed)
      const isActive = !['cerrado', 'pagado'].includes(t.estado)
      return matchMiembro && matchEstado && isActive
    })
  }, [tareas, filtroMiembro, filtroEstado])

  // Group tasks by deadline for calendar view
  const deadlines = useMemo(() => {
    const grouped: Record<string, TeamTask[]> = {}

    tareasFiltradas
      .filter(t => t.fecha_limite_oficial)
      .forEach(t => {
        const fecha = t.fecha_limite_oficial.split('T')[0]
        if (!grouped[fecha]) grouped[fecha] = []
        grouped[fecha].push(t)
      })

    return Object.entries(grouped)
      .map(([fecha, tareas]) => ({ fecha, tareas }))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 10) // Show next 10 deadlines
  }, [tareasFiltradas])

  // Handle reassignment
  const handleReasignar = async (nuevoResponsableId: string, motivo: string) => {
    if (!tareaSeleccionada || !supabase || !userId) return

    // Update task
    const { error: updateError } = await supabase
      .from('tarea')
      .update({
        responsable_usuario_id: nuevoResponsableId,
        updated_at: new Date().toISOString()
      })
      .eq('tarea_id', tareaSeleccionada.tarea_id)

    if (updateError) throw new Error(`Error al actualizar: ${updateError.message}`)

    // Log event
    await supabase
      .from('tarea_evento')
      .insert({
        tarea_id: tareaSeleccionada.tarea_id,
        tipo_evento: 'reasignacion',
        estado_anterior: tareaSeleccionada.estado,
        estado_nuevo: tareaSeleccionada.estado,
        actor_usuario_id: userId,
        occurred_at: new Date().toISOString(),
        metadata_json: {
          responsable_anterior_id: tareaSeleccionada.responsable?.user_id,
          responsable_nuevo_id: nuevoResponsableId,
          motivo
        }
      })

    // Refresh data
    window.location.reload()
  }

  // Access check
  if (!roleLoading && !canManageTeam) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Shield className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Acceso Restringido</h2>
        <p className="text-slate-500 mt-2">
          No tienes permisos para acceder al panel de equipo.
        </p>
      </div>
    )
  }

  if (loading || roleLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-medium">Cargando datos del equipo...</p>
      </div>
    )
  }

  if (!teamId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Users className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Sin Equipo Asignado</h2>
        <p className="text-slate-500 mt-2">
          No estas asignado a ningun equipo actualmente.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Compacto + KPIs Inline */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          {/* Header izquierda */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{teamName}</h1>
              <p className="text-sm text-slate-500">{miembros.length} miembros activos</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 ml-2"
              title="Actualizar datos"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {/* KPIs compactos a la derecha */}
          <div className="flex items-center gap-6 lg:gap-8">
            {/* Total Tareas */}
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">{kpis.totalTareas}</p>
              <p className="text-xs text-slate-500">Tareas</p>
            </div>

            {/* Avance % */}
            <div className="text-center">
              <p className={`text-2xl font-bold ${
                kpis.tasaCompletado >= 70 ? 'text-green-600' :
                kpis.tasaCompletado >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {kpis.tasaCompletado}%
              </p>
              <p className="text-xs text-slate-500">Avance</p>
            </div>

            {/* En Atencion (vencidas + bloqueadas) */}
            <div className="text-center relative group">
              <p className={`text-2xl font-bold ${
                kpis.enRiesgoTotal > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {kpis.enRiesgoTotal}
              </p>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <AlertTriangle size={10} />
                Atencion
              </p>
              {/* Tooltip con desglose */}
              {kpis.enRiesgoTotal > 0 && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  <p>{kpis.vencidas} vencidas</p>
                  <p>{kpis.bloqueadas} bloqueadas</p>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Carga de Trabajo por Colaborador */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            Carga de Trabajo por Colaborador
          </h2>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {miembros.map(miembro => {
              const totalActivas = miembro.tareasPendientes + miembro.tareasEnCurso
              const maxTareas = Math.max(...miembros.map(m => m.tareasPendientes + m.tareasEnCurso), 1)
              const percentage = (totalActivas / maxTareas) * 100

              return (
                <div
                  key={miembro.user_id}
                  className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => setFiltroMiembro(
                    filtroMiembro === miembro.user_id ? 'all' : miembro.user_id
                  )}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        miembro.tareasEnRiesgo > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                      }`} />
                      <span className="font-medium text-slate-700">{miembro.nombre}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded">
                        {miembro.rol_en_equipo}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-500">{miembro.tareasPendientes} pend.</span>
                      <span className="text-blue-600">{miembro.tareasEnCurso} en curso</span>
                      <span className="text-green-600 font-medium">{miembro.puntosAcumulados} pts</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {miembro.tareasEnRiesgo > 0 && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {miembro.tareasEnRiesgo} tarea{miembro.tareasEnRiesgo > 1 ? 's' : ''} en riesgo
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Botones toggle para secciones colapsables */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
            showCalendar
              ? 'bg-purple-50 border-purple-300 text-purple-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calendar size={18} />
          <span className="font-medium">Proximos vencimientos</span>
          {showCalendar ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {deadlines.length > 0 && (
            <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
              showCalendar ? 'bg-purple-200 text-purple-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {deadlines.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setShowAllTasks(!showAllTasks)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
            showAllTasks
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ListTodo size={18} />
          <span className="font-medium">Ver todas las tareas</span>
          {showAllTasks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {tareasFiltradas.length > 0 && (
            <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
              showAllTasks ? 'bg-green-200 text-green-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {tareasFiltradas.length}
            </span>
          )}
        </button>
      </div>

      {/* Calendario de Vencimientos (colapsable) */}
      {showCalendar && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-purple-500" />
              Proximos Vencimientos
            </h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
            {deadlines.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-400">
                <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay vencimientos proximos</p>
              </div>
            ) : (
              deadlines.map(({ fecha, tareas }) => {
                const diasRestantes = calcularDiasRestantes(fecha)
                const isOverdue = diasRestantes < 0
                const isToday = diasRestantes === 0
                const isUrgent = diasRestantes > 0 && diasRestantes <= 3

                return (
                  <div
                    key={fecha}
                    className={`p-3 rounded-lg border ${
                      isOverdue ? 'bg-red-50 border-red-200' :
                      isToday ? 'bg-yellow-50 border-yellow-200' :
                      isUrgent ? 'bg-orange-50 border-orange-200' :
                      'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-bold ${
                        isOverdue ? 'text-red-700' :
                        isToday ? 'text-yellow-700' :
                        isUrgent ? 'text-orange-700' :
                        'text-slate-700'
                      }`}>
                        {formatearFecha(fecha, 'corto')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        isOverdue ? 'bg-red-100 text-red-700' :
                        isToday ? 'bg-yellow-100 text-yellow-700' :
                        isUrgent ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {formatearFechaRelativa(fecha)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {tareas.slice(0, 3).map(t => (
                        <div key={t.tarea_id} className="text-xs text-slate-600 flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            ESTADO_TAREA_CONFIG[t.estado as EstadoTarea]?.bgColor || 'bg-slate-400'
                          }`} />
                          <span className="truncate flex-1">{t.cliente?.nombre_comercial}</span>
                          <span className="text-slate-400">{t.responsable?.nombre?.split(' ')[0]}</span>
                        </div>
                      ))}
                      {tareas.length > 3 && (
                        <p className="text-xs text-slate-400">+{tareas.length - 3} mas</p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Tabla de Tareas Activas (colapsable) */}
      {showAllTasks && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-green-500" />
              Tareas Activas del Equipo
            </h2>
            <div className="flex items-center gap-3">
              {/* Filter by Member */}
              <select
                value={filtroMiembro}
                onChange={(e) => setFiltroMiembro(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los miembros</option>
                {miembros.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.nombre}</option>
                ))}
              </select>
              {/* Filter by Status */}
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="no_iniciado">No Iniciado</option>
                <option value="en_curso">En Curso</option>
                <option value="revision">En Revision</option>
                <option value="bloqueado_cliente">Bloqueado</option>
                <option value="presentado">Presentado</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Obligacion</th>
                  <th className="px-4 py-3 text-center">Responsable</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Vencimiento</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tareasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <Filter size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No hay tareas con estos filtros</p>
                    </td>
                  </tr>
                ) : (
                  tareasFiltradas.slice(0, 20).map(tarea => {
                    const diasRestantes = calcularDiasRestantes(tarea.fecha_limite_oficial)
                    const isOverdue = diasRestantes < 0
                    const isUrgent = diasRestantes >= 0 && diasRestantes <= 3

                    return (
                      <tr key={tarea.tarea_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-700 text-sm">
                            {tarea.cliente?.nombre_comercial || 'N/A'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {tarea.obligacion?.nombre_corto || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-slate-600">
                            {tarea.responsable?.nombre || 'Sin asignar'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge
                            status={tarea.estado as EstadoTarea}
                            type="estado"
                            size="sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm px-2 py-1 rounded ${
                            isOverdue ? 'bg-red-100 text-red-700' :
                            isUrgent ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {formatearFecha(tarea.fecha_limite_oficial, 'corto')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setTareaSeleccionada(tarea)
                              setShowReasignarModal(true)
                            }}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 mx-auto"
                          >
                            <ArrowRightLeft size={12} />
                            Reasignar
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
            {tareasFiltradas.length > 20 && (
              <div className="px-4 py-3 text-center text-sm text-slate-500 border-t border-slate-100">
                Mostrando 20 de {tareasFiltradas.length} tareas
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showReasignarModal && tareaSeleccionada && (
        <ReasignarModal
          tarea={tareaSeleccionada}
          miembros={miembros.map(m => ({
            user_id: m.user_id,
            nombre: m.nombre,
            rol_en_equipo: m.rol_en_equipo
          }))}
          onReasignar={handleReasignar}
          onClose={() => {
            setShowReasignarModal(false)
            setTareaSeleccionada(null)
          }}
        />
      )}
    </div>
  )
}
