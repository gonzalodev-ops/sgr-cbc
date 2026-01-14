'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Shield, CheckCircle, XCircle, MessageSquare, Eye, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import HallazgoForm from '@/components/auditor/HallazgoForm'
import HallazgoList from '@/components/auditor/HallazgoList'

// Datos mock para auditorías pendientes
interface Hallazgo {
    id: string
    tipo: string
    gravedad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
    descripcion: string
    genera_retrabajo: boolean
}

interface AuditoriaItem {
    id: number
    rfc: string
    cliente: string
    entregable: string
    responsable: string
    tribu: string
    fechaVobo: string
    estado: 'pendiente' | 'aprobado' | 'rechazado' | 'aprobado_con_observaciones'
    comentarios?: string
    hallazgos?: Hallazgo[]
}

const MOCK_AUDITORIAS: AuditoriaItem[] = [
    { id: 1, rfc: 'XAXX010101ABC', cliente: 'Abarrotes Lupita', entregable: 'Nómina Quincenal', responsable: 'Diego García', tribu: 'Isidora', fechaVobo: '2026-01-07', estado: 'pendiente' },
    { id: 2, rfc: 'XEF020202DEF', cliente: 'Ferretería El Tornillo', entregable: 'Contabilidad Electrónica', responsable: 'Ulises Romo', tribu: 'Isidora', fechaVobo: '2026-01-06', estado: 'pendiente' },
    { id: 3, rfc: 'IND050505MNO', cliente: 'Industrias Querétaro', entregable: 'IMSS Mensual', responsable: 'Pedro Ramírez', tribu: 'Querétaro', fechaVobo: '2026-01-05', estado: 'pendiente' },
]

