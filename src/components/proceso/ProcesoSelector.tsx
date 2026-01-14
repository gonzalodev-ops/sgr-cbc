'use client'

import { ChevronDown, Workflow } from 'lucide-react'
import { ProcesoOperativo } from '@/lib/types/database'

interface ProcesoSelectorProps {
    procesos: ProcesoOperativo[]
    selectedProceso: string
    onSelect: (procesoId: string) => void
    loading?: boolean
}

export function ProcesoSelector({ procesos, selectedProceso, onSelect, loading }: ProcesoSelectorProps) {
    const currentProceso = procesos.find(p => p.proceso_id === selectedProceso)

    return (
        <div className="relative">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Proceso Operativo
            </label>
            <div className="relative">
                <select
                    value={selectedProceso}
                    onChange={(e) => onSelect(e.target.value)}
                    disabled={loading}
                    className="w-full bg-white border-2 border-teal-200 text-slate-800 py-3 pl-12 pr-10 rounded-xl text-base font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                >
                    <option value="">Selecciona un proceso...</option>
                    {procesos.map(proceso => (
                        <option key={proceso.proceso_id} value={proceso.proceso_id}>
                            {proceso.nombre}
                        </option>
                    ))}
                </select>

                {/* Icon */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Workflow className="text-teal-600" size={20} />
                </div>

                {/* Dropdown Arrow */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="text-slate-400" size={20} />
                </div>
            </div>

            {/* Badge de categoría */}
            {currentProceso && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200 rounded-lg">
                    <span className="text-xs font-medium text-teal-700">
                        {currentProceso.categoria_default === 'RECURRENTE' ? '🔄 Recurrente' : '⚡ Extraordinario'}
                    </span>
                </div>
            )}
        </div>
    )
}
