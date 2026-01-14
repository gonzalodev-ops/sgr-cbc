'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Obligacion {
    id_obligacion: string
    nombre_corto: string
}

interface EntregableObligacion {
    id_obligacion: string
    peso_relativo?: number
}

interface ObligacionesMatrixProps {
    entregableId: string
    vinculadas: EntregableObligacion[]
    onUpdate: () => void
}

export default function ObligacionesMatrix({ entregableId, vinculadas, onUpdate }: ObligacionesMatrixProps) {
    const [obligaciones, setObligaciones] = useState<Obligacion[]>([])
    const [loading, setLoading] = useState(true)
    const [pesos, setPesos] = useState<Record<string, number>>({})

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        loadObligaciones()
    }, [])

    useEffect(() => {
        const pesosMap: Record<string, number> = {}
        vinculadas.forEach(v => {
            if (v.peso_relativo) {
                pesosMap[v.id_obligacion] = v.peso_relativo
            }
        })
        setPesos(pesosMap)
    }, [vinculadas])

    async function loadObligaciones() {
        setLoading(true)
        const { data } = await supabase
            .from('obligacion_fiscal')
            .select('id_obligacion, nombre_corto')
            .eq('activo', true)
            .order('nombre_corto')
        setObligaciones(data || [])
        setLoading(false)
    }

    async function toggleObligacion(idObligacion: string, isActive: boolean) {
        if (isActive) {
            await supabase
                .from('entregable_obligacion')
                .delete()
                .eq('entregable_id', entregableId)
                .eq('id_obligacion', idObligacion)
        } else {
            await supabase
                .from('entregable_obligacion')
                .insert({
                    entregable_id: entregableId,
                    id_obligacion: idObligacion,
                    peso_relativo: null
                })
        }
        onUpdate()
    }

    async function updatePeso(idObligacion: string, peso: number | null) {
        await supabase
            .from('entregable_obligacion')
            .update({ peso_relativo: peso })
            .eq('entregable_id', entregableId)
            .eq('id_obligacion', idObligacion)
        onUpdate()
    }

    function isVinculada(idObligacion: string): boolean {
        return vinculadas.some(v => v.id_obligacion === idObligacion)
    }

    if (loading) {
        return <div className="text-sm text-slate-500 py-4">Cargando obligaciones...</div>
    }

    if (obligaciones.length === 0) {
        return (
            <div className="text-sm text-slate-400 py-4">
                No hay obligaciones fiscales configuradas. Ve a Configuración para agregar obligaciones.
            </div>
        )
    }

    return (
        <div className="bg-white p-4 rounded border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase mb-3">
                Obligaciones Fiscales Vinculadas
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {obligaciones.map(obl => {
                    const isActive = isVinculada(obl.id_obligacion)
                    return (
                        <div
                            key={obl.id_obligacion}
                            className={`flex items-center justify-between p-2 rounded border ${
                                isActive
                                    ? 'bg-purple-50 border-purple-200'
                                    : 'bg-slate-50 border-slate-200'
                            }`}
                        >
                            <div className="flex items-center gap-2 flex-1">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={() => toggleObligacion(obl.id_obligacion, isActive)}
                                    className="w-4 h-4 rounded"
                                />
                                <span className={`text-sm ${isActive ? 'font-medium text-slate-800' : 'text-slate-500'}`}>
                                    {obl.nombre_corto}
                                </span>
                            </div>
                            {isActive && (
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-slate-500">Peso:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={pesos[obl.id_obligacion] || ''}
                                        onChange={e => {
                                            const value = e.target.value ? parseFloat(e.target.value) : null
                                            setPesos({ ...pesos, [obl.id_obligacion]: value || 0 })
                                        }}
                                        onBlur={e => {
                                            const value = e.target.value ? parseFloat(e.target.value) : null
                                            updatePeso(obl.id_obligacion, value)
                                        }}
                                        placeholder="0.0"
                                        className="w-20 px-2 py-1 border rounded text-xs text-right"
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
