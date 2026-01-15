'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Filter,
  Building2,
  Users,
  CreditCard,
  FileText,
  RotateCcw,
  Shield,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Eye,
  X
} from 'lucide-react'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { KPICard, KPICardGrid } from '@/components/common/KPICard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TrendIndicator } from '@/components/common/TrendIndicator'
import {
  CategoriaSeguimiento,
  PrioridadSeguimiento
} from '@/lib/constants/enums'
import { diferenciaEnDias, formatearFecha, formatearFechaHora } from '@/lib/utils/dateCalculations'

// ============================================
// TYPES
// ============================================

interface Seguimiento {
  id: string
  descripcion: string
  cliente_id: string | null
  tarea_origen_id: string | null
  categoria: CategoriaSeguimiento
  prioridad: PrioridadSeguimiento
  fecha_creacion: string
  fecha_compromiso: string | null
  responsable_id: string | null
  lider_id: string | null
  team_id: string | null
  estado: 'ABIERTO' | 'CERRADO'
  evidencia_cierre_url: string | null
  fecha_cierre: string | null
  cerrado_por: string | null
  notas: string | null
  // Joined data
  cliente?: { nombre_comercial: string } | null
  responsable?: { nombre: string } | null
  lider?: { nombre: string } | null
  team?: { nombre: string } | null
}

interface Team {
  team_id: string
  nombre: string
}

interface TeamStats {
  team_id: string
  nombre: string
  total: number
  abiertos: number
  cerrados: number
  altaPrioridad: number
  diasPromedioAbierto: number
}

interface Alert {
  type: 'high_priority_team' | 'long_open' | 'trend'
  message: string
  severity: 'warning' | 'danger' | 'info'
  teamId?: string
  count?: number
}

// ============================================
// CONSTANTS
// ============================================

const CATEGORIA_CONFIG: Record<CategoriaSeguimiento, { icon: any; bgColor: string; textColor: string; barColor: string }> = {
  PAGO: { icon: CreditCard, bgColor: 'bg-green-100', textColor: 'text-green-700', barColor: 'bg-green-500' },
  TRAMITE: { icon: FileText, bgColor: 'bg-blue-100', textColor: 'text-blue-700', barColor: 'bg-blue-500' },
  CAMBIO: { icon: RotateCcw, bgColor: 'bg-purple-100', textColor: 'text-purple-700', barColor: 'bg-purple-500' },
  DOCUMENTACION: { icon: FileText, bgColor: 'bg-orange-100', textColor: 'text-orange-700', barColor: 'bg-orange-500' },
  REQUERIMIENTO: { icon: AlertTriangle, bgColor: 'bg-red-100', textColor: 'text-red-700', barColor: 'bg-red-500' },
  OTRO: { icon: Clock, bgColor: 'bg-slate-100', textColor: 'text-slate-700', barColor: 'bg-slate-500' }
}

