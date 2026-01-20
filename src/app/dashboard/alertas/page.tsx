'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  AlertTriangle,
  Clock,
  XCircle,
  Users,
  Shield,
  Filter,
  Bell,
  CheckCircle,
  Calendar,
  Building2
} from 'lucide-react'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { KPICard, KPICardGrid } from '@/components/common/KPICard'
import { calcularDiasRestantes, formatearFecha } from '@/lib/utils/dateCalculations'

interface TareaAlerta {
  tarea_id: string
  estado: string
  fecha_limite_oficial: string
  prioridad: string
  cliente: {
    cliente_id: string
    nombre_comercial: string
  }
  obligacion: {
    nombre_corto: string
  }
  responsable: {
    user_id: string
    nombre: string
  }
  diasRestantes?: number
}

interface ColaboradorCarga {
  user_id: string
  nombre: string
  tareasActivas: number
  tareasVencidas: number
}

export default function AlertasPage() {
  const { rol, isLoading: roleLoading, userId, canManageTeam } = useUserRole()

  const [tareasVencidas, setTareasVencidas] = useState<TareaAlerta[]>([])
  const [tareasPorVencer, setTareasPorVencer] = useState<TareaAlerta[]>([])
  const [colaboradoresCarga, setColaboradoresCarga] = useState<ColaboradorCarga[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>('all')

  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])

  useEffect(() => {
    if (!supabase || !userId || roleLoading) return

    async function fetchAlertas() {
      if (!supabase || !userId) return
      setLoading(true)

      try {
        // Get user's team first
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('team_id, rol_en_equipo')
          .eq('user_id', userId)
          .eq('activo', true)
          .single()

        // For SOCIO/ADMIN, get all tasks; for LIDER, get only team tasks
        const isAdminOrSocio = rol === 'ADMIN' || rol === 'SOCIO'

        let tareasData: any[] = []

        if (isAdminOrSocio) {
          // ADMIN/SOCIO: Get all tasks
          const { data } = await supabase
            .from('tarea')
            .select(`
              tarea_id,
              estado,
              fecha_limite_oficial,
              prioridad,
              cliente:cliente_id(cliente_id, nombre_comercial),
              obligacion:id_obligacion(nombre_corto),
              responsable:users!responsable_usuario_id(user_id, nombre)
            `)
            .in('estado', ['no_iniciado', 'en_curso', 'revision'])
            .order('fecha_limite_oficial', { ascending: true })
            .limit(500)

          tareasData = data || []
        } else if (teamMember?.team_id) {
          // LIDER: Get tasks via contribuyente's team (same as Mi Dia)
          const { data: contribuyentes } = await supabase
            .from('contribuyente')
            .select('contribuyente_id')
            .eq('team_id', teamMember.team_id)

          const contribuyenteIds = (contribuyentes || []).map((c: { contribuyente_id: string }) => c.contribuyente_id)

          if (contribuyenteIds.length > 0) {
            const { data } = await supabase
              .from('tarea')
              .select(`
                tarea_id,
                estado,
                fecha_limite_oficial,
                prioridad,
                cliente:cliente_id(cliente_id, nombre_comercial),
                obligacion:id_obligacion(nombre_corto),
                responsable:users!responsable_usuario_id(user_id, nombre)
              `)
              .in('contribuyente_id', contribuyenteIds)
              .in('estado', ['no_iniciado', 'en_curso', 'revision'])
              .order('fecha_limite_oficial', { ascending: true })
              .limit(500)

            tareasData = data || []
          }
        }

        // Process tasks
        const vencidas: TareaAlerta[] = []
        const porVencer: TareaAlerta[] = []
        const cargaPorColaborador = new Map<string, ColaboradorCarga>()

        ;(tareasData || []).forEach((t: any) => {
          const tarea: TareaAlerta = {
            ...t,
            cliente: Array.isArray(t.cliente) ? t.cliente[0] : t.cliente,
            obligacion: Array.isArray(t.obligacion) ? t.obligacion[0] : t.obligacion,
            responsable: Array.isArray(t.responsable) ? t.responsable[0] : t.responsable,
          }

          const diasRestantes = calcularDiasRestantes(tarea.fecha_limite_oficial)
          tarea.diasRestantes = diasRestantes

          // Classify task
          if (diasRestantes < 0) {
            vencidas.push(tarea)
          } else if (diasRestantes <= 3) {
            porVencer.push(tarea)
          }

          // Count tasks per collaborator
          if (tarea.responsable?.user_id) {
            const existing = cargaPorColaborador.get(tarea.responsable.user_id)
            if (existing) {
              existing.tareasActivas++
              if (diasRestantes < 0) existing.tareasVencidas++
            } else {
              cargaPorColaborador.set(tarea.responsable.user_id, {
                user_id: tarea.responsable.user_id,
                nombre: tarea.responsable.nombre || 'Sin nombre',
                tareasActivas: 1,
                tareasVencidas: diasRestantes < 0 ? 1 : 0
              })
            }
          }
        })

        // Filter overloaded collaborators (more than 15 active tasks or any overdue)
        const sobrecargados = Array.from(cargaPorColaborador.values())
          .filter(c => c.tareasActivas > 15 || c.tareasVencidas > 0)
          .sort((a, b) => b.tareasActivas - a.tareasActivas)

        setTareasVencidas(vencidas)
        setTareasPorVencer(porVencer)
        setColaboradoresCarga(sobrecargados)
      } catch (error) {
        console.error('Error fetching alertas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAlertas()
  }, [supabase, userId, roleLoading, rol])

  // KPIs
  const kpis = useMemo(() => {
    return {
      totalAlertas: tareasVencidas.length + tareasPorVencer.length + colaboradoresCarga.length,
      vencidas: tareasVencidas.length,
      porVencer: tareasPorVencer.length,
      sobrecargados: colaboradoresCarga.length
    }
  }, [tareasVencidas, tareasPorVencer, colaboradoresCarga])

  // Access check
  if (!roleLoading && !canManageTeam) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Shield className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Acceso Restringido</h2>
        <p className="text-slate-500 mt-2">
          No tienes permisos para acceder a las alertas.
        </p>
      </div>
    )
  }

  if (loading || roleLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-medium">Cargando alertas...</p>
      </div>
    )
  }

  const noHayAlertas = kpis.totalAlertas === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-lg">
              <Bell size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Alertas</h1>
              <p className="text-slate-500">
                {rol === 'LIDER' ? 'Alertas de tu equipo' : 'Centro de alertas del sistema'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICardGrid columns={4}>
        <KPICard
          title="Total Alertas"
          value={kpis.totalAlertas}
          subtitle="Requieren atencion"
          icon={<AlertTriangle size={20} />}
          variant={kpis.totalAlertas > 0 ? 'danger' : 'success'}
        />
        <KPICard
          title="Vencidas"
          value={kpis.vencidas}
          subtitle="Pasaron fecha limite"
          icon={<XCircle size={20} />}
          variant={kpis.vencidas > 0 ? 'danger' : 'default'}
        />
        <KPICard
          title="Por Vencer"
          value={kpis.porVencer}
          subtitle="Menos de 3 dias"
          icon={<Clock size={20} />}
          variant={kpis.porVencer > 0 ? 'warning' : 'default'}
        />
        <KPICard
          title="Sobrecargados"
          value={kpis.sobrecargados}
          subtitle="Colaboradores"
          icon={<Users size={20} />}
          variant={kpis.sobrecargados > 0 ? 'warning' : 'default'}
        />
      </KPICardGrid>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-slate-400" />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Todas las alertas</option>
            <option value="vencidas">Solo vencidas</option>
            <option value="porVencer">Proximas a vencer</option>
            <option value="sobrecarga">Colaboradores sobrecargados</option>
          </select>
        </div>
      </div>

      {/* No alerts message */}
      {noHayAlertas && (
        <div className="bg-green-50 rounded-xl p-8 text-center border border-green-200">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">Sin Alertas</h3>
          <p className="text-green-600">Todo esta bajo control. No hay tareas vencidas ni proximas a vencer.</p>
        </div>
      )}

      {/* Tareas Vencidas */}
      {(filtroTipo === 'all' || filtroTipo === 'vencidas') && tareasVencidas.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 overflow-hidden">
          <div className="bg-red-100 px-4 py-3 border-b border-red-200">
            <h3 className="font-semibold text-red-800 flex items-center gap-2">
              <XCircle size={18} />
              Tareas Vencidas ({tareasVencidas.length})
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {tareasVencidas.map((tarea) => (
                <div
                  key={tarea.tarea_id}
                  className="bg-white rounded-lg p-3 border border-red-200 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-slate-400" />
                      <p className="font-medium text-slate-800">
                        {tarea.cliente?.nombre_comercial || 'Sin cliente'}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 ml-5">
                      {tarea.obligacion?.nombre_corto || 'Sin obligacion'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {tarea.responsable?.nombre || 'Sin asignar'}
                    </p>
                    <div className="flex items-center gap-1 text-red-600">
                      <Calendar size={12} />
                      <p className="text-xs font-medium">
                        Vencida hace {Math.abs(tarea.diasRestantes || 0)} dias
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tareas Por Vencer */}
      {(filtroTipo === 'all' || filtroTipo === 'porVencer') && tareasPorVencer.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
          <div className="bg-amber-100 px-4 py-3 border-b border-amber-200">
            <h3 className="font-semibold text-amber-800 flex items-center gap-2">
              <Clock size={18} />
              Proximas a Vencer - Menos de 3 Dias ({tareasPorVencer.length})
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {tareasPorVencer.map((tarea) => (
                <div
                  key={tarea.tarea_id}
                  className="bg-white rounded-lg p-3 border border-amber-200 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-slate-400" />
                      <p className="font-medium text-slate-800">
                        {tarea.cliente?.nombre_comercial || 'Sin cliente'}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 ml-5">
                      {tarea.obligacion?.nombre_corto || 'Sin obligacion'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {tarea.responsable?.nombre || 'Sin asignar'}
                    </p>
                    <div className="flex items-center gap-1 text-amber-600">
                      <Calendar size={12} />
                      <p className="text-xs font-medium">
                        {tarea.diasRestantes === 0 ? 'Vence hoy' :
                          tarea.diasRestantes === 1 ? 'Vence manana' :
                            `Vence en ${tarea.diasRestantes} dias`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Colaboradores Sobrecargados */}
      {(filtroTipo === 'all' || filtroTipo === 'sobrecarga') && colaboradoresCarga.length > 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 overflow-hidden">
          <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
            <h3 className="font-semibold text-blue-800 flex items-center gap-2">
              <Users size={18} />
              Colaboradores con Carga Alta ({colaboradoresCarga.length})
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {colaboradoresCarga.map((colab) => (
                <div
                  key={colab.user_id}
                  className="bg-white rounded-lg p-3 border border-blue-200 flex justify-between items-center"
                >
                  <p className="font-medium text-slate-800">{colab.nombre}</p>
                  <div className="flex gap-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                      {colab.tareasActivas} activas
                    </span>
                    {colab.tareasVencidas > 0 && (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                        {colab.tareasVencidas} vencidas
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
