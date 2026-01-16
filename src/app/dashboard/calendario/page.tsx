'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Calendar, ChevronLeft, ChevronRight, Plus, CalendarDays, CalendarRange } from 'lucide-react'
import CalendarioMensual from '@/components/calendario/CalendarioMensual'
import CalendarioSemanal from '@/components/calendario/CalendarioSemanal'
import EventoForm from '@/components/calendario/EventoForm'

interface Tarea {
    tarea_id: string
    fecha_limite_oficial: string
    estado: string
    periodo_fiscal: string
    cliente: { nombre_comercial: string } | null
    contribuyente: { rfc: string } | null
    obligacion: { nombre_corto: string } | null
    responsable: { nombre: string; user_id: string } | null
}

interface Evento {
    evento_id: string
    titulo: string
    descripcion: string
    fecha: string
    hora: string
    tipo: 'REUNION' | 'RECORDATORIO' | 'OTRO'
    usuario_id: string
    equipo_id: string
    activo: boolean
}

interface Equipo {
    team_id: string
    nombre: string
}

interface ItemCalendario {
    id: string
    tipo: 'tarea' | 'evento'
    titulo: string
    subtitulo?: string
    hora?: string
    estado?: string
    tipoEvento?: 'REUNION' | 'RECORDATORIO' | 'OTRO'
}

type VistaCalendario = 'mensual' | 'semanal'
type FiltroTipo = 'todos' | 'tareas' | 'eventos'