const PRIORIDAD_CONFIG = {
  ALTA: { bgColor: 'bg-red-100', textColor: 'text-red-700', barColor: 'bg-red-500' },
  MEDIA: { bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', barColor: 'bg-yellow-500' },
  BAJA: { bgColor: 'bg-green-100', textColor: 'text-green-700', barColor: 'bg-green-500' }
}

type SortField = 'cliente' | 'categoria' | 'prioridad' | 'dias' | 'equipo' | 'responsable'
type SortDirection = 'asc' | 'desc'

// ============================================
// DETAIL MODAL COMPONENT
// ============================================

interface DetailModalProps {
  seguimiento: Seguimiento
  onClose: () => void
}

function DetailModal({ seguimiento, onClose }: DetailModalProps) {
  const diasAbierto = seguimiento.estado === 'ABIERTO'
    ? Math.abs(diferenciaEnDias(new Date(), seguimiento.fecha_creacion))
    : seguimiento.fecha_cierre
      ? Math.abs(diferenciaEnDias(seguimiento.fecha_cierre, seguimiento.fecha_creacion))
      : 0

  const CategoriaIcon = CATEGORIA_CONFIG[seguimiento.categoria]?.icon || Clock

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${CATEGORIA_CONFIG[seguimiento.categoria]?.bgColor || 'bg-slate-100'}`}>
              <CategoriaIcon size={24} className={CATEGORIA_CONFIG[seguimiento.categoria]?.textColor || 'text-slate-700'} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Detalle del Seguimiento</h2>
              <p className="text-sm text-slate-500 mt-1">
                ID: {seguimiento.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              seguimiento.estado === 'ABIERTO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
            }`}>
              {seguimiento.estado}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${PRIORIDAD_CONFIG[seguimiento.prioridad]?.bgColor} ${PRIORIDAD_CONFIG[seguimiento.prioridad]?.textColor}`}>
              Prioridad: {seguimiento.prioridad}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${CATEGORIA_CONFIG[seguimiento.categoria]?.bgColor} ${CATEGORIA_CONFIG[seguimiento.categoria]?.textColor}`}>
              {seguimiento.categoria}
            </span>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Descripcion</h3>
            <p className="text-slate-800 bg-slate-50 rounded-lg p-4 border border-slate-200">
              {seguimiento.descripcion}
            </p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Cliente</p>
              <p className="text-slate-800 font-medium">
                {seguimiento.cliente?.nombre_comercial || 'Sin cliente asignado'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Equipo</p>
              <p className="text-slate-800 font-medium">
                {seguimiento.team?.nombre || 'Sin equipo asignado'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Responsable</p>
              <p className="text-slate-800 font-medium">
                {seguimiento.responsable?.nombre || 'Sin responsable'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Lider</p>
              <p className="text-slate-800 font-medium">
                {seguimiento.lider?.nombre || 'Sin lider asignado'}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Fecha Creacion</p>
              <p className="text-slate-800 font-medium">
                {formatearFecha(seguimiento.fecha_creacion, 'largo')}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Fecha Compromiso</p>
              <p className="text-slate-800 font-medium">
                {seguimiento.fecha_compromiso ? formatearFecha(seguimiento.fecha_compromiso, 'largo') : 'No definida'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Dias Abierto</p>
              <p className={`font-bold text-lg ${diasAbierto > 15 ? 'text-red-600' : diasAbierto > 7 ? 'text-yellow-600' : 'text-slate-800'}`}>
                {diasAbierto} dias
              </p>
            </div>
          </div>

          {/* Notes */}
          {seguimiento.notas && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Notas</h3>
              <p className="text-slate-700 bg-slate-50 rounded-lg p-4 border border-slate-200">
                {seguimiento.notas}
              </p>
            </div>
          )}

          {/* Closure info */}
          {seguimiento.estado === 'CERRADO' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-700 mb-2">Informacion de Cierre</h3>
              <div className="space-y-2">
                <p className="text-sm text-green-700">
                  <span className="font-medium">Fecha de cierre:</span> {formatearFechaHora(seguimiento.fecha_cierre)}
                </p>
                {seguimiento.evidencia_cierre_url && (
                  <p className="text-sm text-green-700">
                    <span className="font-medium">Evidencia:</span>{' '}
                    <a href={seguimiento.evidencia_cierre_url} target="_blank" rel="noopener noreferrer" className="underline">
                      Ver evidencia
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SeguimientosGlobalPage() {
  const { rol, isLoading: roleLoading, canAccessConfig } = useUserRole()

  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filtroEquipo, setFiltroEquipo] = useState<string>('all')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('all')
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('all')
  const [filtroEstado, setFiltroEstado] = useState<string>('ABIERTO')

  // Sorting
  const [sortField, setSortField] = useState<SortField>('dias')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Selected detail
  const [selectedSeguimiento, setSelectedSeguimiento] = useState<Seguimiento | null>(null)

  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])

  // Fetch data
  useEffect(() => {
    if (!supabase || roleLoading) return

    async function fetchData() {
      setLoading(true)

      try {
        // Fetch teams
        const { data: teamsData } = await supabase
          .from('teams')
          .select('team_id, nombre')
          .eq('activo', true)
          .order('nombre')

        setTeams(teamsData || [])

        // Fetch all seguimientos with related data
        const { data: seguimientosData, error } = await supabase
          .from('pendiente_seguimiento')
          .select(`
            id,
            descripcion,
            cliente_id,
            tarea_origen_id,
            categoria,
            prioridad,
            fecha_creacion,
            fecha_compromiso,
            responsable_id,
            lider_id,
            team_id,
            estado,
            evidencia_cierre_url,
            fecha_cierre,
            cerrado_por,
            notas,
            cliente:cliente_id(nombre_comercial),
            responsable:responsable_id(nombre),
            lider:lider_id(nombre),
            team:team_id(nombre)
          `)
          .order('fecha_creacion', { ascending: false })

        if (error) {
          console.error('Error fetching seguimientos:', error)
          setSeguimientos([])
          return
        }

        // Transform data (handle Supabase array returns)
        const transformedData = (seguimientosData || []).map((s: any) => ({
          ...s,
          cliente: Array.isArray(s.cliente) ? s.cliente[0] : s.cliente,
          responsable: Array.isArray(s.responsable) ? s.responsable[0] : s.responsable,
          lider: Array.isArray(s.lider) ? s.lider[0] : s.lider,
          team: Array.isArray(s.team) ? s.team[0] : s.team
        }))

        setSeguimientos(transformedData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, roleLoading])

  // Calculate KPIs
  const kpis = useMemo(() => {
    const abiertos = seguimientos.filter(s => s.estado === 'ABIERTO')
    const cerrados = seguimientos.filter(s => s.estado === 'CERRADO')
    const altaPrioridad = abiertos.filter(s => s.prioridad === 'ALTA')

    // Average days open for open items
    const diasPromedio = abiertos.length > 0
      ? Math.round(
          abiertos.reduce((sum, s) => sum + Math.abs(diferenciaEnDias(new Date(), s.fecha_creacion)), 0) / abiertos.length
        )
      : 0

    // Closed this month
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    const cerradosEsteMes = cerrados.filter(s => {
      if (!s.fecha_cierre) return false
      return new Date(s.fecha_cierre) >= inicioMes
    }).length

    return {
      totalAbiertos: abiertos.length,
      altaPrioridad: altaPrioridad.length,
      diasPromedio,
      cerradosEsteMes
    }
  }, [seguimientos])

  // Calculate team stats
  const teamStats = useMemo((): TeamStats[] => {
    return teams.map(team => {
      const teamSeguimientos = seguimientos.filter(s => s.team_id === team.team_id)
      const abiertos = teamSeguimientos.filter(s => s.estado === 'ABIERTO')
      const cerrados = teamSeguimientos.filter(s => s.estado === 'CERRADO')
      const altaPrioridad = abiertos.filter(s => s.prioridad === 'ALTA')

      const diasPromedio = abiertos.length > 0
        ? Math.round(
            abiertos.reduce((sum, s) => sum + Math.abs(diferenciaEnDias(new Date(), s.fecha_creacion)), 0) / abiertos.length
          )
        : 0

      return {
        team_id: team.team_id,
        nombre: team.nombre,
        total: teamSeguimientos.length,
        abiertos: abiertos.length,
        cerrados: cerrados.length,
        altaPrioridad: altaPrioridad.length,
        diasPromedioAbierto: diasPromedio
      }
    }).sort((a, b) => b.abiertos - a.abiertos)
  }, [teams, seguimientos])

  // Calculate category distribution
  const categoryStats = useMemo(() => {
    const abiertos = seguimientos.filter(s => s.estado === 'ABIERTO')
    const categories = Object.values(CategoriaSeguimiento)

    return categories.map(cat => {
      const count = abiertos.filter(s => s.categoria === cat).length
      return { categoria: cat, count }
    }).sort((a, b) => b.count - a.count)
  }, [seguimientos])

  // Calculate priority distribution
  const priorityStats = useMemo(() => {
    const abiertos = seguimientos.filter(s => s.estado === 'ABIERTO')
    return {
      ALTA: abiertos.filter(s => s.prioridad === 'ALTA').length,
      MEDIA: abiertos.filter(s => s.prioridad === 'MEDIA').length,
      BAJA: abiertos.filter(s => s.prioridad === 'BAJA').length
    }
  }, [seguimientos])

  // Calculate alerts
  const alerts = useMemo((): Alert[] => {
    const alertList: Alert[] = []

    // Teams with > 5 high priority items
    teamStats.forEach(team => {
      if (team.altaPrioridad > 5) {
        alertList.push({
          type: 'high_priority_team',
          message: `${team.nombre} tiene ${team.altaPrioridad} items de alta prioridad abiertos`,
          severity: 'danger',
          teamId: team.team_id,
          count: team.altaPrioridad
        })
      }
    })

    // Items open > 15 days
    const itemsLongOpen = seguimientos.filter(s => {
      if (s.estado !== 'ABIERTO') return false
      const diasAbierto = Math.abs(diferenciaEnDias(new Date(), s.fecha_creacion))
      return diasAbierto > 15
    })

    if (itemsLongOpen.length > 0) {
      alertList.push({
        type: 'long_open',
        message: `${itemsLongOpen.length} seguimiento(s) llevan mas de 15 dias abiertos`,
        severity: 'warning',
        count: itemsLongOpen.length
      })
    }

    // High priority items trend
    const altaCount = seguimientos.filter(s => s.estado === 'ABIERTO' && s.prioridad === 'ALTA').length
    if (altaCount > 10) {
      alertList.push({
        type: 'trend',
        message: `Tendencia al alza: ${altaCount} items de alta prioridad requieren atencion`,
        severity: 'warning',
        count: altaCount
      })
    }

    return alertList
  }, [seguimientos, teamStats])

  // Filter seguimientos
  const seguimientosFiltrados = useMemo(() => {
    let filtered = seguimientos.filter(s => {
      const matchEquipo = filtroEquipo === 'all' || s.team_id === filtroEquipo
      const matchCategoria = filtroCategoria === 'all' || s.categoria === filtroCategoria
      const matchPrioridad = filtroPrioridad === 'all' || s.prioridad === filtroPrioridad
      const matchEstado = filtroEstado === 'all' || s.estado === filtroEstado
      return matchEquipo && matchCategoria && matchPrioridad && matchEstado
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'cliente':
          comparison = (a.cliente?.nombre_comercial || '').localeCompare(b.cliente?.nombre_comercial || '')
          break
        case 'categoria':
          comparison = a.categoria.localeCompare(b.categoria)
          break
        case 'prioridad':
          const prioridadOrder = { ALTA: 1, MEDIA: 2, BAJA: 3 }
          comparison = prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad]
          break
        case 'dias':
          const diasA = Math.abs(diferenciaEnDias(new Date(), a.fecha_creacion))
          const diasB = Math.abs(diferenciaEnDias(new Date(), b.fecha_creacion))
          comparison = diasA - diasB
          break
        case 'equipo':
          comparison = (a.team?.nombre || '').localeCompare(b.team?.nombre || '')
          break
        case 'responsable':
          comparison = (a.responsable?.nombre || '').localeCompare(b.responsable?.nombre || '')
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [seguimientos, filtroEquipo, filtroCategoria, filtroPrioridad, filtroEstado, sortField, sortDirection])

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Handle team filter from card click
  const handleTeamFilter = (teamId: string) => {
    setFiltroEquipo(prev => prev === teamId ? 'all' : teamId)
  }

  // Access check - SOCIO or ADMIN only
  if (!roleLoading && !canAccessConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Shield className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Acceso Restringido</h2>
        <p className="text-slate-500 mt-2 max-w-md">
          Esta vista global de seguimientos esta disponible unicamente para usuarios con rol SOCIO o ADMIN.
        </p>
      </div>
    )
  }

  if (loading || roleLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-medium">Cargando vista global...</p>
      </div>
    )
  }

  const maxCategoryCount = Math.max(...categoryStats.map(c => c.count), 1)
  const totalPrioridad = priorityStats.ALTA + priorityStats.MEDIA + priorityStats.BAJA || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg">
              <Globe size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Seguimientos Global</h1>
              <p className="text-slate-500">Vision consolidada de todos los equipos</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase font-medium">Rol</p>
            <p className="text-lg font-bold text-indigo-600">{rol}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICardGrid columns={4}>
        <KPICard
          title="Seguimientos Abiertos"
          value={kpis.totalAbiertos}
          subtitle="Total en todos los equipos"
          icon={<Clock size={20} />}
          variant={kpis.totalAbiertos > 50 ? 'warning' : 'default'}
        />
        <KPICard
          title="Alta Prioridad"
          value={kpis.altaPrioridad}
          subtitle="Requieren atencion inmediata"
          icon={<AlertTriangle size={20} />}
          variant={kpis.altaPrioridad > 10 ? 'danger' : kpis.altaPrioridad > 0 ? 'warning' : 'success'}
        />
        <KPICard
          title="Dias Promedio Abierto"
          value={kpis.diasPromedio}
          subtitle="Por seguimiento activo"
          icon={<Calendar size={20} />}
          variant={kpis.diasPromedio > 10 ? 'warning' : 'default'}
        />
        <KPICard
          title="Cerrados Este Mes"
          value={kpis.cerradosEsteMes}
          subtitle="Completados en el periodo"
          icon={<CheckCircle size={20} />}
          variant="success"
        />
      </KPICardGrid>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            Alertas y Notificaciones
          </h2>
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  alert.severity === 'danger' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'warning' ? 'bg-amber-50 border-amber-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                {alert.type === 'trend' ? (
                  <TrendingUp size={18} className={
                    alert.severity === 'danger' ? 'text-red-600' :
                    alert.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'
                  } />
                ) : (
                  <AlertTriangle size={18} className={
                    alert.severity === 'danger' ? 'text-red-600' :
                    alert.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'
                  } />
                )}
                <span className={`text-sm font-medium ${
                  alert.severity === 'danger' ? 'text-red-700' :
                  alert.severity === 'warning' ? 'text-amber-700' : 'text-blue-700'
                }`}>
                  {alert.message}
                </span>
                {alert.teamId && (
                  <button
                    onClick={() => handleTeamFilter(alert.teamId!)}
                    className="ml-auto text-xs px-2 py-1 bg-white rounded border hover:bg-slate-50 transition-colors"
                  >
                    Ver equipo
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two column layout: Teams + Categories/Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 size={20} className="text-indigo-600" />
              Seguimientos por Equipo
            </h2>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {teamStats.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No hay equipos configurados</p>
            ) : (
              teamStats.map(team => (
                <div
                  key={team.team_id}
                  onClick={() => handleTeamFilter(team.team_id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    filtroEquipo === team.team_id
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-800">{team.nombre}</h3>
                      <p className="text-xs text-slate-500">
                        {team.abiertos} abiertos / {team.cerrados} cerrados
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {team.altaPrioridad > 0 && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                          {team.altaPrioridad} alta
                        </span>
                      )}
                      <span className="text-2xl font-bold text-indigo-600">{team.abiertos}</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        team.altaPrioridad > 5 ? 'bg-red-500' :
                        team.abiertos > 10 ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, (team.abiertos / Math.max(...teamStats.map(t => t.abiertos), 1)) * 100)}%` }}
                    />
                  </div>
                  {team.abiertos > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      Promedio: {team.diasPromedioAbierto} dias abierto
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category + Priority Distribution */}
        <div className="space-y-6">
          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                Distribucion por Categoria
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {categoryStats.map(cat => {
                const config = CATEGORIA_CONFIG[cat.categoria]
                const percentage = (cat.count / maxCategoryCount) * 100
                const Icon = config?.icon || Clock

                return (
                  <div key={cat.categoria} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config?.bgColor || 'bg-slate-100'}`}>
                      <Icon size={16} className={config?.textColor || 'text-slate-600'} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-700">{cat.categoria}</span>
                        <span className="text-sm font-bold text-slate-800">{cat.count}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${config?.barColor || 'bg-slate-400'} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle size={20} className="text-indigo-600" />
                Distribucion por Prioridad
              </h2>
            </div>
            <div className="p-4">
              <div className="flex gap-4">
                {/* ALTA */}
                <div className="flex-1 text-center">
                  <div className="bg-red-100 rounded-lg p-4 mb-2">
                    <p className="text-3xl font-bold text-red-600">{priorityStats.ALTA}</p>
                    <p className="text-xs text-red-600 font-medium mt-1">ALTA</p>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${(priorityStats.ALTA / totalPrioridad) * 100}%` }}
                    />
                  </div>
                </div>

                {/* MEDIA */}
                <div className="flex-1 text-center">
                  <div className="bg-yellow-100 rounded-lg p-4 mb-2">
                    <p className="text-3xl font-bold text-yellow-600">{priorityStats.MEDIA}</p>
                    <p className="text-xs text-yellow-600 font-medium mt-1">MEDIA</p>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500"
                      style={{ width: `${(priorityStats.MEDIA / totalPrioridad) * 100}%` }}
                    />
                  </div>
                </div>

                {/* BAJA */}
                <div className="flex-1 text-center">
                  <div className="bg-green-100 rounded-lg p-4 mb-2">
                    <p className="text-3xl font-bold text-green-600">{priorityStats.BAJA}</p>
                    <p className="text-xs text-green-600 font-medium mt-1">BAJA</p>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(priorityStats.BAJA / totalPrioridad) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Filtrar tabla:</span>
          </div>

          {/* Estado */}
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
            {['ABIERTO', 'CERRADO', 'all'].map(estado => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  filtroEstado === estado
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {estado === 'ABIERTO' ? 'Abiertos' : estado === 'CERRADO' ? 'Cerrados' : 'Todos'}
              </button>
            ))}
          </div>

          {/* Equipo */}
          <select
            value={filtroEquipo}
            onChange={(e) => setFiltroEquipo(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Todos los equipos</option>
            {teams.map(team => (
              <option key={team.team_id} value={team.team_id}>{team.nombre}</option>
            ))}
          </select>

          {/* Categoria */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Todas las categorias</option>
            {Object.values(CategoriaSeguimiento).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Prioridad */}
          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Todas las prioridades</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>

          {/* Clear filters */}
          {(filtroEquipo !== 'all' || filtroCategoria !== 'all' || filtroPrioridad !== 'all' || filtroEstado !== 'ABIERTO') && (
            <button
              onClick={() => {
                setFiltroEquipo('all')
                setFiltroCategoria('all')
                setFiltroPrioridad('all')
                setFiltroEstado('ABIERTO')
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">
            Detalle de Seguimientos
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({seguimientosFiltrados.length} resultados)
            </span>
          </h2>
        </div>

        {seguimientosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Globe size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Sin resultados</p>
            <p className="text-sm mt-1">No se encontraron seguimientos con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th
                    onClick={() => handleSort('cliente')}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Cliente
                      <ArrowUpDown size={14} className={sortField === 'cliente' ? 'text-indigo-600' : 'text-slate-400'} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('categoria')}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Categoria
                      <ArrowUpDown size={14} className={sortField === 'categoria' ? 'text-indigo-600' : 'text-slate-400'} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('prioridad')}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Prioridad
                      <ArrowUpDown size={14} className={sortField === 'prioridad' ? 'text-indigo-600' : 'text-slate-400'} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('dias')}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Dias Abierto
                      <ArrowUpDown size={14} className={sortField === 'dias' ? 'text-indigo-600' : 'text-slate-400'} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('equipo')}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Equipo
                      <ArrowUpDown size={14} className={sortField === 'equipo' ? 'text-indigo-600' : 'text-slate-400'} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('responsable')}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Responsable
                      <ArrowUpDown size={14} className={sortField === 'responsable' ? 'text-indigo-600' : 'text-slate-400'} />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {seguimientosFiltrados.map(seg => {
                  const diasAbierto = Math.abs(diferenciaEnDias(new Date(), seg.fecha_creacion))
                  const CategoriaIcon = CATEGORIA_CONFIG[seg.categoria]?.icon || Clock

                  return (
                    <tr
                      key={seg.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        seg.estado === 'CERRADO' ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">
                            {seg.cliente?.nombre_comercial || 'Sin cliente'}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {seg.descripcion}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${CATEGORIA_CONFIG[seg.categoria]?.bgColor} ${CATEGORIA_CONFIG[seg.categoria]?.textColor}`}>
                          <CategoriaIcon size={12} />
                          {seg.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORIDAD_CONFIG[seg.prioridad]?.bgColor} ${PRIORIDAD_CONFIG[seg.prioridad]?.textColor}`}>
                          {seg.prioridad}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          diasAbierto > 15 ? 'text-red-600' :
                          diasAbierto > 7 ? 'text-yellow-600' : 'text-slate-700'
                        }`}>
                          {diasAbierto} dias
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-700">
                          {seg.team?.nombre || 'Sin equipo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-700">
                          {seg.responsable?.nombre || 'Sin asignar'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedSeguimiento(seg)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSeguimiento && (
        <DetailModal
          seguimiento={selectedSeguimiento}
          onClose={() => setSelectedSeguimiento(null)}
        />
      )}
    </div>
  )
}
