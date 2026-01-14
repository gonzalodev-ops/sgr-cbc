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

interface CalendarioMensualProps {
    fechaActual: Date
    items: ItemCalendario[]
    onDiaClick?: (fecha: Date) => void
    onItemClick?: (item: ItemCalendario) => void
}

export default function CalendarioMensual({
    fechaActual,
    items,
    onDiaClick,
    onItemClick
}: CalendarioMensualProps) {
    // Obtener primer y último día del mes
    const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
    const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0)

    // Calcular día de la semana del primer día (0 = Dom, 1 = Lun, ...)
    // Ajustar para que Lun = 0
    const primerDiaSemana = (primerDiaMes.getDay() + 6) % 7

    // Total de días a mostrar (días vacíos + días del mes)
    const diasMostrar = primerDiaSemana + ultimoDiaMes.getDate()
    const totalCeldas = Math.ceil(diasMostrar / 7) * 7

    // Generar array de días
    const dias: (Date | null)[] = []
    for (let i = 0; i < totalCeldas; i++) {
        if (i < primerDiaSemana || i >= diasMostrar) {
            dias.push(null)
        } else {
            const dia = i - primerDiaSemana + 1
            dias.push(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia))
        }
    }

    // Agrupar items por fecha
    const itemsPorFecha: Record<string, ItemCalendario[]> = {}
    items.forEach(item => {
        // Obtener fecha de los datos del item
        const fechaKey = item.id.split('_')[0] // Asumiendo que el ID tiene formato "YYYY-MM-DD_..."
        if (!itemsPorFecha[fechaKey]) {
            itemsPorFecha[fechaKey] = []
        }
        itemsPorFecha[fechaKey].push(item)
    })

    const formatearFecha = (fecha: Date) => {
        return fecha.toISOString().split('T')[0]
    }

    const esHoy = (fecha: Date) => {
        const hoy = new Date()
        return fecha.getDate() === hoy.getDate() &&
            fecha.getMonth() === hoy.getMonth() &&
            fecha.getFullYear() === hoy.getFullYear()
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 bg-slate-800 text-slate-200">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, i) => (
                    <div
                        key={i}
                        className={`p-3 text-center text-xs font-bold uppercase tracking-wider ${i >= 5 ? 'bg-slate-700' : ''
                            }`}
                    >
                        {dia}
                    </div>
                ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
                {dias.map((fecha, index) => {
                    if (!fecha) {
                        return (
                            <div
                                key={`empty-${index}`}
                                className="min-h-[120px] bg-slate-50"
                            />
                        )
                    }

                    const fechaKey = formatearFecha(fecha)
                    const itemsDia = itemsPorFecha[fechaKey] || []
                    const esFinde = fecha.getDay() === 0 || fecha.getDay() === 6
                    const hoy = esHoy(fecha)

                    return (
                        <div
                            key={fechaKey}
                            onClick={() => onDiaClick?.(fecha)}
                            className={`min-h-[120px] p-2 transition-colors cursor-pointer ${esFinde ? 'bg-slate-50/50' : 'bg-white'
                                } ${hoy ? 'bg-blue-50' : ''} hover:bg-slate-100`}
                        >
                            <div className={`text-sm font-bold mb-2 ${hoy ? 'text-blue-600' : 'text-slate-700'
                                }`}>
                                {fecha.getDate()}
                                {hoy && (
                                    <span className="ml-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">
                                        Hoy
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1">
                                {itemsDia.slice(0, 3).map(item => (
                                    <DeadlineCard
                                        key={item.id}
                                        tipo={item.tipo}
                                        titulo={item.titulo}
                                        subtitulo={item.subtitulo}
                                        hora={item.hora}
                                        estado={item.estado}
                                        tipoEvento={item.tipoEvento}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onItemClick?.(item)
                                        }}
                                    />
                                ))}
                                {itemsDia.length > 3 && (
                                    <div className="text-[10px] text-slate-500 font-medium text-center py-1">
                                        +{itemsDia.length - 3} más
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
