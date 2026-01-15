'use client'

import { useState, useMemo, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
    ESTADO_CONFIG,
    ESTADOS_CICLO,
    calcularPuntos,
    type Entregable,
    type EstadoEntregable,
    type ResultadoAuditoria
} from '@/lib/data/mockData'
import { Link, CheckCircle, Shield, AlertCircle, RotateCcw, Filter, Calendar, AlertTriangle } from 'lucide-react'
import AjusteFechaModal from '@/components/tarea/AjusteFechaModal'

// Constantes
const QUERY_LIMIT = 500
const PUNTOS_BASE_DEFAULT = 50

// Helper to create client only on client-side
function getSupabaseClient() {
    if (typeof window === 'undefined') return null
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export default function TMRPage() {
    const [entregables, setEntregables] = useState<Entregable[]>([])
    const [loading, setLoading] = useState(true)
    const [modalAjusteFecha, setModalAjusteFecha] = useState<{ tareaId: string; fechaActual: string } | null>(null)

    // Lazy initialization - only creates client on client-side
    const supabase = useMemo(() => getSupabaseClient(), [])

    // Cargar datos de Supabase
    useEffect(() => {
        if (!supabase) return // Skip on server-side
        const client = supabase // Capture for TypeScript narrowing

        async function fetchEntregables() {
            setLoading(true)

            // 1. Traer mapeo de usuarios a equipos (para tribu)
            const { data: teamData } = await client
                .from('team_members')
                .select(`
                    user_id,
                    teams:team_id (nombre)
                `)
                .limit(QUERY_LIMIT)

            interface TeamMemberData {
                user_id: string
                teams: { nombre: string } | null
            }

            const userTeamMap: Record<string, string> = {}
            if (teamData) {
                (teamData as TeamMemberData[]).forEach((tm) => {
                    if (tm.user_id && tm.teams?.nombre) {
                        userTeamMap[tm.user_id] = tm.teams.nombre
                    }
                })
            }

            // 2. Traer tallas por cliente
            const { data: tallaData } = await client
                .from('cliente_talla')
                .select('cliente_id, talla_id, dominio_talla')
                .eq('activo', true)
                .limit(QUERY_LIMIT)

            interface ClienteTallaData {
                cliente_id: string
                talla_id: string
                dominio_talla: string
            }

            const clienteTallaMap: Record<string, string> = {}
            if (tallaData) {
                (tallaData as ClienteTallaData[]).forEach((ct) => {
                    // Usar talla FISCAL como default
                    if (ct.dominio_talla === 'FISCAL') {
                        clienteTallaMap[ct.cliente_id] = ct.talla_id
                    }
                })
            }

            // 3. Traer evidencias existentes (resuelve TODO de tarea_documento)
            const { data: evidenciaData } = await client
                .from('tarea_documento')
                .select('tarea_id')
                .eq('tipo', 'EVIDENCIA')
                .limit(QUERY_LIMIT)

            const tareasConEvidencia = new Set<string>()
            if (evidenciaData) {
                evidenciaData.forEach((e: { tarea_id: string }) => {
                    tareasConEvidencia.add(e.tarea_id)
                })
            }

            // 4. Query principal de tareas
            const { data, error } = await client
                .from('tarea')
                .select(`
                    tarea_id,
                    cliente_id,
                    estado,
                    periodo_fiscal,
                    fecha_limite_oficial,
                    prioridad,
                    riesgo,
                    en_riesgo,
                    id_obligacion,
                    responsable_usuario_id,
                    contribuyente:contribuyente_id (
                        rfc,
                        razon_social,
                        nombre_comercial,
                        team_id,
                        equipo:team_id (nombre)
                    ),
                    cliente:cliente_id (
                        nombre_comercial
                    ),
                    responsable:responsable_usuario_id (
                        nombre,
                        rol_global
                    ),
                    obligacion:id_obligacion (
                        nombre_corto,
                        periodicidad
                    )
                `)
                .order('fecha_limite_oficial', { ascending: true })
                .limit(QUERY_LIMIT)

            if (error) {
                // Solo loguear en desarrollo
                if (process.env.NODE_ENV === 'development') {
                    console.error('Error fetching tasks:', error)
                }
                setLoading(false)
                return
            }

            if (data) {
                // Interfaces para el mapeo de datos
                interface TareaData {
                    tarea_id: string
                    cliente_id: string
                    estado: string
                    en_riesgo: boolean
                    id_obligacion: string
                    responsable_usuario_id: string | null
                    contribuyente: {
                        rfc: string
                        razon_social: string
                        nombre_comercial: string | null
                        team_id: string | null
                        equipo: { nombre: string } | null
                    } | null
                    cliente: { nombre_comercial: string } | null
                    responsable: { nombre: string; rol_global: string } | null
                    obligacion: { nombre_corto: string; periodicidad: string } | null
                }

                const mappedData: Entregable[] = (data as TareaData[]).map((t) => {
                    // Mapear talla de BD a formato TMR
                    const dbTalla = clienteTallaMap[t.cliente_id] || 'MEDIANA'
                    const tallaMap: Record<string, string> = {
                        'EXTRA_CHICA': 'XS',
                        'CHICA': 'S',
                        'MEDIANA': 'M',
                        'GRANDE': 'L',
                        'EXTRA_GRANDE': 'XL'
                    }

                    return {
                        id: t.tarea_id,
                        rfc: t.contribuyente?.rfc || 'N/A',
                        cliente: t.cliente?.nombre_comercial || t.contribuyente?.nombre_comercial || 'N/A',
                        entregable: t.obligacion?.nombre_corto || t.id_obligacion,
                        talla: (tallaMap[dbTalla] || 'M') as Entregable['talla'],
                        puntosBase: PUNTOS_BASE_DEFAULT, // Scoring engine pendiente de implementación
                        responsable: t.responsable?.nombre || 'Sin asignar',
                        rol: t.responsable?.rol_global || 'COLABORADOR',
                        tribu: t.contribuyente?.equipo?.nombre || userTeamMap[t.responsable_usuario_id || ''] || 'Sin equipo',
                        estado: mapEstado(t.estado),
                        estadoOriginal: t.estado,
                        enRiesgo: t.en_riesgo || false,
                        fechaLimite: t.fecha_limite_oficial,
                        evidencia: tareasConEvidencia.has(t.tarea_id),
                        voboLider: ['presentado', 'pagado', 'cerrado'].includes(t.estado),
                        auditoria: 'no_auditado' as ResultadoAuditoria
                    }
                })
                setEntregables(mappedData)
            }
            setLoading(false)
        }

        // Mapear estados de BD a estados del TMR
        function mapEstado(dbEstado: string): EstadoEntregable {
            const map: Record<string, EstadoEntregable> = {
                'pendiente': 'no_iniciado',
                'en_curso': 'en_curso',
                'en_validacion': 'revision',
                'pendiente_evidencia': 'en_curso',
                'bloqueado_cliente': 'bloqueado_cliente',
                'presentado': 'terminado',
                'pagado': 'terminado',
                'cerrado': 'terminado',
                'rechazado': 'rechazado'
            }
            return map[dbEstado] || 'no_iniciado'
        }

        fetchEntregables()
    }, [supabase])



    // Filtros
    const [filtroRFC, setFiltroRFC] = useState('all')
    const [filtroTribu, setFiltroTribu] = useState('all')
    const [filtroEntregable, setFiltroEntregable] = useState('all')
    const [filtroResponsable, setFiltroResponsable] = useState('all')

    // Opciones únicas para filtros
    const rfcs = useMemo(() => [...new Set(entregables.map(e => e.rfc))].sort(), [entregables])
    const tribus = useMemo(() => [...new Set(entregables.map(e => e.tribu))].filter(t => t !== 'Sin equipo').sort(), [entregables])
    const tiposEntregable = useMemo(() => [...new Set(entregables.map(e => e.entregable))].sort(), [entregables])
    const responsables = useMemo(() => [...new Set(entregables.map(e => e.responsable))].sort(), [entregables])


    // Filtrar entregables
    const entregablesFiltrados = useMemo(() => {
        return entregables.filter(e => {
            const matchRFC = filtroRFC === 'all' || e.rfc === filtroRFC
            const matchTribu = filtroTribu === 'all' || e.tribu === filtroTribu
            const matchEntregable = filtroEntregable === 'all' || e.entregable === filtroEntregable
            const matchResponsable = filtroResponsable === 'all' || e.responsable === filtroResponsable
            return matchRFC && matchTribu && matchEntregable && matchResponsable
        })
    }, [entregables, filtroRFC, filtroTribu, filtroEntregable, filtroResponsable])

    // KPIs
    const puntosGlobales = useMemo(() =>
        entregables.reduce((sum, e) => sum + calcularPuntos(e), 0)
        , [entregables])

    const puntosFiltrados = useMemo(() =>
        entregablesFiltrados.reduce((sum, e) => sum + calcularPuntos(e), 0)
        , [entregablesFiltrados])

    const tareasEsperandoPago = useMemo(() =>
        entregables.filter(e => (e as any).estadoOriginal === 'presentado').length
        , [entregables])

    const tareasEnRiesgo = useMemo(() =>
        entregables.filter(e => (e as any).enRiesgo === true).length
        , [entregables])

    const hayFiltrosActivos = filtroRFC !== 'all' || filtroTribu !== 'all' || filtroEntregable !== 'all' || filtroResponsable !== 'all'

    // Acciones
    const toggleEstado = async (id: string, currentEstado: EstadoEntregable) => {
        if (!supabase) return
        const currentIndex = ESTADOS_CICLO.indexOf(currentEstado)
        const nextEstado = ESTADOS_CICLO[(currentIndex + 1) % ESTADOS_CICLO.length]

        // Optimistic update
        setEntregables(prev => prev.map(e => e.id === id ? { ...e, estado: nextEstado } : e))

        const { error } = await supabase
            .from('tarea')
            .update({ estado: nextEstado })
            .eq('tarea_id', id)

        if (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error updating status:', error)
            }
            // Rollback if error
            setEntregables(prev => prev.map(e => e.id === id ? { ...e, estado: currentEstado } : e))
        }
    }

    const toggleEvidencia = (id: string) => {
        // Por ahora solo toggle local, ya que requiere upload de archivo
        setEntregables(prev => prev.map(e =>
            e.id === id ? { ...e, evidencia: !e.evidencia } : e
        ))
    }

    const toggleVobo = async (id: string, currentVobo: boolean) => {
        if (!supabase) return
        const nextVobo = !currentVobo

        // Optimistic update
        setEntregables(prev => prev.map(e => e.id === id ? { ...e, voboLider: nextVobo } : e))

        const { error } = await supabase
            .from('tarea')
            .update({ vobo_lider: nextVobo })
            .eq('tarea_id', id)

        if (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error updating vobo:', error)
            }
            setEntregables(prev => prev.map(e => e.id === id ? { ...e, voboLider: currentVobo } : e))
        }
    }

    const cycleAuditoria = async (id: string, currentAuditoria: ResultadoAuditoria) => {
        if (!supabase) return
        const ciclo: ResultadoAuditoria[] = ['no_auditado', 'pendiente', 'aprobado', 'rechazado']
        const currentIndex = ciclo.indexOf(currentAuditoria)
        const nextAuditoria = ciclo[(currentIndex + 1) % ciclo.length]

        // Optimistic update
        setEntregables(prev => prev.map(e => e.id === id ? { ...e, auditoria: nextAuditoria } : e))

        // La auditoría es una tabla aparte, pero para el TMR rápido podemos upsertar
        const { error } = await supabase
            .from('tarea_auditoria')
            .upsert({
                tarea_id: id,
                resultado: nextAuditoria.toUpperCase(),
                auditor_id: (await supabase.auth.getUser()).data.user?.id // Auditor actual
            }, { onConflict: 'tarea_id' })

        if (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error updating auditoria:', error)
            }
            setEntregables(prev => prev.map(e => e.id === id ? { ...e, auditoria: currentAuditoria } : e))
        }
    }

    const resetFiltros = () => {
        setFiltroRFC('all')
        setFiltroTribu('all')
        setFiltroEntregable('all')
        setFiltroResponsable('all')
    }

    const getAuditoriaIcon = (auditoria: ResultadoAuditoria) => {
        switch (auditoria) {
            case 'aprobado': return <Shield className="text-green-500" size={18} />
            case 'rechazado': return <AlertCircle className="text-red-500 animate-pulse" size={18} />
            case 'pendiente': return <Shield className="text-yellow-500" size={18} />
            default: return <span className="text-slate-300">-</span>
        }
    }

    return (
        <div className="space-y-4">
            {/* Header con KPI Global */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <div className="bg-blue-600 text-white p-2 rounded-lg">
                            <Filter size={18} />
                        </div>
                        Tablero Maestro de Resultados
                    </h1>
                    <p className="text-slate-600 text-xs mt-1 ml-10">Vista de Tribu: {filtroTribu === 'all' ? 'Todas' : filtroTribu}</p>
                </div>

                <div className="flex items-center gap-6">
                    {tareasEnRiesgo > 0 && (
                        <div className="text-right px-4 py-2 bg-orange-50 border border-orange-300 rounded-lg animate-pulse">
                            <p className="text-[10px] text-orange-700 font-bold uppercase tracking-wider flex items-center gap-1">
                                <AlertTriangle size={12} /> En Riesgo
                            </p>
                            <div className="text-2xl font-bold text-orange-600">
                                {tareasEnRiesgo} <span className="text-sm text-orange-600 font-normal">tarea{tareasEnRiesgo !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    )}
                    {tareasEsperandoPago > 0 && (
                        <div className="text-right px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-[10px] text-red-700 font-bold uppercase tracking-wider">Esperando Pago</p>
                            <div className="text-2xl font-bold text-red-600">
                                {tareasEsperandoPago} <span className="text-sm text-red-600 font-normal">tarea{tareasEsperandoPago !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    )}
                    <div className="text-right">
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Meta Grupal (Bono)</p>
                        <div className="text-2xl font-bold text-slate-800">
                            {puntosGlobales} <span className="text-sm text-slate-600 font-normal">/ 1000</span>
                        </div>
                    </div>
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${Math.min(100, (puntosGlobales / 1000) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-slate-100 rounded-xl px-4 py-3 flex justify-between items-center flex-wrap gap-2">
                <div className="flex gap-3 items-center flex-wrap">
                    <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                        <Filter size={12} /> Filtrar:
                    </span>

                    {/* Filtro RFC */}
                    <select
                        value={filtroRFC}
                        onChange={(e) => setFiltroRFC(e.target.value)}
                        className="bg-white border border-slate-300 text-slate-700 py-1.5 px-3 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer w-40"
                    >
                        <option value="all">📋 Todos RFC</option>
                        {rfcs.map(rfc => <option key={rfc} value={rfc}>{rfc}</option>)}
                    </select>

                    {/* Filtro Tribu */}
                    <select
                        value={filtroTribu}
                        onChange={(e) => setFiltroTribu(e.target.value)}
                        className="bg-white border border-slate-300 text-slate-700 py-1.5 px-3 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer w-36"
                    >
                        <option value="all">👥 Todas Tribus</option>
                        {tribus.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    {/* Filtro Entregable */}
                    <select
                        value={filtroEntregable}
                        onChange={(e) => setFiltroEntregable(e.target.value)}
                        className="bg-white border border-slate-300 text-slate-700 py-1.5 px-3 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer w-48"
                    >
                        <option value="all">📦 Todos Entregables</option>
                        {tiposEntregable.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    {/* Filtro Responsable */}
                    <select
                        value={filtroResponsable}
                        onChange={(e) => setFiltroResponsable(e.target.value)}
                        className="bg-white border border-slate-300 text-slate-700 py-1.5 px-3 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer w-44"
                    >
                        <option value="all">👤 Todos Resp.</option>
                        {responsables.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>

                    <button
                        onClick={resetFiltros}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                    >
                        <RotateCcw size={12} /> Reset
                    </button>
                </div>

                {/* KPI Filtrado */}
                {hayFiltrosActivos && (
                    <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">
                        <span className="text-xs text-slate-700 font-bold">Puntos en Pantalla:</span>
                        <span className="text-sm font-bold text-blue-700">{puntosFiltrados}</span>
                    </div>
                )}
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-700 font-medium">Cargando datos reales...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead className="bg-slate-800 text-slate-200 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 w-2/12">RFC / Cliente</th>
                                    <th className="p-4 w-2/12">Entregable</th>
                                    <th className="p-4 w-1/12 text-center">Talla</th>
                                    <th className="p-4 w-1/12 text-center">Tribu</th>
                                    <th className="p-4 w-2/12 text-center">Responsable</th>
                                    <th className="p-4 w-2/12 text-center">Estado</th>
                                    <th className="p-4 w-1/12 text-center bg-purple-900/40 border-l border-slate-600" title="Ajustar Fecha">
                                        <Calendar size={14} className="inline" />
                                    </th>
                                    <th className="p-4 w-1/12 text-center bg-blue-900/40 border-l border-slate-600" title="Evidencia">
                                        <Link size={14} className="inline" />
                                    </th>
                                    <th className="p-4 w-1/12 text-center bg-blue-900/40" title="VoBo Líder">
                                        <CheckCircle size={14} className="inline" />
                                    </th>
                                    <th className="p-4 w-1/12 text-center bg-red-900/40 border-l border-slate-600" title="Auditoría">
                                        <Shield size={14} className="inline" />
                                    </th>
                                    <th className="p-4 w-1/12 text-right bg-green-900/40 border-l border-slate-600">Pts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {entregablesFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="p-12 text-center text-slate-600">
                                            <div className="flex flex-col items-center gap-2">
                                                <Filter size={32} className="opacity-50" />
                                                <p>No hay entregables con estos filtros.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    entregablesFiltrados.map(e => {
                                        const estadoConfig = ESTADO_CONFIG[e.estado]
                                        const puntos = calcularPuntos(e)

                                        return (
                                            <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-4">
                                                    <p className="font-semibold text-slate-700">{e.rfc}</p>
                                                    <p className="text-xs text-slate-600">{e.cliente}</p>
                                                </td>
                                                <td className="p-4 text-slate-600">
                                                    {e.entregable}
                                                    {e.entregable.includes('Backlog') && (
                                                        <span className="ml-2 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-purple-200">x2</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${['L', 'XL'].includes(e.talla) ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                                        {e.talla}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-xs text-slate-700 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                                                        {e.tribu}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-[10px] border border-slate-200 font-medium">
                                                        {e.responsable} <span className="text-slate-600">({e.rol})</span>
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <button
                                                            onClick={() => toggleEstado(e.id, e.estado)}
                                                            className={`px-3 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wide ${estadoConfig.bgColor} ${estadoConfig.color} shadow-sm hover:shadow transition-all transform hover:scale-105`}
                                                        >
                                                            {estadoConfig.label}
                                                        </button>
                                                        {(e as any).enRiesgo && (
                                                            <div className="relative group">
                                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-300 rounded text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 animate-pulse">
                                                                    <AlertTriangle size={10} /> RIESGO
                                                                </span>
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                                    Tarea en riesgo: Presentada ante el SAT pero sin comprobante de pago despues de 3 dias
                                                                </div>
                                                            </div>
                                                        )}
                                                        {(e as any).estadoOriginal === 'presentado' && !(e as any).enRiesgo && (
                                                            <div className="relative group">
                                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded text-[9px] font-bold uppercase tracking-wide">
                                                                    SIN PAGO
                                                                </span>
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                                    El impuesto fue presentado ante el SAT pero el cliente aun no ha realizado el pago
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td
                                                    className="p-4 text-center bg-purple-50/20 border-l border-slate-100 cursor-pointer hover:bg-purple-100/50 transition-colors"
                                                    onClick={() => setModalAjusteFecha({ tareaId: e.id, fechaActual: (e as any).fechaLimite })}
                                                >
                                                    <Calendar className="text-purple-600 mx-auto" size={16} />
                                                </td>
                                                <td
                                                    className="p-4 text-center bg-blue-50/20 border-l border-slate-100 cursor-pointer hover:bg-blue-100/50 transition-colors"
                                                    onClick={() => toggleEvidencia(e.id)}
                                                >
                                                    {e.evidencia ? <Link className="text-blue-600 mx-auto" size={16} /> : <span className="text-slate-300 group-hover:text-blue-400">+</span>}
                                                </td>
                                                <td
                                                    className="p-4 text-center bg-blue-50/20 cursor-pointer hover:bg-blue-100/50 transition-colors"
                                                    onClick={() => toggleVobo(e.id, e.voboLider)}
                                                >
                                                    {e.voboLider ? <CheckCircle className="text-blue-600 mx-auto" size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 mx-auto" />}
                                                </td>
                                                <td
                                                    className="p-4 text-center bg-red-50/20 border-l border-slate-100 cursor-pointer hover:bg-red-100/50 transition-colors"
                                                    onClick={() => cycleAuditoria(e.id, e.auditoria)}
                                                >
                                                    {getAuditoriaIcon(e.auditoria)}
                                                </td>
                                                <td className="p-4 text-right font-bold bg-green-50/20 border-l border-slate-100">
                                                    <span className={puntos > 0 ? 'text-green-600' : 'text-slate-300'}>
                                                        {puntos}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal de Ajuste de Fecha */}
            {modalAjusteFecha && (
                <AjusteFechaModal
                    tareaId={modalAjusteFecha.tareaId}
                    fechaActual={modalAjusteFecha.fechaActual}
                    onClose={() => setModalAjusteFecha(null)}
                    onSave={() => {
                        // Recargar datos después de guardar
                        setModalAjusteFecha(null)
                        // Forzar recarga de entregables
                        if (supabase) {
                            setLoading(true)
                            // Trigger reload by updating state
                            setTimeout(() => window.location.reload(), 100)
                        }
                    }}
                />
            )}
        </div>
    )
}
