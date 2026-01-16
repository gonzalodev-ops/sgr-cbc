'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { usePeriodo } from '@/lib/context/PeriodoContext'
import { KPICard, KPICardGrid } from '@/components/common/KPICard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TrendIndicator } from '@/components/common/TrendIndicator'
import {
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    BarChart3,
    TableProperties,
    Flame,
    Download,
    Filter,
    RotateCcw,
    Calendar,
    Users,
    Target,
    TrendingUp,
    AlertCircle,
    RefreshCw,
    ArrowUpDown,
    Lock,
    FileWarning,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { EstadoTarea, ESTADO_TAREA_CONFIG } from '@/lib/constants/enums'

// Types
interface TareaCompleta {
    tarea_id: string
    cliente_id: string
    contribuyente_id: string
    id_obligacion: string
    estado: string
    periodo_fiscal: string
    fecha_limite_oficial: string
    fecha_limite_interna: string | null
    riesgo: string
    en_riesgo: boolean
    prioridad: string
    responsable_usuario_id: string | null
    revisor_usuario_id: string | null
    team_id: string | null
    created_at: string
    updated_at: string
    cliente_nombre: string
    cliente_razon_social: string | null
    rfc: string
    razon_social: string | null
    obligacion_nombre: string
    periodicidad: string
    responsable_nombre: string | null
    responsable_email: string | null
    revisor_nombre: string | null
    equipo_nombre: string | null
}

interface TeamPerformance {
    team_id: string
    nombre: string
    total: number
    completadas: number
    enProgreso: number
    vencidas: number
    porcentaje: number
}

type ViewMode = 'resumen' | 'detalle' | 'critico'
type AlertFilter = 'all' | 'vencidas' | 'riesgo' | 'seguimiento' | 'semana'
type SortField = 'cliente' | 'obligacion' | 'responsable' | 'estado' | 'fecha' | 'dias'
type SortDirection = 'asc' | 'desc'

// Helper Functions
function getSupabaseClient() {
    if (typeof window === 'undefined') return null
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

function calcularDiasRestantes(fechaLimite: string): number {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const limite = new Date(fechaLimite)
    limite.setHours(0, 0, 0, 0)
    return Math.ceil((limite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function isVencida(tarea: TareaCompleta): boolean {
    const estadosFinales = ['presentado', 'pagado', 'cerrado']
    if (estadosFinales.includes(tarea.estado)) return false
    return calcularDiasRestantes(tarea.fecha_limite_oficial) < 0
}

function isEnRiesgo(tarea: TareaCompleta): boolean {
    const estadosFinales = ['presentado', 'pagado', 'cerrado']
    if (estadosFinales.includes(tarea.estado)) return false
    const dias = calcularDiasRestantes(tarea.fecha_limite_oficial)
    return dias >= 0 && dias <= 3
}

function isSeguimiento(tarea: TareaCompleta): boolean {
    return tarea.estado === 'bloqueado_cliente' || tarea.estado === 'en_validacion'
}

function isEstaSemana(tarea: TareaCompleta): boolean {
    const estadosFinales = ['presentado', 'pagado', 'cerrado']
    if (estadosFinales.includes(tarea.estado)) return false
    const dias = calcularDiasRestantes(tarea.fecha_limite_oficial)
    return dias >= 0 && dias <= 7
}

function sinVoBo(tarea: TareaCompleta): boolean {
    return tarea.estado === 'en_validacion' && !tarea.revisor_usuario_id
}

export default function TMR2Page() {
    // Hooks
    const { isSocio, isAdmin, isLoading: isLoadingRole, rol } = useUserRole()
    const { periodoSeleccionado, getPeriodoLabel, getPeriodoRange } = usePeriodo()

    // State
    const [tareas, setTareas] = useState<TareaCompleta[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<ViewMode>('resumen')
    const [alertFilter, setAlertFilter] = useState<AlertFilter>('all')

    // Filtros para Modo Detalle
    const [filtroEquipo, setFiltroEquipo] = useState('all')
    const [filtroEstado, setFiltroEstado] = useState('all')
    const [filtroResponsable, setFiltroResponsable] = useState('all')
    const [filtroPeriodo, setFiltroPeriodo] = useState('all')
    const [sortField, setSortField] = useState<SortField>('fecha')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

    // Expanded teams in resumen
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())

    const supabase = useMemo(() => getSupabaseClient(), [])

    // Fetch Data
    useEffect(() => {
        if (!supabase) return

        const client = supabase // Local reference for TypeScript

        async function fetchTareas() {
            setLoading(true)

            try {
                // Use the v_tarea_completa VIEW for efficient data loading
                const { data, error } = await client
                    .from('v_tarea_completa')
                    .select('*')
                    .order('fecha_limite_oficial', { ascending: true })
                    .limit(1000)

                if (error) {
                    console.error('Error fetching tareas:', error)
                    // Fallback to tarea table if view doesn't exist
                    const { data: fallbackData, error: fallbackError } = await client
                        .from('tarea')
                        .select(`
                            tarea_id,
                            cliente_id,
                            contribuyente_id,
                            id_obligacion,
                            estado,
                            periodo_fiscal,
                            fecha_limite_oficial,
                            fecha_limite_interna,
                            riesgo,
                            en_riesgo,
                            prioridad,
                            responsable_usuario_id,
                            revisor_usuario_id,
                            created_at,
                            updated_at,
                            cliente:cliente_id (nombre_comercial, razon_social_principal),
                            contribuyente:contribuyente_id (rfc, razon_social, team_id),
                            obligacion:id_obligacion (nombre_corto, periodicidad),
                            responsable:responsable_usuario_id (nombre, email),
                            revisor:revisor_usuario_id (nombre)
                        `)
                        .order('fecha_limite_oficial', { ascending: true })
                        .limit(1000)

                    if (fallbackError) {
                        console.error('Fallback error:', fallbackError)
                        setLoading(false)
                        return
                    }

                    // Transform fallback data
                    const transformedData: TareaCompleta[] = (fallbackData || []).map((t: any) => ({
                        tarea_id: t.tarea_id,
                        cliente_id: t.cliente_id,
                        contribuyente_id: t.contribuyente_id,
                        id_obligacion: t.id_obligacion,
                        estado: t.estado,
                        periodo_fiscal: t.periodo_fiscal,
                        fecha_limite_oficial: t.fecha_limite_oficial,
                        fecha_limite_interna: t.fecha_limite_interna,
                        riesgo: t.riesgo || 'BAJO',
                        en_riesgo: t.en_riesgo || false,
                        prioridad: t.prioridad || 'MEDIA',
                        responsable_usuario_id: t.responsable_usuario_id,
                        revisor_usuario_id: t.revisor_usuario_id,
                        team_id: t.contribuyente?.team_id || null,
                        created_at: t.created_at,
                        updated_at: t.updated_at,
                        cliente_nombre: t.cliente?.nombre_comercial || 'Sin cliente',
                        cliente_razon_social: t.cliente?.razon_social_principal,
                        rfc: t.contribuyente?.rfc || 'N/A',
                        razon_social: t.contribuyente?.razon_social,
                        obligacion_nombre: t.obligacion?.nombre_corto || 'Sin obligacion',
                        periodicidad: t.obligacion?.periodicidad || 'MENSUAL',
                        responsable_nombre: t.responsable?.nombre || null,
                        responsable_email: t.responsable?.email || null,
                        revisor_nombre: t.revisor?.nombre || null,
                        equipo_nombre: null
                    }))

                    setTareas(transformedData)
                } else {
                    setTareas(data || [])
                }
            } catch (err) {
                console.error('Error in fetchTareas:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchTareas()
    }, [supabase])

    // Alert Counts
    const alertCounts = useMemo(() => {
        const vencidas = tareas.filter(isVencida).length
        const enRiesgo = tareas.filter(isEnRiesgo).length
        const seguimiento = tareas.filter(isSeguimiento).length
        const estaSemana = tareas.filter(isEstaSemana).length
        return { vencidas, enRiesgo, seguimiento, estaSemana }
    }, [tareas])

    // Filter unique values for selects
    const equipos = useMemo(() =>
        [...new Set(tareas.map(t => t.equipo_nombre).filter(Boolean))].sort() as string[]
    , [tareas])

    const estados = useMemo(() =>
        [...new Set(tareas.map(t => t.estado))].sort()
    , [tareas])

    const responsables = useMemo(() =>
        [...new Set(tareas.map(t => t.responsable_nombre).filter(Boolean))].sort() as string[]
    , [tareas])

    const periodos = useMemo(() =>
        [...new Set(tareas.map(t => t.periodo_fiscal).filter(Boolean))].sort().reverse() as string[]
    , [tareas])

    // Filtered Tareas based on alert filter
    const tareasFiltradas = useMemo(() => {
        let filtered = tareas

        // Alert filter (applies to all modes)
        switch (alertFilter) {
            case 'vencidas':
                filtered = filtered.filter(isVencida)
                break
            case 'riesgo':
                filtered = filtered.filter(isEnRiesgo)
                break
            case 'seguimiento':
                filtered = filtered.filter(isSeguimiento)
                break
            case 'semana':
                filtered = filtered.filter(isEstaSemana)
                break
        }

        // Detalle filters
        if (viewMode === 'detalle') {
            if (filtroEquipo !== 'all') {
                filtered = filtered.filter(t => t.equipo_nombre === filtroEquipo)
            }
            if (filtroEstado !== 'all') {
                filtered = filtered.filter(t => t.estado === filtroEstado)
            }
            if (filtroResponsable !== 'all') {
                filtered = filtered.filter(t => t.responsable_nombre === filtroResponsable)
            }
            if (filtroPeriodo !== 'all') {
                filtered = filtered.filter(t => t.periodo_fiscal === filtroPeriodo)
            }

            // Sorting
            filtered = [...filtered].sort((a, b) => {
                let comparison = 0
                switch (sortField) {
                    case 'cliente':
                        comparison = (a.cliente_nombre || '').localeCompare(b.cliente_nombre || '')
                        break
                    case 'obligacion':
                        comparison = (a.obligacion_nombre || '').localeCompare(b.obligacion_nombre || '')
                        break
                    case 'responsable':
                        comparison = (a.responsable_nombre || '').localeCompare(b.responsable_nombre || '')
                        break
                    case 'estado':
                        comparison = a.estado.localeCompare(b.estado)
                        break
                    case 'fecha':
                        comparison = new Date(a.fecha_limite_oficial).getTime() - new Date(b.fecha_limite_oficial).getTime()
                        break
                    case 'dias':
                        comparison = calcularDiasRestantes(a.fecha_limite_oficial) - calcularDiasRestantes(b.fecha_limite_oficial)
                        break
                }
                return sortDirection === 'asc' ? comparison : -comparison
            })
        }

        return filtered
    }, [tareas, alertFilter, viewMode, filtroEquipo, filtroEstado, filtroResponsable, filtroPeriodo, sortField, sortDirection])

    // KPIs for Resumen mode
    const kpis = useMemo(() => {
        const total = tareas.length
        const completadas = tareas.filter(t => ['presentado', 'pagado', 'cerrado'].includes(t.estado)).length
        const enProgreso = tareas.filter(t => ['en_curso', 'pendiente_evidencia', 'en_validacion'].includes(t.estado)).length
        const pendientes = tareas.filter(t => t.estado === 'pendiente').length
        const vencidas = tareas.filter(isVencida).length
        const enRiesgo = tareas.filter(isEnRiesgo).length
        const completionRate = total > 0 ? Math.round((completadas / total) * 100) : 0

        return { total, completadas, enProgreso, pendientes, vencidas, enRiesgo, completionRate }
    }, [tareas])

    // Team Performance for Resumen mode
    const teamPerformance = useMemo((): TeamPerformance[] => {
        const teamMap = new Map<string, TeamPerformance>()

        tareas.forEach(t => {
            const teamId = t.team_id || 'sin-equipo'
            const teamName = t.equipo_nombre || 'Sin Equipo'

            if (!teamMap.has(teamId)) {
                teamMap.set(teamId, {
                    team_id: teamId,
                    nombre: teamName,
                    total: 0,
                    completadas: 0,
                    enProgreso: 0,
                    vencidas: 0,
                    porcentaje: 0
                })
            }

            const team = teamMap.get(teamId)!
            team.total++

            if (['presentado', 'pagado', 'cerrado'].includes(t.estado)) {
                team.completadas++
            } else if (['en_curso', 'pendiente_evidencia', 'en_validacion'].includes(t.estado)) {
                team.enProgreso++
            }

            if (isVencida(t)) {
                team.vencidas++
            }
        })

        return Array.from(teamMap.values())
            .map(t => ({
                ...t,
                porcentaje: t.total > 0 ? Math.round((t.completadas / t.total) * 100) : 0
            }))
            .sort((a, b) => b.porcentaje - a.porcentaje)
    }, [tareas])

    // Critico Mode Categories
    const tareasCriticas = useMemo(() => {
        const vencidas = tareas.filter(isVencida)
        const enRiesgo = tareas.filter(t => isEnRiesgo(t) && !isVencida(t))
        const sinVoBoList = tareas.filter(sinVoBo)

        return { vencidas, enRiesgo, sinVoBo: sinVoBoList }
    }, [tareas])

    // Export to Excel
    const exportToExcel = useCallback(() => {
        const headers = ['Cliente', 'RFC', 'Obligacion', 'Responsable', 'Estado', 'Fecha Limite', 'Dias', 'Equipo']
        const rows = tareasFiltradas.map(t => [
            t.cliente_nombre,
            t.rfc,
            t.obligacion_nombre,
            t.responsable_nombre || 'Sin asignar',
            t.estado,
            t.fecha_limite_oficial,
            calcularDiasRestantes(t.fecha_limite_oficial).toString(),
            t.equipo_nombre || 'Sin equipo'
        ])

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
            .join('\n')

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `TMR_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }, [tareasFiltradas])

    // Reset filters
    const resetFiltros = () => {
        setFiltroEquipo('all')
        setFiltroEstado('all')
        setFiltroResponsable('all')
        setFiltroPeriodo('all')
        setAlertFilter('all')
    }

    // Sort handler
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Toggle team expansion
    const toggleTeamExpand = (teamId: string) => {
        setExpandedTeams(prev => {
            const next = new Set(prev)
            if (next.has(teamId)) {
                next.delete(teamId)
            } else {
                next.add(teamId)
            }
            return next
        })
    }

    // Loading states
    if (isLoadingRole) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Verificando permisos...</p>
            </div>
        )
    }

    // Access Control
    if (!isSocio && !isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="bg-red-100 p-6 rounded-full">
                    <Lock className="text-red-600" size={48} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Acceso Denegado</h2>
                <p className="text-slate-600 text-center max-w-md">
                    El Centro de Control TMR 2.0 es exclusivo para Socios y Administradores.
                    <br />
                    Tu rol actual: <span className="font-semibold">{rol || 'No definido'}</span>
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Sticky Alert Bar */}
            <div className="sticky top-0 z-20 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="text-yellow-400" size={20} />
                        <span className="text-white font-bold text-sm uppercase tracking-wider">Alertas:</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Vencidas */}
                        <button
                            onClick={() => setAlertFilter(alertFilter === 'vencidas' ? 'all' : 'vencidas')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                                alertFilter === 'vencidas'
                                    ? 'bg-red-500 text-white shadow-md scale-105'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                        >
                            <XCircle size={16} />
                            <span>{alertCounts.vencidas} Vencidas</span>
                        </button>

                        {/* En Riesgo */}
                        <button
                            onClick={() => setAlertFilter(alertFilter === 'riesgo' ? 'all' : 'riesgo')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                                alertFilter === 'riesgo'
                                    ? 'bg-orange-500 text-white shadow-md scale-105'
                                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            }`}
                        >
                            <AlertTriangle size={16} />
                            <span>{alertCounts.enRiesgo} En Riesgo</span>
                        </button>

                        {/* Seguimiento */}
                        <button
                            onClick={() => setAlertFilter(alertFilter === 'seguimiento' ? 'all' : 'seguimiento')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                                alertFilter === 'seguimiento'
                                    ? 'bg-purple-500 text-white shadow-md scale-105'
                                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            }`}
                        >
                            <FileWarning size={16} />
                            <span>{alertCounts.seguimiento} Seguim</span>
                        </button>

                        {/* Esta Semana */}
                        <button
                            onClick={() => setAlertFilter(alertFilter === 'semana' ? 'all' : 'semana')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                                alertFilter === 'semana'
                                    ? 'bg-blue-500 text-white shadow-md scale-105'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                        >
                            <Calendar size={16} />
                            <span>{alertCounts.estaSemana} Sem</span>
                        </button>

                        {alertFilter !== 'all' && (
                            <button
                                onClick={() => setAlertFilter('all')}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-300 hover:text-white transition-colors"
                            >
                                <RotateCcw size={12} />
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* View Mode Tabs */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Modos:</span>

                        <div className="flex bg-slate-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('resumen')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    viewMode === 'resumen'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                <BarChart3 size={16} />
                                Resumen
                            </button>

                            <button
                                onClick={() => setViewMode('detalle')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    viewMode === 'detalle'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                <TableProperties size={16} />
                                Detalle
                            </button>

                            <button
                                onClick={() => setViewMode('critico')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    viewMode === 'critico'
                                        ? 'bg-white text-red-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                <Flame size={16} />
                                Critico
                            </button>
                        </div>
                    </div>

                    <div className="text-sm text-slate-500">
                        {getPeriodoLabel(periodoSeleccionado)} | {tareas.length} tareas totales
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4 bg-white rounded-xl border border-slate-200">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-700 font-medium">Cargando datos del TMR...</p>
                </div>
            ) : (
                <>
                    {/* ============================================
                        MODO RESUMEN
                    ============================================ */}
                    {viewMode === 'resumen' && (
                        <div className="space-y-6">
                            {/* Monthly Progress Bar */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold">Progreso del Mes</h2>
                                        <p className="text-blue-200 text-sm">{getPeriodoLabel(periodoSeleccionado)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-4xl font-bold">{kpis.completionRate}%</p>
                                        <p className="text-blue-200 text-sm">Completado</p>
                                    </div>
                                </div>
                                <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white transition-all duration-700 rounded-full"
                                        style={{ width: `${kpis.completionRate}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-sm text-blue-200">
                                    <span>{kpis.completadas} completadas</span>
                                    <span>{kpis.total - kpis.completadas} restantes</span>
                                </div>
                            </div>

                            {/* KPI Cards Grid */}
                            <KPICardGrid columns={4}>
                                <KPICard
                                    title="Total Tareas"
                                    value={kpis.total}
                                    icon={<Target size={20} />}
                                    variant="default"
                                    subtitle="Este periodo"
                                />
                                <KPICard
                                    title="Tasa Completado"
                                    value={kpis.completionRate}
                                    valueIsPercent
                                    icon={<CheckCircle size={20} />}
                                    variant="success"
                                    subtitle={`${kpis.completadas} de ${kpis.total}`}
                                />
                                <KPICard
                                    title="En Riesgo"
                                    value={kpis.enRiesgo}
                                    icon={<AlertTriangle size={20} />}
                                    variant="warning"
                                    subtitle="Proximas a vencer"
                                    onClick={() => { setAlertFilter('riesgo'); setViewMode('detalle') }}
                                />
                                <KPICard
                                    title="Vencidas"
                                    value={kpis.vencidas}
                                    icon={<XCircle size={20} />}
                                    variant="danger"
                                    subtitle="Requieren atencion"
                                    onClick={() => { setAlertFilter('vencidas'); setViewMode('detalle') }}
                                />
                            </KPICardGrid>

                            {/* Team Performance */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Users className="text-blue-600" size={20} />
                                        Rendimiento por Equipo
                                    </h3>
                                    <span className="text-sm text-slate-500">{teamPerformance.length} equipos</span>
                                </div>

                                <div className="space-y-4">
                                    {teamPerformance.map(team => (
                                        <div key={team.team_id} className="border border-slate-200 rounded-lg overflow-hidden">
                                            <div
                                                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                                                onClick={() => toggleTeamExpand(team.team_id)}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-semibold text-slate-800">{team.nombre}</span>
                                                        {team.vencidas > 0 && (
                                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                                                {team.vencidas} vencidas
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-lg font-bold ${
                                                            team.porcentaje >= 80 ? 'text-green-600' :
                                                            team.porcentaje >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                            {team.porcentaje}%
                                                        </span>
                                                        {expandedTeams.has(team.team_id) ? (
                                                            <ChevronUp size={16} className="text-slate-400" />
                                                        ) : (
                                                            <ChevronDown size={16} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 rounded-full ${
                                                            team.porcentaje >= 80 ? 'bg-green-500' :
                                                            team.porcentaje >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                        style={{ width: `${team.porcentaje}%` }}
                                                    />
                                                </div>
                                                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                                    <span>Total: {team.total}</span>
                                                    <span>Completadas: {team.completadas}</span>
                                                    <span>En Progreso: {team.enProgreso}</span>
                                                </div>
                                            </div>

                                            {expandedTeams.has(team.team_id) && (
                                                <div className="bg-slate-50 p-4 border-t border-slate-200">
                                                    <div className="grid grid-cols-4 gap-4 text-center">
                                                        <div>
                                                            <p className="text-2xl font-bold text-slate-800">{team.total}</p>
                                                            <p className="text-xs text-slate-500 uppercase">Total</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-2xl font-bold text-green-600">{team.completadas}</p>
                                                            <p className="text-xs text-slate-500 uppercase">Completadas</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-2xl font-bold text-blue-600">{team.enProgreso}</p>
                                                            <p className="text-xs text-slate-500 uppercase">En Progreso</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-2xl font-bold text-red-600">{team.vencidas}</p>
                                                            <p className="text-xs text-slate-500 uppercase">Vencidas</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 30-Day Trend Sparkline Placeholder */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                                    <TrendingUp className="text-blue-600" size={20} />
                                    Tendencia 30 Dias
                                </h3>
                                <div className="h-32 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                    <p className="text-slate-500 text-sm">Grafico de tendencia (proximamente)</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================
                        MODO DETALLE
                    ============================================ */}
                    {viewMode === 'detalle' && (
                        <div className="space-y-4">
                            {/* Filters Bar */}
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                                            <Filter size={12} /> Filtros:
                                        </span>

                                        <select
                                            value={filtroEquipo}
                                            onChange={(e) => setFiltroEquipo(e.target.value)}
                                            className="bg-white border border-slate-300 text-slate-700 py-1.5 px-3 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="all">Todos Equipos</option>
                                            {equipos.map(e => <option key={e} value={e}>{e}</option>)}
                                        </select>

                                        <select
                                            value={filtroEstado}
                                            onChange={(e) => setFiltroEstado(e.target.value)}
                                            className="bg-white border border-slate-300 text-slate-700 py-1.5 px-3 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="all">Todos Estados</option>
                                            {estados.map(e => (
                                                <option key={e} value={e}>
                                                    {ESTADO_TAREA_CONFIG[e as EstadoTarea]?.label || e}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={filtroResponsable}
                                            onChange={(e) => setFiltroResponsable(e.target.value)}
                                            className="bg-white border border-slate-300 text-slate-700 py-1.5 px-3 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="all">Todos Responsables</option>
                                            {responsables.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>

                                        <select
                                            value={filtroPeriodo}
                                            onChange={(e) => setFiltroPeriodo(e.target.value)}
                                            className="bg-white border border-slate-300 text-slate-700 py-1.5 px-3 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="all">Todos Periodos</option>
                                            {periodos.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>

                                        <button
                                            onClick={resetFiltros}
                                            className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                        >
                                            <RotateCcw size={12} /> Reset
                                        </button>
                                    </div>

                                    <button
                                        onClick={exportToExcel}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                    >
                                        <Download size={16} />
                                        Exportar Excel
                                    </button>
                                </div>
                            </div>

                            {/* Data Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[1100px]">
                                        <thead className="bg-slate-800 text-slate-200 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th
                                                    className="p-4 cursor-pointer hover:bg-slate-700 transition-colors"
                                                    onClick={() => handleSort('cliente')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Cliente
                                                        {sortField === 'cliente' && (
                                                            <ArrowUpDown size={12} className={sortDirection === 'desc' ? 'rotate-180' : ''} />
                                                        )}
                                                    </div>
                                                </th>
                                                <th
                                                    className="p-4 cursor-pointer hover:bg-slate-700 transition-colors"
                                                    onClick={() => handleSort('obligacion')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Obligacion
                                                        {sortField === 'obligacion' && (
                                                            <ArrowUpDown size={12} className={sortDirection === 'desc' ? 'rotate-180' : ''} />
                                                        )}
                                                    </div>
                                                </th>
                                                <th
                                                    className="p-4 cursor-pointer hover:bg-slate-700 transition-colors"
                                                    onClick={() => handleSort('responsable')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Responsable
                                                        {sortField === 'responsable' && (
                                                            <ArrowUpDown size={12} className={sortDirection === 'desc' ? 'rotate-180' : ''} />
                                                        )}
                                                    </div>
                                                </th>
                                                <th
                                                    className="p-4 cursor-pointer hover:bg-slate-700 transition-colors"
                                                    onClick={() => handleSort('estado')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Estado
                                                        {sortField === 'estado' && (
                                                            <ArrowUpDown size={12} className={sortDirection === 'desc' ? 'rotate-180' : ''} />
                                                        )}
                                                    </div>
                                                </th>
                                                <th
                                                    className="p-4 cursor-pointer hover:bg-slate-700 transition-colors"
                                                    onClick={() => handleSort('fecha')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Fecha Limite
                                                        {sortField === 'fecha' && (
                                                            <ArrowUpDown size={12} className={sortDirection === 'desc' ? 'rotate-180' : ''} />
                                                        )}
                                                    </div>
                                                </th>
                                                <th
                                                    className="p-4 cursor-pointer hover:bg-slate-700 transition-colors text-center"
                                                    onClick={() => handleSort('dias')}
                                                >
                                                    <div className="flex items-center justify-center gap-1">
                                                        Dias
                                                        {sortField === 'dias' && (
                                                            <ArrowUpDown size={12} className={sortDirection === 'desc' ? 'rotate-180' : ''} />
                                                        )}
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {tareasFiltradas.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="p-12 text-center text-slate-500">
                                                        <Filter size={32} className="mx-auto mb-2 opacity-50" />
                                                        <p>No hay tareas con estos filtros</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                tareasFiltradas.slice(0, 100).map(t => {
                                                    const dias = calcularDiasRestantes(t.fecha_limite_oficial)
                                                    const esVencida = isVencida(t)
                                                    const esEnRiesgo = isEnRiesgo(t)

                                                    return (
                                                        <tr key={t.tarea_id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="p-4">
                                                                <p className="font-semibold text-slate-800">{t.cliente_nombre}</p>
                                                                <p className="text-xs text-slate-500">{t.rfc}</p>
                                                            </td>
                                                            <td className="p-4 text-slate-700">
                                                                {t.obligacion_nombre}
                                                                <p className="text-xs text-slate-400">{t.periodicidad}</p>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className="text-slate-700">
                                                                    {t.responsable_nombre || 'Sin asignar'}
                                                                </span>
                                                                {t.equipo_nombre && (
                                                                    <p className="text-xs text-slate-400">{t.equipo_nombre}</p>
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                <StatusBadge
                                                                    status={t.estado as EstadoTarea}
                                                                    type="estado"
                                                                    size="sm"
                                                                    showIcon={false}
                                                                />
                                                            </td>
                                                            <td className="p-4 text-slate-700">
                                                                {new Date(t.fecha_limite_oficial).toLocaleDateString('es-MX', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${
                                                                    esVencida ? 'bg-red-100 text-red-700' :
                                                                    esEnRiesgo ? 'bg-orange-100 text-orange-700' :
                                                                    dias <= 7 ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-green-100 text-green-700'
                                                                }`}>
                                                                    {dias < 0 ? `${Math.abs(dias)}d atraso` : `${dias}d`}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {tareasFiltradas.length > 100 && (
                                    <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-sm text-slate-600">
                                        Mostrando 100 de {tareasFiltradas.length} tareas. Usa filtros para refinar la busqueda.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ============================================
                        MODO CRITICO
                    ============================================ */}
                    {viewMode === 'critico' && (
                        <div className="space-y-6">
                            {/* Vencidas */}
                            <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                                <div className="bg-red-50 px-6 py-4 border-b border-red-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                            <XCircle size={20} />
                                            Vencidas ({tareasCriticas.vencidas.length})
                                        </h3>
                                        <span className="text-sm text-red-600">Requieren atencion inmediata</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {tareasCriticas.vencidas.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                                            <p>No hay tareas vencidas</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {tareasCriticas.vencidas.slice(0, 12).map(t => (
                                                <div key={t.tarea_id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-semibold text-slate-800 text-sm">{t.cliente_nombre}</p>
                                                            <p className="text-xs text-slate-500">{t.rfc}</p>
                                                        </div>
                                                        <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                                                            {Math.abs(calcularDiasRestantes(t.fecha_limite_oficial))}d atraso
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-700 mb-2">{t.obligacion_nombre}</p>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-500">
                                                            {t.responsable_nombre || 'Sin asignar'}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            <button className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                                                                Reasignar
                                                            </button>
                                                            <button className="px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors">
                                                                Escalar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* En Riesgo */}
                            <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
                                <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                                            <AlertTriangle size={20} />
                                            En Riesgo ({tareasCriticas.enRiesgo.length})
                                        </h3>
                                        <span className="text-sm text-orange-600">Proximas a vencer (3 dias o menos)</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {tareasCriticas.enRiesgo.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                                            <p>No hay tareas en riesgo</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {tareasCriticas.enRiesgo.slice(0, 12).map(t => (
                                                <div key={t.tarea_id} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-semibold text-slate-800 text-sm">{t.cliente_nombre}</p>
                                                            <p className="text-xs text-slate-500">{t.rfc}</p>
                                                        </div>
                                                        <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                                                            {calcularDiasRestantes(t.fecha_limite_oficial)}d
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-700 mb-2">{t.obligacion_nombre}</p>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-500">
                                                            {t.responsable_nombre || 'Sin asignar'}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            <button className="px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors">
                                                                Reasignar
                                                            </button>
                                                            <button className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                                                                Priorizar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sin VoBo */}
                            <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
                                <div className="bg-purple-50 px-6 py-4 border-b border-purple-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
                                            <FileWarning size={20} />
                                            Sin VoBo ({tareasCriticas.sinVoBo.length})
                                        </h3>
                                        <span className="text-sm text-purple-600">En validacion sin revisor asignado</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {tareasCriticas.sinVoBo.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                                            <p>Todas las tareas tienen revisor asignado</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {tareasCriticas.sinVoBo.slice(0, 12).map(t => (
                                                <div key={t.tarea_id} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-semibold text-slate-800 text-sm">{t.cliente_nombre}</p>
                                                            <p className="text-xs text-slate-500">{t.rfc}</p>
                                                        </div>
                                                        <StatusBadge
                                                            status={t.estado as EstadoTarea}
                                                            type="estado"
                                                            size="sm"
                                                            showIcon={false}
                                                        />
                                                    </div>
                                                    <p className="text-sm text-slate-700 mb-2">{t.obligacion_nombre}</p>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-500">
                                                            Resp: {t.responsable_nombre || 'N/A'}
                                                        </span>
                                                        <button className="px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors">
                                                            Asignar Revisor
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bulk Actions */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-600">
                                        Total problematicas: {tareasCriticas.vencidas.length + tareasCriticas.enRiesgo.length + tareasCriticas.sinVoBo.length} tareas
                                    </p>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors flex items-center gap-2">
                                            <RefreshCw size={14} />
                                            Actualizar
                                        </button>
                                        <button
                                            onClick={exportToExcel}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                                        >
                                            <Download size={14} />
                                            Exportar Criticas
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
