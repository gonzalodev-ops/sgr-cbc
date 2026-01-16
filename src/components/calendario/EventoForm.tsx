import { useState, useEffect } from 'react'
import { X, Save, Trash2 } from 'lucide-react'

interface Evento {
    evento_id?: string
    titulo: string
    descripcion: string
    fecha: string
    hora: string
    tipo: 'REUNION' | 'RECORDATORIO' | 'OTRO'
    equipo_id?: string
}

interface EventoFormProps {
    evento?: Evento | null
    fechaSeleccionada?: Date
    equipos: Array<{ team_id: string; nombre: string }>
    onSave: (evento: Evento) => Promise<void>
    onDelete?: (eventoId: string) => Promise<void>
    onClose: () => void
}

export default function EventoForm({
    evento,
    fechaSeleccionada,
    equipos,
    onSave,
    onDelete,
    onClose
}: EventoFormProps) {
    const [formData, setFormData] = useState<Evento>({
        titulo: '',
        descripcion: '',
        fecha: '',
        hora: '',
        tipo: 'OTRO',
        equipo_id: ''
    })

    const [guardando, setGuardando] = useState(false)
    const [eliminando, setEliminando] = useState(false)

    useEffect(() => {
        if (evento) {
            setFormData(evento)
        } else if (fechaSeleccionada) {
            // Usar métodos locales para evitar desplazamiento por zona horaria
            const year = fechaSeleccionada.getFullYear()
            const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0')
            const day = String(fechaSeleccionada.getDate()).padStart(2, '0')
            setFormData(prev => ({
                ...prev,
                fecha: `${year}-${month}-${day}`
            }))
        }
    }, [evento, fechaSeleccionada])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.titulo || !formData.fecha) return

        setGuardando(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error) {
            console.error('Error guardando evento:', error)
        } finally {
            setGuardando(false)
        }
    }

    const handleDelete = async () => {
        if (!evento?.evento_id) return
        if (!confirm('¿Seguro que deseas eliminar este evento?')) return

        setEliminando(true)
        try {
            await onDelete?.(evento.evento_id)
            onClose()
        } catch (error) {
            console.error('Error eliminando evento:', error)
        } finally {
            setEliminando(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">
                        {evento ? 'Editar Evento' : 'Nuevo Evento'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Título */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={formData.titulo}
                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Reunión con cliente"
                            required
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Detalles del evento..."
                            rows={3}
                        />
                    </div>

                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Fecha *
                            </label>
                            <input
                                type="date"
                                value={formData.fecha}
                                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Hora
                            </label>
                            <input
                                type="time"
                                value={formData.hora}
                                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Tipo */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Tipo
                        </label>
                        <select
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value as Evento['tipo'] })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="REUNION">Reunión</option>
                            <option value="RECORDATORIO">Recordatorio</option>
                            <option value="OTRO">Otro</option>
                        </select>
                    </div>

                    {/* Equipo */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Equipo (Opcional)
                        </label>
                        <select
                            value={formData.equipo_id || ''}
                            onChange={(e) => setFormData({ ...formData, equipo_id: e.target.value || undefined })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Personal</option>
                            {equipos.map(equipo => (
                                <option key={equipo.team_id} value={equipo.team_id}>
                                    {equipo.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                        <div>
                            {evento && onDelete && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={eliminando}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 size={16} />
                                    {eliminando ? 'Eliminando...' : 'Eliminar'}
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={guardando}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Save size={16} />
                                {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