export default function CalendarioPage() {
    const [loading, setLoading] = useState(true)
    const [tareas, setTareas] = useState<Tarea[]>([])
    const [eventos, setEventos] = useState<Evento[]>([])
    const [equipos, setEquipos] = useState<Equipo[]>([])

    // Estado de vista y filtros
    const [vista, setVista] = useState<VistaCalendario>('mensual')
    const [fechaActual, setFechaActual] = useState(new Date())
    const [filtroTribu, setFiltroTribu] = useState('all')
    const [filtroCliente, setFiltroCliente] = useState('all')
    const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')

    // Modal de evento
    const [mostrarFormEvento, setMostrarFormEvento] = useState(false)
    const [eventoEditar, setEventoEditar] = useState<Evento | null>(null)
    const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(undefined)

    const supabase = useMemo(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), [])

    // Calcular rango de fechas según la vista
    const rangoFechas = useMemo(() => {
        if (vista === 'mensual') {
            const inicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
            const fin = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0)
            return { inicio, fin }
        } else {
            // Semanal: del lunes al domingo
            const d = new Date(fechaActual)
            const dia = d.getDay()
            const diff = dia === 0 ? -6 : 1 - dia
            const inicio = new Date(d)
            inicio.setDate(d.getDate() + diff)
            const fin = new Date(inicio)
            fin.setDate(inicio.getDate() + 6)
            return { inicio, fin }
        }
    }, [vista, fechaActual])

    // Cargar datos desde Supabase
    useEffect(() => {
        async function fetchData() {
            setLoading(true)

            const { inicio, fin } = rangoFechas
            // Formatear fecha local para evitar desplazamiento por zona horaria
            const formatFechaLocal = (d: Date) => {
                const year = d.getFullYear()
                const month = String(d.getMonth() + 1).padStart(2, '0')
                const day = String(d.getDate()).padStart(2, '0')
                return `${year}-${month}-${day}`
            }
            const inicioStr = formatFechaLocal(inicio)
            const finStr = formatFechaLocal(fin)

            // Cargar tareas
            const { data: tareasData } = await supabase
                .from('tarea')
                .select(`
                    tarea_id,
                    fecha_limite_oficial,
                    estado,
                    periodo_fiscal,
                    cliente:cliente_id(nombre_comercial),
                    contribuyente:contribuyente_id(rfc),
                    obligacion:id_obligacion(nombre_corto),
                    responsable:responsable_usuario_id(nombre, user_id)
                `)
                .gte('fecha_limite_oficial', inicioStr)
                .lte('fecha_limite_oficial', finStr)
                .order('fecha_limite_oficial')

            // Cargar eventos
            const { data: eventosData } = await supabase
                .from('evento_calendario')
                .select('*')
                .gte('fecha', inicioStr)
                .lte('fecha', finStr)
                .eq('activo', true)
                .order('fecha')

            // Cargar equipos para filtro
            const { data: equiposData } = await supabase
                .from('teams')
                .select('team_id, nombre')
                .eq('activo', true)

            // Transformar datos de Supabase (relaciones vienen como arrays)
            interface TareaSupabaseRow {
                tarea_id: string
                fecha_limite_oficial: string
                estado: string
                periodo_fiscal: string
                cliente: { nombre_comercial: string } | { nombre_comercial: string }[] | null
                contribuyente: { rfc: string } | { rfc: string }[] | null
                obligacion: { nombre_corto: string } | { nombre_corto: string }[] | null
                responsable: { nombre: string; user_id: string } | { nombre: string; user_id: string }[] | null
            }
            setTareas((tareasData as TareaSupabaseRow[] | null)?.map((t) => ({
                ...t,
                cliente: Array.isArray(t.cliente) ? t.cliente[0] : t.cliente,
                contribuyente: Array.isArray(t.contribuyente) ? t.contribuyente[0] : t.contribuyente,
                obligacion: Array.isArray(t.obligacion) ? t.obligacion[0] : t.obligacion,
                responsable: Array.isArray(t.responsable) ? t.responsable[0] : t.responsable,
            })) || [])
            setEventos(eventosData || [])
            setEquipos(equiposData || [])
            setLoading(false)
        }

        fetchData()
    }, [rangoFechas, supabase])

    // Mapear estado de tarea a estado para visualización
    const mapearEstadoTarea = (estado: string): string => {
        if (['presentado', 'pagado', 'cerrado'].includes(estado)) return 'completado'
        if (['en_curso', 'pendiente_evidencia', 'en_validacion'].includes(estado)) return 'en_curso'
        if (estado === 'pendiente') return 'pendiente'
        return 'vencido'
    }

    // Convertir tareas y eventos a ItemCalendario
    const items = useMemo<ItemCalendario[]>(() => {
        const itemsTareas: ItemCalendario[] = (filtroTipo === 'todos' || filtroTipo === 'tareas')
            ? tareas.map(t => ({
                id: `${t.fecha_limite_oficial}_tarea_${t.tarea_id}`,
                tipo: 'tarea' as const,
                titulo: t.obligacion?.nombre_corto || 'Sin nombre',
                subtitulo: t.cliente?.nombre_comercial || t.contribuyente?.rfc || '',
                estado: mapearEstadoTarea(t.estado)
            }))
            : []

        const itemsEventos: ItemCalendario[] = (filtroTipo === 'todos' || filtroTipo === 'eventos')
            ? eventos.map(e => ({
                id: `${e.fecha}_evento_${e.evento_id}`,
                tipo: 'evento' as const,
                titulo: e.titulo,
                subtitulo: e.descripcion,
                hora: e.hora || undefined,
                tipoEvento: e.tipo
            }))
            : []

        return [...itemsTareas, ...itemsEventos]
    }, [tareas, eventos, filtroTipo])

    // Opciones únicas para filtros
    const clientes = useMemo(() => {
        const uniqueClientes = new Set(
            tareas
                .map(t => t.cliente?.nombre_comercial)
                .filter(c => c) as string[]
        )
        return Array.from(uniqueClientes).sort()
    }, [tareas])

    // Navegación de mes/semana
    const navegarAnterior = () => {
        const nueva = new Date(fechaActual)
        if (vista === 'mensual') {
            nueva.setMonth(nueva.getMonth() - 1)
        } else {
            nueva.setDate(nueva.getDate() - 7)
        }
        setFechaActual(nueva)
    }

    const navegarSiguiente = () => {
        const nueva = new Date(fechaActual)
        if (vista === 'mensual') {
            nueva.setMonth(nueva.getMonth() + 1)
        } else {
            nueva.setDate(nueva.getDate() + 7)
        }
        setFechaActual(nueva)
    }

    const irHoy = () => {
        setFechaActual(new Date())
    }

    // Handlers de eventos
    const handleDiaClick = (fecha: Date) => {
        setFechaSeleccionada(fecha)
        setEventoEditar(null)
        setMostrarFormEvento(true)
    }

    const handleItemClick = (item: ItemCalendario) => {
        if (item.tipo === 'evento') {
            const eventoId = item.id.split('_evento_')[1]
            const evento = eventos.find(e => e.evento_id === eventoId)
            if (evento) {
                setEventoEditar(evento)
                setFechaSeleccionada(undefined)
                setMostrarFormEvento(true)
            }
        }
        // Para tareas, podrías abrir un modal de detalle si lo necesitas
    }

    const handleNuevoEvento = () => {
        setEventoEditar(null)
        setFechaSeleccionada(new Date())
        setMostrarFormEvento(true)
    }

    interface EventoFormData {
        evento_id?: string
        titulo: string
        descripcion: string
        fecha: string
        hora?: string | null
        tipo: 'REUNION' | 'RECORDATORIO' | 'OTRO'
        equipo_id?: string | null
    }

    const handleSaveEvento = async (eventoData: EventoFormData) => {
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData?.user?.id

        if (eventoData.evento_id) {
            // Editar
            const { error } = await supabase
                .from('evento_calendario')
                .update({
                    titulo: eventoData.titulo,
                    descripcion: eventoData.descripcion,
                    fecha: eventoData.fecha,
                    hora: eventoData.hora || null,
                    tipo: eventoData.tipo,
                    equipo_id: eventoData.equipo_id || null
                })
                .eq('evento_id', eventoData.evento_id)

            if (error) {
                console.error('Error actualizando evento:', error)
                throw error
            }
        } else {
            // Crear
            const { error } = await supabase
                .from('evento_calendario')
                .insert({
                    titulo: eventoData.titulo,
                    descripcion: eventoData.descripcion,
                    fecha: eventoData.fecha,
                    hora: eventoData.hora || null,
                    tipo: eventoData.tipo,
                    equipo_id: eventoData.equipo_id || null,
                    usuario_id: userId,
                    activo: true
                })

            if (error) {
                console.error('Error creando evento:', error)
                throw error
            }
        }

        // Recargar eventos
        const { inicio, fin } = rangoFechas
        const formatLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const { data: eventosData } = await supabase
            .from('evento_calendario')
            .select('*')
            .gte('fecha', formatLocal(inicio))
            .lte('fecha', formatLocal(fin))
            .eq('activo', true)
            .order('fecha')

        setEventos(eventosData || [])
    }

    const handleDeleteEvento = async (eventoId: string) => {
        const { error } = await supabase
            .from('evento_calendario')
            .update({ activo: false })
            .eq('evento_id', eventoId)

        if (error) {
            console.error('Error eliminando evento:', error)
            throw error
        }

        // Recargar eventos
        const { inicio, fin } = rangoFechas
        const formatLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const { data: eventosData } = await supabase
            .from('evento_calendario')
            .select('*')
            .gte('fecha', formatLocal(inicio))
            .lte('fecha', formatLocal(fin))
            .eq('activo', true)
            .order('fecha')

        setEventos(eventosData || [])
    }

    // Formatear nombre del mes/semana
    const nombrePeriodo = useMemo(() => {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        if (vista === 'mensual') {
            return `${meses[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`
        } else {
            const { inicio, fin } = rangoFechas
            return `${inicio.getDate()} - ${fin.getDate()} ${meses[inicio.getMonth()]} ${inicio.getFullYear()}`
        }
    }, [vista, fechaActual, rangoFechas])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Calendario</h1>
                            <p className="text-slate-700">Agenda fiscal y fechas límite</p>
                        </div>
                    </div>
                    <button
                        onClick={handleNuevoEvento}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        <Plus size={20} />
                        Nuevo Evento
                    </button>
                </div>
            </div>

            {/* Controles */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    {/* Navegación */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={navegarAnterior}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={irHoy}
                            className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            Hoy
                        </button>
                        <button
                            onClick={navegarSiguiente}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                        <h2 className="text-lg font-bold text-slate-800 ml-2">
                            {nombrePeriodo}
                        </h2>
                    </div>

                    {/* Filtros */}
                    <div className="flex gap-3 flex-wrap">
                        {/* Filtro Tipo */}
                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
                            className="bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="todos">Todos</option>
                            <option value="tareas">Solo Tareas</option>
                            <option value="eventos">Solo Eventos</option>
                        </select>

                        {/* Filtro Cliente */}
                        <select
                            value={filtroCliente}
                            onChange={(e) => setFiltroCliente(e.target.value)}
                            className="bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="all">Todos los Clientes</option>
                            {clientes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        {/* Filtro Tribu */}
                        <select
                            value={filtroTribu}
                            onChange={(e) => setFiltroTribu(e.target.value)}
                            className="bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="all">Todas las Tribus</option>
                            {equipos.map(e => <option key={e.team_id} value={e.team_id}>{e.nombre}</option>)}
                        </select>
                    </div>

                    {/* Toggle Vista */}
                    <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setVista('mensual')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${vista === 'mensual'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            <CalendarDays size={16} />
                            Mensual
                        </button>
                        <button
                            onClick={() => setVista('semanal')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${vista === 'semanal'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            <CalendarRange size={16} />
                            Semanal
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendario */}
            {loading ? (
                <div className="bg-white rounded-xl p-20 text-center border border-slate-200">
                    <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-700 font-medium">Cargando calendario...</p>
                </div>
            ) : vista === 'mensual' ? (
                <CalendarioMensual
                    fechaActual={fechaActual}
                    items={items}
                    onDiaClick={handleDiaClick}
                    onItemClick={handleItemClick}
                />
            ) : (
                <CalendarioSemanal
                    fechaActual={fechaActual}
                    items={items}
                    onDiaClick={handleDiaClick}
                    onItemClick={handleItemClick}
                />
            )}

            {/* Modal de Evento */}
            {mostrarFormEvento && (
                <EventoForm
                    evento={eventoEditar}
                    fechaSeleccionada={fechaSeleccionada}
                    equipos={equipos}
                    onSave={handleSaveEvento}
                    onDelete={handleDeleteEvento}
                    onClose={() => {
                        setMostrarFormEvento(false)
                        setEventoEditar(null)
                        setFechaSeleccionada(undefined)
                    }}
                />
            )}
        </div>
    )
}
