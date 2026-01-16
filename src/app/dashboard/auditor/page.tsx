'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import {
  Shield,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Play,
  FileSearch,
  Calendar,
  User,
  Building2,
  Loader2,
  RefreshCw,
  TrendingUp,
  Award
} from 'lucide-react'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { KPICard, KPICardGrid } from '@/components/common/KPICard'
import { StatusBadge } from '@/components/common/StatusBadge'

// Types
interface AuditoriaPendiente {
  auditoria_id: string
  tarea_id: string
  periodo_fiscal: string
  estado: string
  fecha_seleccion: string
  tipo_seleccion: string
  cliente: string
  obligacion: string
  responsable_nombre: string | null
  fecha_limite_oficial: string
}

interface EvaluacionReciente {
  auditoria_id: string
  cliente: string
  obligacion: string
  estado: string
  calificacion: number | null
  fecha_fin_revision: string
}

interface AuditoriaKPIs {
  pendientes: number
  enRevision: number
  completadasMes: number
  calificacionPromedio: number
  destacadasMes: number
}

// Estado badge config
const ESTADO_AUDITORIA_CONFIG: Record<string, { label: string; variant: 'default' | 'warning' | 'info' | 'success' | 'danger' }> = {
  SELECCIONADA: { label: 'Pendiente', variant: 'warning' },
  EN_REVISION: { label: 'En Revision', variant: 'info' },
  CORREGIR: { label: 'Requiere Correccion', variant: 'warning' },
  APROBADO: { label: 'Aprobado', variant: 'success' },
  RECHAZADO: { label: 'Rechazado', variant: 'danger' },
  DESTACADO: { label: 'Destacado', variant: 'success' }
}

