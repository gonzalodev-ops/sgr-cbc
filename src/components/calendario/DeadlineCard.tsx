import { Clock, Users, FileText } from 'lucide-react'

interface DeadlineCardProps {
    tipo: 'tarea' | 'evento'
    titulo: string
    subtitulo?: string
    hora?: string
    estado?: string
    tipoEvento?: 'REUNION' | 'RECORDATORIO' | 'OTRO'
    onClick?: () => void
}

const COLORES = {
    // Tareas por estado
    completado: 'bg-green-100 border-green-300 text-green-800',
    en_curso: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    vencido: 'bg-red-100 border-red-300 text-red-800',
    pendiente: 'bg-slate-100 border-slate-300 text-slate-800',
    // Eventos por tipo
    REUNION: 'bg-blue-100 border-blue-300 text-blue-800',
    RECORDATORIO: 'bg-purple-100 border-purple-300 text-purple-800',
    OTRO: 'bg-orange-100 border-orange-300 text-orange-800',
}

export default function DeadlineCard({
    tipo,
    titulo,
    subtitulo,
    hora,
    estado,
    tipoEvento,
    onClick
}: DeadlineCardProps) {
    // Determinar color
    let colorClass = 'bg-slate-100 border-slate-300 text-slate-800'

    if (tipo === 'tarea' && estado) {
        colorClass = COLORES[estado as keyof typeof COLORES] || colorClass
    } else if (tipo === 'evento' && tipoEvento) {
        colorClass = COLORES[tipoEvento] || colorClass
    }

    // Icono según tipo
    const Icon = tipo === 'tarea' ? FileText : tipo === 'evento' && tipoEvento === 'REUNION' ? Users : Clock

    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-2 py-1.5 rounded border-l-4 text-xs ${colorClass} hover:shadow transition-all`}
        >
            <div className="flex items-start gap-1.5">
                <Icon size={12} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{titulo}</p>
                    {subtitulo && (
                        <p className="text-[10px] opacity-75 truncate">{subtitulo}</p>
                    )}
                    {hora && (
                        <p className="text-[10px] opacity-75 mt-0.5">{hora}</p>
                    )}
                </div>
            </div>
        </button>
    )
}
