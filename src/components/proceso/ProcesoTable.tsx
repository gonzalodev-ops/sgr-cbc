'use client'

import { EstadoTarea } from '@/lib/types/database'
import { Calendar, Building2, FileText, User } from 'lucide-react'

export interface TareaProcesoData {
    tarea_id: string
    periodo_fiscal: string
    ejercicio: number
    estado: EstadoTarea
    fecha_limite_oficial: string
    cliente_nombre: string
    contribuyente_rfc: string
    obligacion_nombre: string
    responsable_nombre: string
}

interface ProcesoTableProps {
    tareas: TareaProcesoData[]
    loading?: boolean
}

const ESTADO_COLORS: Record<EstadoTarea, { bg: string; text: string; label: string }> = {
    pendiente: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Pendiente' },
    en_curso: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En Curso' },
    pendiente_evidencia: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pend. Evidencia' },
    en_validacion: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'En Validación' },
    bloqueado_cliente: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Bloqueado' },
    presentado: { bg: 'bg-green-100', text: 'text-green-700', label: 'Presentado' },
    pagado: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Pagado' },
    cerrado: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Cerrado' },
    rechazado: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rechazado' }
}

function formatFecha(fecha: string): string {
    const date = new Date(fecha)
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isOverdue(fecha: string, estado: EstadoTarea): boolean {
    const estadosCompletados: EstadoTarea[] = ['presentado', 'pagado', 'cerrado']
    if (estadosCompletados.includes(estado)) return false

    const limite = new Date(fecha)
    const hoy = new Date()
    return hoy > limite
}

export function ProcesoTable({ tareas, loading }: ProcesoTableProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Cargando tareas...</p>
                </div>
            </div>
        )
    }

    if (tareas.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 border-dashed overflow-hidden">
                <div className="flex flex-col items-center justify-center p-16 gap-4">
                    <FileText className="text-slate-300" size={48} />
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-slate-700 mb-1">
                            No hay tareas
                        </h3>
                        <p className="text-slate-500 text-sm">
                            Selecciona un proceso para ver sus tareas
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-800 text-slate-200 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 w-1/6">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    Periodo
                                </div>
                            </th>
                            <th className="p-4 w-2/6">
                                <div className="flex items-center gap-2">
                                    <Building2 size={14} />
                                    Cliente / RFC
                                </div>
                            </th>
                            <th className="p-4 w-2/6">
                                <div className="flex items-center gap-2">
                                    <FileText size={14} />
                                    Obligación
                                </div>
                            </th>
                            <th className="p-4 w-1/6">
                                <div className="flex items-center gap-2">
                                    <User size={14} />
                                    Responsable
                                </div>
                            </th>
                            <th className="p-4 w-1/6 text-center">Estado</th>
                            <th className="p-4 w-1/6 text-center">Límite</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {tareas.map(tarea => {
                            const estadoConfig = ESTADO_COLORS[tarea.estado]
                            const overdue = isOverdue(tarea.fecha_limite_oficial, tarea.estado)

                            return (
                                <tr key={tarea.tarea_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-slate-700">
                                            {tarea.periodo_fiscal}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {tarea.ejercicio}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-semibold text-slate-800">
                                            {tarea.cliente_nombre}
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono">
                                            {tarea.contribuyente_rfc}
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        {tarea.obligacion_nombre}
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs border border-slate-200 font-medium">
                                            {tarea.responsable_nombre || 'Sin asignar'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold border ${estadoConfig.bg} ${estadoConfig.text} border-current/20`}>
                                            {estadoConfig.label}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className={`text-xs font-medium ${overdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                            {formatFecha(tarea.fecha_limite_oficial)}
                                        </div>
                                        {overdue && (
                                            <div className="text-[10px] text-red-500 uppercase font-bold mt-0.5">
                                                Vencida
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer con contador */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 font-medium">
                    Mostrando <span className="font-bold text-slate-700">{tareas.length}</span> {tareas.length === 1 ? 'tarea' : 'tareas'}
                </p>
            </div>
        </div>
    )
}
