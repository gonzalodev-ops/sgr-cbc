'use client'

import { AlertTriangle, Clock, XCircle, Users, DollarSign } from 'lucide-react'

interface TareaAlerta {
    tarea_id: string
    cliente: string
    entregable: string
    fecha_limite: string
    responsable: string
    diasRestantes?: number
}

interface TareaRiesgoFaltaPago {
    tarea_id: string
    cliente: string
    rfc: string
    obligacion: string
    dias_sin_pago: number
}

interface ColaboradorSobrecarga {
    nombre: string
    tareasActivas: number
}

interface AlertasRiesgoProps {
    tareasPorVencer: TareaAlerta[]
    tareasVencidas: TareaAlerta[]
    colaboradoresSobrecargados: ColaboradorSobrecarga[]
    tareasEnRiesgoFaltaPago?: TareaRiesgoFaltaPago[]
}

export function AlertasRiesgo({
    tareasPorVencer,
    tareasVencidas,
    colaboradoresSobrecargados,
    tareasEnRiesgoFaltaPago = []
}: AlertasRiesgoProps) {
    const hayAlertas = tareasPorVencer.length > 0 || tareasVencidas.length > 0 || colaboradoresSobrecargados.length > 0 || tareasEnRiesgoFaltaPago.length > 0

    if (!hayAlertas) {
        return (
            <div className="bg-green-50 rounded-xl p-8 text-center border border-green-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <AlertTriangle className="text-green-600" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Sin Alertas Críticas</h3>
                <p className="text-green-600">Todo está bajo control en este momento</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Tareas Vencidas */}
            {tareasVencidas.length > 0 && (
                <div className="bg-red-50 rounded-xl border border-red-200 overflow-hidden">
                    <div className="bg-red-100 px-4 py-3 border-b border-red-200">
                        <h3 className="font-semibold text-red-800 flex items-center gap-2">
                            <XCircle size={18} />
                            Tareas Vencidas ({tareasVencidas.length})
                        </h3>
                    </div>
                    <div className="p-4">
                        <div className="space-y-2">
                            {tareasVencidas.slice(0, 5).map((tarea) => (
                                <div
                                    key={tarea.tarea_id}
                                    className="bg-white rounded-lg p-3 border border-red-200 flex justify-between items-center"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800">{tarea.cliente}</p>
                                        <p className="text-sm text-slate-600">{tarea.entregable}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">{tarea.responsable}</p>
                                        <p className="text-xs font-medium text-red-600">
                                            Vencida: {new Date(tarea.fecha_limite).toLocaleDateString('es-MX')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {tareasVencidas.length > 5 && (
                            <p className="text-xs text-red-600 mt-2 text-center">
                                + {tareasVencidas.length - 5} tareas más vencidas
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Tareas en Riesgo por Falta de Pago */}
            {tareasEnRiesgoFaltaPago.length > 0 && (
                <div className="bg-orange-50 rounded-xl border border-orange-200 overflow-hidden">
                    <div className="bg-orange-100 px-4 py-3 border-b border-orange-200">
                        <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                            <DollarSign size={18} />
                            Tareas en Riesgo por Falta de Pago ({tareasEnRiesgoFaltaPago.length})
                        </h3>
                    </div>
                    <div className="p-4">
                        <div className="space-y-2">
                            {tareasEnRiesgoFaltaPago.slice(0, 5).map((tarea) => (
                                <div
                                    key={tarea.tarea_id}
                                    className="bg-white rounded-lg p-3 border border-orange-200 flex justify-between items-center"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800">{tarea.cliente}</p>
                                        <p className="text-sm text-slate-600">{tarea.obligacion}</p>
                                        <p className="text-xs text-slate-500">RFC: {tarea.rfc}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">
                                            {tarea.dias_sin_pago} dias sin pago
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {tareasEnRiesgoFaltaPago.length > 5 && (
                            <p className="text-xs text-orange-600 mt-2 text-center">
                                + {tareasEnRiesgoFaltaPago.length - 5} tareas mas en riesgo por falta de pago
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Tareas Proximas a Vencer */}
            {tareasPorVencer.length > 0 && (
                <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
                    <div className="bg-amber-100 px-4 py-3 border-b border-amber-200">
                        <h3 className="font-semibold text-amber-800 flex items-center gap-2">
                            <Clock size={18} />
                            Proximas a Vencer - Menos de 3 Dias ({tareasPorVencer.length})
                        </h3>
                    </div>
                    <div className="p-4">
                        <div className="space-y-2">
                            {tareasPorVencer.slice(0, 5).map((tarea) => (
                                <div
                                    key={tarea.tarea_id}
                                    className="bg-white rounded-lg p-3 border border-amber-200 flex justify-between items-center"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800">{tarea.cliente}</p>
                                        <p className="text-sm text-slate-600">{tarea.entregable}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">{tarea.responsable}</p>
                                        <p className="text-xs font-medium text-amber-600">
                                            {tarea.diasRestantes === 0 ? 'Hoy' :
                                                tarea.diasRestantes === 1 ? 'Mañana' :
                                                    `${tarea.diasRestantes} días`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {tareasPorVencer.length > 5 && (
                            <p className="text-xs text-amber-600 mt-2 text-center">
                                + {tareasPorVencer.length - 5} tareas más por vencer pronto
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Colaboradores Sobrecargados */}
            {colaboradoresSobrecargados.length > 0 && (
                <div className="bg-blue-50 rounded-xl border border-blue-200 overflow-hidden">
                    <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
                        <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                            <Users size={18} />
                            Colaboradores con Sobrecarga ({colaboradoresSobrecargados.length})
                        </h3>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {colaboradoresSobrecargados.map((colab, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-lg p-3 border border-blue-200 flex justify-between items-center"
                                >
                                    <p className="font-medium text-slate-800">{colab.nombre}</p>
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                        {colab.tareasActivas} tareas activas
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
