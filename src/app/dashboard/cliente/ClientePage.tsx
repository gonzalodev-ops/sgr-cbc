'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Building2, FileText, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Search } from 'lucide-react'
import MatrizObligaciones from '@/components/cliente/MatrizObligaciones'

interface TareaPresentada {
    tarea_id: string
    periodo_fiscal: string
    fecha_limite_oficial: string
    nombre_corto: string
    periodicidad: string
}

interface ServicioInfo {
    servicio_id: string
    nombre: string
}

interface ClienteCompleto {
    cliente_id: string
    nombre_comercial: string
    estado: string
    rfcs: {
        contribuyente_id: string
        rfc: string
        razon_social: string
        tipo_persona: string
    }[]
    servicios: ServicioInfo[]
    obligacionesCubiertas: number
    obligacionesTotales: number
    tareasActivas: number
    tareasCompletadas: number
    tareasPresentadas: TareaPresentada[]
}

export default function ClientesPage() {
    const [clientes, setClientes] = useState<ClienteCompleto[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)
    const [filtro, setFiltro] = useState('')

    useEffect(() => {
        // Create Supabase client only on client-side
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        async function fetchClientes() {
            setLoading(true)

            // 1. Clientes con contribuyentes
            const { data: clientesData } = await supabase
                .from('cliente')
                .select(`
                    cliente_id,
                    nombre_comercial,
                    estado,
                    cliente_contribuyente (
                        contribuyente:contribuyente_id (contribuyente_id, rfc, razon_social, tipo_persona)
                    )
                `)
                .eq('estado', 'ACTIVO')
                .order('nombre_comercial')

            // 2. Servicios por cliente
            const { data: serviciosData } = await supabase
                .from('cliente_servicio')
                .select('cliente_id, servicio_id')
                .eq('activo', true)

            // 2.5 Obtener nombres de servicios
            const { data: serviciosInfo } = await supabase
                .from('servicio')
                .select('servicio_id, nombre')
                .eq('activo', true)

            // Crear mapa de servicio_id -> nombre
            const servicioNombreMap = new Map<string, string>()
            ;(serviciosInfo || []).forEach((s: any) => {
                servicioNombreMap.set(s.servicio_id, s.nombre)
            })

            // 3. Tareas por cliente (con detalles para presentadas sin pago)
            const { data: tareasData } = await supabase
                .from('tarea')
                .select(`
                    tarea_id,
                    cliente_id,
                    estado,
                    periodo_fiscal,
                    fecha_limite_oficial,
                    obligacion:id_obligacion (
                        nombre_corto,
                        periodicidad
                    )
                `)

            // 4. Obligaciones por servicio (para calcular cobertura)
            const { data: servicioOblig } = await supabase
                .from('servicio_obligacion')
                .select('servicio_id')

            // Construir clientes completos
            const clientesCompletos: ClienteCompleto[] = (clientesData || []).map((c: any) => {
                const rfcs = (c.cliente_contribuyente || [])
                    .map((cc: any) => cc.contribuyente)
                    .filter(Boolean)
                    .map((contrib: any) => ({
                        contribuyente_id: contrib.contribuyente_id,
                        rfc: contrib.rfc,
                        razon_social: contrib.razon_social,
                        tipo_persona: contrib.tipo_persona
                    }))

                const serviciosClienteIds = (serviciosData || [])
                    .filter((s: any) => s.cliente_id === c.cliente_id)
                    .map((s: any) => s.servicio_id)

                const serviciosCliente: ServicioInfo[] = serviciosClienteIds.map((id: string) => ({
                    servicio_id: id,
                    nombre: servicioNombreMap.get(id) || id
                }))

                const tareas = (tareasData || []).filter((t: any) => t.cliente_id === c.cliente_id)
                const tareasActivas = tareas.filter((t: any) =>
                    !['presentado', 'pagado', 'cerrado'].includes(t.estado)
                ).length
                const tareasCompletadas = tareas.filter((t: any) =>
                    ['presentado', 'pagado', 'cerrado'].includes(t.estado)
                ).length

                // Tareas presentadas sin pago
                const tareasPresentadas: TareaPresentada[] = tareas
                    .filter((t: any) => t.estado === 'presentado')
                    .map((t: any) => ({
                        tarea_id: t.tarea_id,
                        periodo_fiscal: t.periodo_fiscal || 'N/A',
                        fecha_limite_oficial: t.fecha_limite_oficial || '',
                        nombre_corto: t.obligacion?.nombre_corto || 'N/A',
                        periodicidad: t.obligacion?.periodicidad || 'N/A'
                    }))

                // Obligaciones cubiertas por los servicios
                const obligCubiertas = (servicioOblig || [])
                    .filter((so: any) => serviciosClienteIds.includes(so.servicio_id)).length

                return {
                    cliente_id: c.cliente_id,
                    nombre_comercial: c.nombre_comercial,
                    estado: c.estado,
                    rfcs,
                    servicios: serviciosCliente,
                    obligacionesCubiertas: obligCubiertas,
                    obligacionesTotales: rfcs.length * 5, // Estimado por régimen
                    tareasActivas,
                    tareasCompletadas,
                    tareasPresentadas
                }
            })

            setClientes(clientesCompletos)
            setLoading(false)
        }

        fetchClientes()
    }, []) // Run once on mount

    // Filtrar clientes
    const clientesFiltrados = useMemo(() => {
        if (!filtro) return clientes
        const q = filtro.toLowerCase()
        return clientes.filter(c =>
            c.nombre_comercial.toLowerCase().includes(q) ||
            c.rfcs.some(r => r.rfc.toLowerCase().includes(q))
        )
    }, [clientes, filtro])

    // KPIs
    const totalClientes = clientes.length
    const totalRFCs = useMemo(() => clientes.reduce((sum, c) => sum + c.rfcs.length, 0), [clientes])
    const totalTareasActivas = useMemo(() => clientes.reduce((sum, c) => sum + c.tareasActivas, 0), [clientes])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
                            <p className="text-slate-700">Gestión de clientes, RFCs y servicios</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-slate-600 uppercase font-bold">Clientes</p>
                            <p className="text-2xl font-bold text-emerald-600">{totalClientes}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-600 uppercase font-bold">RFCs</p>
                            <p className="text-2xl font-bold text-slate-600">{totalRFCs}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-600 uppercase font-bold">Tareas Activas</p>
                            <p className="text-2xl font-bold text-blue-600">{totalTareasActivas}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Búsqueda */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nombre o RFC..."
                    value={filtro}
                    onChange={e => setFiltro(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>

            {/* Lista de Clientes */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4 bg-white rounded-xl border border-slate-200">
                    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-700 font-medium">Cargando clientes...</p>
                </div>
            ) : clientesFiltrados.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-slate-200 border-dashed">
                    <Building2 className="mx-auto mb-4 text-slate-600" size={48} />
                    <h3 className="text-lg font-medium text-slate-900">No hay clientes</h3>
                    <p className="text-slate-700 mt-2">Agrega clientes desde Configuración.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {clientesFiltrados.map(c => (
                        <div key={c.cliente_id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            {/* Header del Cliente */}
                            <div
                                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setExpanded(expanded === c.cliente_id ? null : c.cliente_id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{c.nombre_comercial}</h3>
                                        <p className="text-sm text-slate-600">{c.rfcs.length} RFC{c.rfcs.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {/* Indicadores */}
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <FileText size={16} className="text-slate-600" />
                                            <span className="text-slate-600">{c.servicios.length} servicios</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckCircle size={16} className="text-green-500" />
                                            <span className="text-slate-600">{c.tareasCompletadas} completadas</span>
                                        </div>
                                        {c.tareasActivas > 0 && (
                                            <div className="flex items-center gap-1">
                                                <AlertCircle size={16} className="text-blue-500" />
                                                <span className="text-blue-600 font-medium">{c.tareasActivas} activas</span>
                                            </div>
                                        )}
                                        {c.tareasPresentadas.length > 0 && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded">
                                                <AlertCircle size={16} className="text-red-500" />
                                                <span className="text-red-700 font-bold">{c.tareasPresentadas.length} sin pago</span>
                                            </div>
                                        )}
                                    </div>

                                    {expanded === c.cliente_id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {/* Detalles expandidos */}
                            {expanded === c.cliente_id && (
                                <div className="border-t border-slate-100 bg-slate-50 p-5 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* RFCs */}
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">RFCs Registrados</h4>
                                            <div className="space-y-2">
                                                {c.rfcs.map((r, i) => (
                                                    <div key={i} className="bg-white p-3 rounded-lg border border-slate-200">
                                                        <p className="font-mono font-semibold text-slate-800">{r.rfc}</p>
                                                        <p className="text-sm text-slate-700">{r.razon_social}</p>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${r.tipo_persona === 'PM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {r.tipo_persona === 'PM' ? 'Persona Moral' : 'Persona Física'}
                                                        </span>
                                                    </div>
                                                ))}
                                                {c.rfcs.length === 0 && (
                                                    <p className="text-sm text-slate-600">Sin RFCs registrados</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Servicios y Cobertura */}
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Servicios Contratados</h4>
                                            {c.servicios.length > 0 ? (
                                                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        {c.servicios.map((s, i) => (
                                                            <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                                                                {s.nombre}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="pt-3 border-t border-slate-100">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-slate-700">Cobertura de obligaciones:</span>
                                                            <span className="font-bold text-emerald-600">
                                                                {c.obligacionesCubiertas} / {c.obligacionesTotales}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-emerald-500 transition-all"
                                                                style={{ width: `${Math.min(100, (c.obligacionesCubiertas / c.obligacionesTotales) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                                    <p className="text-sm text-amber-700 flex items-center gap-2">
                                                        <AlertCircle size={16} />
                                                        Sin servicios contratados
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Matriz de Obligaciones */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Matriz de Obligaciones Fiscales</h4>
                                        <MatrizObligaciones clienteId={c.cliente_id} />
                                    </div>

                                    {/* Tareas Presentadas Sin Pago */}
                                    {c.tareasPresentadas.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-red-700 uppercase mb-3 flex items-center gap-2">
                                                <AlertCircle size={16} className="text-red-500" />
                                                Impuestos Pendientes de Pago ({c.tareasPresentadas.length})
                                            </h4>
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                <p className="text-sm text-red-700 mb-3">
                                                    Los siguientes impuestos fueron presentados ante el SAT pero el cliente aún no ha realizado el pago:
                                                </p>
                                                <div className="space-y-2">
                                                    {c.tareasPresentadas.map((t, i) => (
                                                        <div key={i} className="bg-white p-3 rounded-lg border border-red-200 flex justify-between items-center">
                                                            <div>
                                                                <p className="font-semibold text-slate-800">{t.nombre_corto}</p>
                                                                <p className="text-xs text-slate-600">
                                                                    Periodo: {t.periodo_fiscal} | {t.periodicidad}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="px-2 py-1 bg-red-100 text-red-700 border border-red-300 rounded text-[10px] font-bold uppercase">
                                                                    SIN PAGO
                                                                </span>
                                                                {t.fecha_limite_oficial && (
                                                                    <p className="text-xs text-slate-600 mt-1">
                                                                        Límite: {new Date(t.fecha_limite_oficial).toLocaleDateString('es-MX')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