export default function AuditorPage() {
    const [auditorias, setAuditorias] = useState<AuditoriaItem[]>(MOCK_AUDITORIAS)
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [comentarios, setComentarios] = useState<Record<number, string>>({})
    const [comentariosPositivos, setComentariosPositivos] = useState<Record<number, string>>({})
    const [hallazgos, setHallazgos] = useState<Record<number, Hallazgo[]>>({})
    const [showHallazgoForm, setShowHallazgoForm] = useState<number | null>(null)
    const [expandedCompletadaId, setExpandedCompletadaId] = useState<number | null>(null)

    const handleAprobar = (id: number) => {
        setAuditorias(prev => prev.map(a =>
            a.id === id ? { ...a, estado: 'aprobado' as const, comentarios: comentarios[id] } : a
        ))
        setExpandedId(null)
    }

    const handleAprobarConObservaciones = (id: number) => {
        const hallazgosAuditoria = hallazgos[id] || []
        if (hallazgosAuditoria.length === 0) {
            alert('Debes registrar al menos un hallazgo para aprobar con observaciones')
            return
        }
        setAuditorias(prev => prev.map(a =>
            a.id === id ? {
                ...a,
                estado: 'aprobado_con_observaciones' as const,
                comentarios: comentarios[id],
                hallazgos: hallazgosAuditoria
            } : a
        ))
        setExpandedId(null)
        setShowHallazgoForm(null)
    }

    const handleRechazar = (id: number) => {
        const hallazgosAuditoria = hallazgos[id] || []
        if (hallazgosAuditoria.length === 0) {
            alert('Debes registrar al menos un hallazgo para rechazar la auditoría')
            return
        }
        setAuditorias(prev => prev.map(a =>
            a.id === id ? {
                ...a,
                estado: 'rechazado' as const,
                comentarios: comentarios[id],
                hallazgos: hallazgosAuditoria
            } : a
        ))
        setExpandedId(null)
        setShowHallazgoForm(null)
    }

    const handleSaveHallazgo = (auditoriaId: number, hallazgoData: any) => {
        const nuevoHallazgo: Hallazgo = {
            id: `${auditoriaId}-${Date.now()}`,
            ...hallazgoData
        }
        setHallazgos(prev => ({
            ...prev,
            [auditoriaId]: [...(prev[auditoriaId] || []), nuevoHallazgo]
        }))
        setShowHallazgoForm(null)
    }

    const pendientes = auditorias.filter(a => a.estado === 'pendiente')
    const completadas = auditorias.filter(a => a.estado !== 'pendiente')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-3 rounded-lg">
                        <Shield size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Panel del Auditor</h1>
                        <p className="text-purple-200 mt-1">
                            {pendientes.length} entregables pendientes de revisión
                        </p>
                    </div>
                </div>
            </div>

            {/* Pendientes */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
                    <h2 className="font-semibold text-amber-800 flex items-center gap-2">
                        <Shield size={18} />
                        Pendientes de Auditoría ({pendientes.length})
                    </h2>
                </div>

                {pendientes.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <CheckCircle size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No hay auditorías pendientes</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {pendientes.map(item => (
                            <div key={item.id} className="hover:bg-slate-50 transition-colors">
                                {/* Row principal */}
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer"
                                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                >
                                    <div className="flex-1 grid grid-cols-5 gap-4">
                                        <div>
                                            <p className="font-medium text-slate-800">{item.rfc}</p>
                                            <p className="text-xs text-slate-500">{item.cliente}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-700">{item.entregable}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">{item.responsable}</p>
                                            <p className="text-xs text-slate-400">{item.tribu}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">VoBo: {item.fechaVobo}</p>
                                        </div>
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleAprobar(item.id) }}
                                                className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                                                title="Aprobar"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setExpandedId(item.id) }}
                                                className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                                title="Rechazar"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                            <button className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors" title="Ver detalles">
                                                <Eye size={18} />
                                            </button>
                                            {expandedId === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Panel expandido para comentarios y hallazgos */}
                                {expandedId === item.id && (
                                    <div className="px-4 pb-4 bg-slate-50 border-t border-slate-200">
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    <MessageSquare size={14} className="inline mr-1" />
                                                    Comentarios generales (opcional)
                                                </label>
                                                <textarea
                                                    value={comentarios[item.id] || ''}
                                                    onChange={(e) => setComentarios({ ...comentarios, [item.id]: e.target.value })}
                                                    placeholder="Agrega comentarios generales sobre la auditoría..."
                                                    className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows={3}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    <CheckCircle size={14} className="inline mr-1" />
                                                    Comentarios positivos (opcional)
                                                </label>
                                                <textarea
                                                    value={comentariosPositivos[item.id] || ''}
                                                    onChange={(e) => setComentariosPositivos({ ...comentariosPositivos, [item.id]: e.target.value })}
                                                    placeholder="¿Qué se hizo bien?"
                                                    className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>

                                        {/* Sección de Hallazgos */}
                                        <div className="mt-4 space-y-3">
                                            {/* Botón para agregar hallazgo */}
                                            {showHallazgoForm !== item.id && (
                                                <button
                                                    onClick={() => setShowHallazgoForm(item.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
                                                >
                                                    <AlertTriangle size={16} />
                                                    Registrar Hallazgo
                                                </button>
                                            )}

                                            {/* Formulario de hallazgo */}
                                            {showHallazgoForm === item.id && (
                                                <HallazgoForm
                                                    auditoriaId={item.id.toString()}
                                                    onSave={(hallazgo) => handleSaveHallazgo(item.id, hallazgo)}
                                                    onCancel={() => setShowHallazgoForm(null)}
                                                />
                                            )}

                                            {/* Lista de hallazgos */}
                                            {hallazgos[item.id] && hallazgos[item.id].length > 0 && (
                                                <HallazgoList hallazgos={hallazgos[item.id]} />
                                            )}
                                        </div>

                                        {/* Botones de acción */}
                                        <div className="flex justify-end gap-3 mt-4">
                                            <button
                                                onClick={() => {
                                                    setExpandedId(null)
                                                    setShowHallazgoForm(null)
                                                }}
                                                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => handleAprobar(item.id)}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                            >
                                                <CheckCircle size={16} />
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => handleAprobarConObservaciones(item.id)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                disabled={!hallazgos[item.id] || hallazgos[item.id].length === 0}
                                            >
                                                <AlertTriangle size={16} />
                                                Aprobar con Observaciones
                                            </button>
                                            <button
                                                onClick={() => handleRechazar(item.id)}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                                disabled={!hallazgos[item.id] || hallazgos[item.id].length === 0}
                                            >
                                                <XCircle size={16} />
                                                Rechazar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Completadas */}
            {completadas.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 px-6 py-4 border-b border-slate-200">
                        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                            Auditorías Completadas ({completadas.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {completadas.map(item => (
                            <div key={item.id}>
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 grid grid-cols-4 gap-4">
                                            <div>
                                                <p className="font-medium text-slate-700">{item.rfc}</p>
                                                <p className="text-xs text-slate-500">{item.cliente}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-600">{item.entregable}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">{item.responsable}</p>
                                            </div>
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    item.estado === 'aprobado'
                                                        ? 'bg-green-100 text-green-700'
                                                        : item.estado === 'aprobado_con_observaciones'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {item.estado === 'aprobado'
                                                        ? '✓ Aprobado'
                                                        : item.estado === 'aprobado_con_observaciones'
                                                        ? '✓ Aprobado con Observaciones'
                                                        : '✗ Rechazado'}
                                                </span>
                                                {item.hallazgos && item.hallazgos.length > 0 && (
                                                    <button
                                                        onClick={() => setExpandedCompletadaId(
                                                            expandedCompletadaId === item.id ? null : item.id
                                                        )}
                                                        className="p-1 text-slate-600 hover:text-slate-800"
                                                    >
                                                        {expandedCompletadaId === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detalles expandidos */}
                                {expandedCompletadaId === item.id && item.hallazgos && item.hallazgos.length > 0 && (
                                    <div className="px-4 pb-4 bg-slate-50">
                                        <HallazgoList hallazgos={item.hallazgos} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
