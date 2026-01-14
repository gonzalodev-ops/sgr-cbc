'use client'

import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp, FileCheck } from 'lucide-react'
import ObligacionesMatrix from './ObligacionesMatrix'

interface Entregable {
    entregable_id: string
    nombre: string
    descripcion?: string
    tipo: 'OBLIGACION' | 'OPERATIVO' | 'OTRO'
    activo: boolean
    entregable_obligacion?: Array<{
        id_obligacion: string
        peso_relativo?: number
    }>
}

interface EntregableListProps {
    entregables: Entregable[]
    searchTerm: string
    onEdit: (entregable: Entregable) => void
    onDelete: (id: string) => Promise<void>
    onObligacionUpdate: () => void
}

const TIPO_COLORS = {
    OBLIGACION: 'bg-green-100 text-green-800 border-green-300',
    OPERATIVO: 'bg-blue-100 text-blue-800 border-blue-300',
    OTRO: 'bg-slate-100 text-slate-800 border-slate-300',
}

export default function EntregableList({
    entregables,
    searchTerm,
    onEdit,
    onDelete,
    onObligacionUpdate
}: EntregableListProps) {
    const [expanded, setExpanded] = useState<string | null>(null)

    const filteredEntregables = entregables.filter(e =>
        e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.entregable_id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleDelete = async (id: string, nombre: string) => {
        if (confirm(`¿Eliminar el entregable "${nombre}"?`)) {
            await onDelete(id)
        }
    }

    return (
        <div className="space-y-3">
            {filteredEntregables.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-slate-400">
                        {searchTerm
                            ? 'No se encontraron entregables con ese criterio'
                            : 'No hay entregables. Crea uno nuevo.'}
                    </p>
                </div>
            ) : (
                filteredEntregables.map(entregable => {
                    const obligacionesCount = entregable.entregable_obligacion?.length || 0
                    const isExpanded = expanded === entregable.entregable_id

                    return (
                        <div
                            key={entregable.entregable_id}
                            className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm"
                        >
                            <div
                                className="flex justify-between items-center p-4 hover:bg-slate-50 cursor-pointer"
                                onClick={() => setExpanded(isExpanded ? null : entregable.entregable_id)}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    <FileCheck size={18} className="text-green-600" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-slate-800">{entregable.nombre}</p>
                                            <span className={`text-xs px-2 py-1 rounded border ${TIPO_COLORS[entregable.tipo]}`}>
                                                {entregable.tipo}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-mono mt-1">
                                            {entregable.entregable_id}
                                        </p>
                                        {entregable.descripcion && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                {entregable.descripcion}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded border border-purple-200">
                                        {obligacionesCount} obligación{obligacionesCount !== 1 ? 'es' : ''}
                                    </span>
                                    <button
                                        onClick={() => onEdit(entregable)}
                                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(entregable.entregable_id, entregable.nombre)}
                                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="bg-slate-50 p-4 border-t border-slate-200">
                                    <ObligacionesMatrix
                                        entregableId={entregable.entregable_id}
                                        vinculadas={entregable.entregable_obligacion || []}
                                        onUpdate={onObligacionUpdate}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })
            )}
        </div>
    )
}
