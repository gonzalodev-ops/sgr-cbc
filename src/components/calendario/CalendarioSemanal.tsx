import DeadlineCard from './DeadlineCard'

interface ItemCalendario {
    id: string
    tipo: 'tarea' | 'evento'
    titulo: string
    subtitulo?: string
    hora?: string
    estado?: string
    tipoEvento?: 'REUNION' | 'RECORDATORIO' | 'OTRO'
}

interface CalendarioSemanalProps {
    fechaActual: Date
    items: ItemCalendario[]
    onDiaClick?: (fecha: Date) => void
    onItemClick?: (item: ItemCalendario) => void
}

export default function CalendarioSemanal({
    fechaActual,
    items,
    onDiaClick,
    onItemClick
}: CalendarioSemanalProps) {
    // Obtener el lunes de la semana actual
    const getLunesDeSemana = (fecha: Date) => {
        const d = new Date(fecha)
        const dia = d.getDay()
        const diff = dia === 0 ? -6 : 1 - dia // Si es domingo, retroceder 6 días
        d.setDate(d.getDate() + diff)
        return d
    }

    const lunesSemana = getLunesDeSemana(fechaActual)

    // Generar array de 7 días (Lun - Dom)
    const dias = Array.from({ length: 7 }, (_, i) => {
        const fecha = new Date(lunesSemana)
        fecha.setDate(lunesSemana.getDate() + i)
        return fecha
    })

    // Agrupar items por fecha
    const itemsPorFecha: Record<string, ItemCalendario[]> = {}
    items.forEach(item => {
        const fechaKey = item.id.split('_')[0] // Asumiendo formato "YYYY-MM-DD_..."
        if (!itemsPorFecha[fechaKey]) {
            itemsPorFecha[fechaKey] = []
        }
        itemsPorFecha[fechaKey].push(item)
    })

    // Formatear fecha usando métodos locales para evitar desplazamiento por zona horaria
    const formatearFecha = (fecha: Date) => {
        const year = fecha.getFullYear()
        const month = String(fecha.getMonth() + 1).padStart(2, '0')
        const day = String(fecha.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const esHoy = (fecha: Date) => {
        const hoy = new Date()
        return fecha.getDate() === hoy.getDate() &&
            fecha.getMonth() === hoy.getMonth() &&
            fecha.getFullYear() === hoy.getFullYear()
    }

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-7 divide-x divide-slate-200">
                {dias.map((fecha, index) => {
                    const fechaKey = formatearFecha(fecha)
                    const itemsDia = itemsPorFecha[fechaKey] || []
                    const esFinde = fecha.getDay() === 0 || fecha.getDay() === 6
                    const hoy = esHoy(fecha)

                    return (
                        <div
                            key={fechaKey}
                            className={`${esFinde ? 'bg-slate-50' : 'bg-white'} ${hoy ? 'bg-blue-50' : ''
                                } transition-colors`}
                        >
                            {/* Cabecera del día */}
                            <div
                                onClick={() => onDiaClick?.(fecha)}
                                className={`p-4 border-b border-slate-200 cursor-pointer transition-colors ${hoy ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'
                                    } hover:opacity-90`}
                            >
                                <div className="text-center">
                                    <div className="text-xs font-bold uppercase tracking-wider">
                                        {diasSemana[index]}
                                    </div>
                                    <div className="text-2xl font-bold mt-1">
                                        {fecha.getDate()}
                                    </div>
                                    <div className="text-xs opacity-75">
                                        {meses[fecha.getMonth()]}
                                    </div>
                                </div>
                            </div>

                            {/* Lista de items */}
                            <div className="p-2 min-h-[400px] space-y-2">
                                {itemsDia.length === 0 ? (
                                    <div className="text-center text-slate-400 text-xs py-8">
                                        Sin eventos
                                    </div>
                                ) : (
                                    itemsDia.map(item => (
                                        <DeadlineCard
                                            key={item.id}
                                            tipo={item.tipo}
                                            titulo={item.titulo}
                                            subtitulo={item.subtitulo}
                                            hora={item.hora}
                                            estado={item.estado}
                                            tipoEvento={item.tipoEvento}
                                            onClick={() => onItemClick?.(item)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