export default function AuditorDashboardPage() {
  const router = useRouter()
  const { rol, userId, canAudit, isLoading: roleLoading } = useUserRole()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [kpis, setKpis] = useState<AuditoriaKPIs>({
    pendientes: 0,
    enRevision: 0,
    completadasMes: 0,
    calificacionPromedio: 0,
    destacadasMes: 0
  })
  const [colaAuditorias, setColaAuditorias] = useState<AuditoriaPendiente[]>([])
  const [evaluacionesRecientes, setEvaluacionesRecientes] = useState<EvaluacionReciente[]>([])

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // Calculate current period
  const periodoActual = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }, [])

  const fetchData = async () => {
    if (!userId) return

    try {
      // Fetch KPIs
      const [pendientesRes, enRevisionRes, completadasRes] = await Promise.all([
        // Pendientes (SELECCIONADA)
        supabase
          .from('auditoria')
          .select('auditoria_id', { count: 'exact', head: true })
          .eq('estado', 'SELECCIONADA')
          .eq('auditor_id', userId),

        // En revision
        supabase
          .from('auditoria')
          .select('auditoria_id', { count: 'exact', head: true })
          .eq('estado', 'EN_REVISION')
          .eq('auditor_id', userId),

        // Completadas este mes
        supabase
          .from('auditoria')
          .select('auditoria_id, estado, calificacion', { count: 'exact' })
          .in('estado', ['APROBADO', 'RECHAZADO', 'DESTACADO', 'CORREGIR'])
          .eq('auditor_id', userId)
          .gte('fecha_fin_revision', `${periodoActual}-01`)
      ])

      // Calculate KPIs
      const completadas = completadasRes.data || []
      const calificaciones = completadas
        .filter(a => a.calificacion !== null)
        .map(a => a.calificacion as number)

      const avgCalif = calificaciones.length > 0
        ? calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length
        : 0

      const destacadas = completadas.filter(a => a.estado === 'DESTACADO').length

      setKpis({
        pendientes: pendientesRes.count || 0,
        enRevision: enRevisionRes.count || 0,
        completadasMes: completadasRes.count || 0,
        calificacionPromedio: Math.round(avgCalif * 10) / 10,
        destacadasMes: destacadas
      })

      // Fetch cola de auditorias pendientes (using view)
      const { data: colaData } = await supabase
        .from('auditoria')
        .select(`
          auditoria_id,
          tarea_id,
          periodo_fiscal,
          estado,
          fecha_seleccion,
          tipo_seleccion,
          tarea:tarea_id (
            fecha_limite_oficial,
            cliente:cliente_id (
              nombre_comercial
            ),
            obligacion:id_obligacion (
              nombre_corto
            ),
            responsable:responsable_usuario_id (
              nombre
            )
          )
        `)
        .eq('auditor_id', userId)
        .in('estado', ['SELECCIONADA', 'EN_REVISION', 'CORREGIR'])
        .order('fecha_seleccion', { ascending: true })
        .limit(10)

      if (colaData) {
        interface AuditoriaColaRow {
          auditoria_id: string
          tarea_id: string
          periodo_fiscal: string
          estado: string
          fecha_seleccion: string
          tipo_seleccion: string
          tarea: {
            fecha_limite_oficial: string
            cliente: { nombre_comercial: string } | null
            obligacion: { nombre_corto: string } | null
            responsable: { nombre: string } | null
          } | null
        }
        const formattedCola: AuditoriaPendiente[] = (colaData as unknown as AuditoriaColaRow[]).map((a) => ({
          auditoria_id: a.auditoria_id,
          tarea_id: a.tarea_id,
          periodo_fiscal: a.periodo_fiscal,
          estado: a.estado,
          fecha_seleccion: a.fecha_seleccion,
          tipo_seleccion: a.tipo_seleccion,
          cliente: a.tarea?.cliente?.nombre_comercial || 'Sin cliente',
          obligacion: a.tarea?.obligacion?.nombre_corto || 'Sin obligacion',
          responsable_nombre: a.tarea?.responsable?.nombre || null,
          fecha_limite_oficial: a.tarea?.fecha_limite_oficial || ''
        }))
        setColaAuditorias(formattedCola)
      }

      // Fetch evaluaciones recientes
      const { data: recientesData } = await supabase
        .from('auditoria')
        .select(`
          auditoria_id,
          estado,
          calificacion,
          fecha_fin_revision,
          tarea:tarea_id (
            cliente:cliente_id (
              nombre_comercial
            ),
            obligacion:id_obligacion (
              nombre_corto
            )
          )
        `)
        .eq('auditor_id', userId)
        .in('estado', ['APROBADO', 'RECHAZADO', 'DESTACADO'])
        .not('fecha_fin_revision', 'is', null)
        .order('fecha_fin_revision', { ascending: false })
        .limit(5)

      if (recientesData) {
        interface AuditoriaRecienteRow {
          auditoria_id: string
          estado: string
          calificacion: number | null
          fecha_fin_revision: string
          tarea: {
            cliente: { nombre_comercial: string } | null
            obligacion: { nombre_corto: string } | null
          } | null
        }
        const formattedRecientes: EvaluacionReciente[] = (recientesData as unknown as AuditoriaRecienteRow[]).map((a) => ({
          auditoria_id: a.auditoria_id,
          cliente: a.tarea?.cliente?.nombre_comercial || 'Sin cliente',
          obligacion: a.tarea?.obligacion?.nombre_corto || 'Sin obligacion',
          estado: a.estado,
          calificacion: a.calificacion,
          fecha_fin_revision: a.fecha_fin_revision
        }))
        setEvaluacionesRecientes(formattedRecientes)
      }

    } catch (error) {
      console.error('Error fetching auditor data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!roleLoading && userId && canAudit) {
      fetchData()
    } else if (!roleLoading && !canAudit) {
      setLoading(false)
    }
  }, [roleLoading, userId, canAudit])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleIniciarRevision = (auditoriaId: string) => {
    router.push(`/dashboard/auditor/${auditoriaId}`)
  }

  // Loading state
  if (roleLoading || loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-slate-600 font-medium">Cargando panel de auditoria...</p>
        </div>
      </div>
    )
  }

  // Access denied
  if (!canAudit) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Acceso Restringido</h1>
          <p className="text-slate-600 mb-4">
            Esta seccion es exclusiva para Auditores, Socios y Administradores.
          </p>
          <p className="text-sm text-slate-500">
            Tu rol actual: <span className="font-semibold">{rol || 'No definido'}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Panel del Auditor</h1>
              <p className="text-purple-200 mt-1">
                Control de calidad y revision de entregables
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
              title="Actualizar datos"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <div className="text-right">
              <p className="text-sm text-purple-200">Periodo actual</p>
              <p className="text-lg font-semibold">{periodoActual}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <KPICardGrid columns={4}>
        <KPICard
          title="Pendientes de Revision"
          value={kpis.pendientes}
          icon={<Clock size={24} />}
          variant={kpis.pendientes > 5 ? 'warning' : 'default'}
          subtitle="Tareas en cola"
        />
        <KPICard
          title="En Revision"
          value={kpis.enRevision}
          icon={<FileSearch size={24} />}
          variant="default"
          subtitle="Revision activa"
        />
        <KPICard
          title="Completadas este Mes"
          value={kpis.completadasMes}
          icon={<CheckCircle2 size={24} />}
          variant="success"
          subtitle={`${kpis.destacadasMes} destacadas`}
        />
        <KPICard
          title="Calificacion Promedio"
          value={kpis.calificacionPromedio}
          icon={<TrendingUp size={24} />}
          variant={kpis.calificacionPromedio >= 80 ? 'success' : kpis.calificacionPromedio >= 60 ? 'warning' : 'danger'}
          subtitle="De 100 puntos"
        />
      </KPICardGrid>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cola de Auditorias */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
            <h2 className="font-semibold text-amber-800 flex items-center gap-2">
              <ClipboardCheck size={18} />
              Cola de Auditorias ({colaAuditorias.length})
            </h2>
            {(rol === 'SOCIO' || rol === 'ADMIN') && (
              <button
                onClick={() => router.push('/dashboard/auditor/seleccion')}
                className="text-sm bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Gestionar Seleccion
              </button>
            )}
          </div>

          {colaAuditorias.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 size={48} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium">No hay auditorias pendientes</p>
              <p className="text-sm mt-1">La cola de revision esta vacia</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {colaAuditorias.map((auditoria) => (
                <div
                  key={auditoria.auditoria_id}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                      {/* Cliente y Obligacion */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 size={14} className="text-slate-400" />
                          <p className="font-medium text-slate-800 truncate">
                            {auditoria.cliente}
                          </p>
                        </div>
                        <p className="text-sm text-slate-600 truncate">
                          {auditoria.obligacion}
                        </p>
                      </div>

                      {/* Responsable */}
                      <div>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          <p className="text-sm text-slate-600">
                            {auditoria.responsable_nombre || 'Sin asignar'}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {auditoria.periodo_fiscal}
                        </p>
                      </div>

                      {/* Fecha y Estado */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar size={14} className="text-slate-400" />
                          <p className="text-xs text-slate-500">
                            Seleccionada: {new Date(auditoria.fecha_seleccion).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                        <StatusBadge
                          status={auditoria.estado}
                          type="custom"
                          variant={ESTADO_AUDITORIA_CONFIG[auditoria.estado]?.variant || 'default'}
                          label={ESTADO_AUDITORIA_CONFIG[auditoria.estado]?.label || auditoria.estado}
                          size="sm"
                          showIcon={false}
                        />
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleIniciarRevision(auditoria.auditoria_id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                            auditoria.estado === 'SELECCIONADA'
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {auditoria.estado === 'SELECCIONADA' ? (
                            <>
                              <Play size={16} />
                              Iniciar
                            </>
                          ) : (
                            <>
                              <Eye size={16} />
                              Continuar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Evaluaciones Recientes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Award size={18} className="text-purple-600" />
              Evaluaciones Recientes
            </h2>
          </div>

          {evaluacionesRecientes.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FileSearch size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay evaluaciones recientes</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {evaluacionesRecientes.map((eval_) => (
                <div
                  key={eval_.auditoria_id}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => handleIniciarRevision(eval_.auditoria_id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {eval_.cliente}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {eval_.obligacion}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(eval_.fecha_fin_revision).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge
                        status={eval_.estado}
                        type="custom"
                        variant={ESTADO_AUDITORIA_CONFIG[eval_.estado]?.variant || 'default'}
                        label={ESTADO_AUDITORIA_CONFIG[eval_.estado]?.label || eval_.estado}
                        size="sm"
                        showIcon={false}
                        pill
                      />
                      {eval_.calificacion !== null && (
                        <p className={`text-lg font-bold mt-1 ${
                          eval_.calificacion >= 80 ? 'text-green-600' :
                          eval_.calificacion >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {eval_.calificacion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600" />
          Resumen de Hallazgos del Periodo
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Documentacion</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">--</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Proceso</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">--</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Calculo</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">--</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Normativo</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">--</p>
          </div>
        </div>
      </div>
    </div>
  )
}
