'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Calendar, Plus, Trash2, Upload, X, Save, ChevronLeft, ChevronRight } from 'lucide-react'

interface DiaInhabil {
    dia_inhabil_id: string
    fecha: string
    descripcion: string
    tipo: 'FERIADO' | 'PUENTE' | 'ESPECIAL'
    anio: number
    activo: boolean
}

const FERIADOS_SAT = [
    { fecha: '01-01', descripcion: 'Año Nuevo' },
    { fecha: '02-05', descripcion: 'Día de la Constitución' },
    { fecha: '03-21', descripcion: 'Natalicio de Benito Juárez' },
    { fecha: '05-01', descripcion: 'Día del Trabajo' },
    { fecha: '09-16', descripcion: 'Día de la Independencia' },
    { fecha: '11-20', descripcion: 'Revolución Mexicana' },
    { fecha: '12-25', descripcion: 'Navidad' }
]

const TIPOS_COLOR = {
    FERIADO: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    PUENTE: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    ESPECIAL: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' }
}

export default function DiasInhabiles() {
    const currentYear = new Date().getFullYear()
    const [anioSeleccionado, setAnioSeleccionado] = useState(currentYear)
    const [diasInhabiles, setDiasInhabiles] = useState<DiaInhabil[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<DiaInhabil | null>(null)
    const [form, setForm] = useState({ fecha: '', descripcion: '', tipo: 'FERIADO' as const })

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => { loadData() }, [anioSeleccionado])

    async function loadData() {
        setLoading(true)
        const { data } = await supabase
            .from('dia_inhabil')
            .select('*')
            .eq('activo', true)
            .eq('anio', anioSeleccionado)
            .order('fecha')
        setDiasInhabiles(data || [])
        setLoading(false)
    }

    async function saveDia() {
        if (!form.fecha || !form.descripcion) {
            return alert('Fecha y descripción son requeridas')
        }

        const anio = new Date(form.fecha).getFullYear()
        const data = { ...form, anio, activo: true }

        if (editing) {
            await supabase
                .from('dia_inhabil')
                .update(data)
                .eq('dia_inhabil_id', editing.dia_inhabil_id)
        } else {
            const { error } = await supabase.from('dia_inhabil').insert(data)
            if (error) {
                if (error.code === '23505') { // Unique violation
                    return alert('Esta fecha ya existe en el catálogo')
                }
                return alert('Error al guardar: ' + error.message)
            }
        }
        resetForm()
        loadData()
    }

    async function deleteDia(id: string) {
        if (!confirm('¿Eliminar este día inhábil?')) return
        await supabase.from('dia_inhabil').update({ activo: false }).eq('dia_inhabil_id', id)
        loadData()
    }

    async function cargarFeriadosSAT() {
        if (!confirm(`¿Cargar ${FERIADOS_SAT.length} feriados oficiales del SAT para el año ${anioSeleccionado}?`)) return

        const diasAInsertar = FERIADOS_SAT.map(f => ({
            fecha: `${anioSeleccionado}-${f.fecha}`,
            descripcion: f.descripcion,
            tipo: 'FERIADO',
            anio: anioSeleccionado,
            activo: true
        }))

        let insertados = 0
        let duplicados = 0

        for (const dia of diasAInsertar) {
            const { error } = await supabase.from('dia_inhabil').insert(dia)
            if (error) {
                if (error.code === '23505') duplicados++
            } else {
                insertados++
            }
        }

        alert(`Carga completada:\n${insertados} días agregados\n${duplicados} ya existían`)
        loadData()
    }

    function resetForm() {
        setForm({ fecha: '', descripcion: '', tipo: 'FERIADO' })
        setEditing(null)
        setShowForm(false)
    }

    function editDia(dia: DiaInhabil) {
        setForm({ fecha: dia.fecha, descripcion: dia.descripcion, tipo: dia.tipo })
        setEditing(dia)
        setShowForm(true)
    }

    function cambiarAnio(delta: number) {
        setAnioSeleccionado(prev => prev + delta)
    }

    if (loading) return <div className="text-center py-8 text-slate-500">Cargando...</div>

    return (
        <div className="space-y-4">
            {/* Header con selector de año */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">Días Inhábiles</h2>
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-1">
                        <button
                            onClick={() => cambiarAnio(-1)}
                            className="p-1 hover:bg-white rounded transition-colors"
                            title="Año anterior"
                        >
                            <ChevronLeft size={18} className="text-slate-600" />
                        </button>
                        <span className="px-3 py-1 font-semibold text-slate-700 min-w-[80px] text-center">
                            {anioSeleccionado}
                        </span>
                        <button
                            onClick={() => cambiarAnio(1)}
                            className="p-1 hover:bg-white rounded transition-colors"
                            title="Año siguiente"
                        >
                            <ChevronRight size={18} className="text-slate-600" />
                        </button>
                    </div>
                    <span className="text-sm text-slate-500">
                        {diasInhabiles.length} días registrados
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={cargarFeriadosSAT}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Upload size={18} />
                        Cargar Feriados SAT
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowForm(true) }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <Plus size={18} />
                        Nuevo Día
                    </button>
                </div>
            </div>

            {/* Formulario */}
            {showForm && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-emerald-800">
                            {editing ? 'Editar' : 'Nuevo'} Día Inhábil
                        </h3>
                        <button onClick={resetForm}>
                            <X size={20} className="text-slate-400 hover:text-slate-600" />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <input
                            type="date"
                            value={form.fecha}
                            onChange={e => setForm({ ...form, fecha: e.target.value })}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Descripción *"
                            value={form.descripcion}
                            onChange={e => setForm({ ...form, descripcion: e.target.value })}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            required
                        />
                        <select
                            value={form.tipo}
                            onChange={e => setForm({ ...form, tipo: e.target.value as 'FERIADO' | 'PUENTE' | 'ESPECIAL' })}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="FERIADO">Feriado</option>
                            <option value="PUENTE">Puente</option>
                            <option value="ESPECIAL">Especial</option>
                        </select>
                    </div>
                    <button
                        onClick={saveDia}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <Save size={18} />
                        Guardar
                    </button>
                </div>
            )}

            {/* Lista de días inhábiles */}
            <div className="space-y-2">
                {diasInhabiles.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                        <Calendar size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">
                            No hay días inhábiles registrados para {anioSeleccionado}
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                            Agrega días manualmente o carga los feriados oficiales del SAT
                        </p>
                    </div>
                ) : (
                    diasInhabiles.map(dia => {
                        const color = TIPOS_COLOR[dia.tipo]
                        const fecha = new Date(dia.fecha + 'T00:00:00')
                        const fechaFormateada = fecha.toLocaleDateString('es-MX', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })

                        return (
                            <div
                                key={dia.dia_inhabil_id}
                                className={`flex justify-between items-center p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow ${color.border}`}
                            >
                                <div className="flex items-center gap-4">
                                    <Calendar size={20} className={color.text} />
                                    <div>
                                        <p className="font-medium text-slate-800">{dia.descripcion}</p>
                                        <p className="text-sm text-slate-500 capitalize">{fechaFormateada}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${color.bg} ${color.text}`}>
                                        {dia.tipo}
                                    </span>
                                    <button
                                        onClick={() => editDia(dia)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Editar"
                                    >
                                        <Save size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteDia(dia.dia_inhabil_id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Resumen por tipo */}
            {diasInhabiles.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-3">Resumen</p>
                    <div className="grid grid-cols-3 gap-3">
                        {(['FERIADO', 'PUENTE', 'ESPECIAL'] as const).map(tipo => {
                            const count = diasInhabiles.filter(d => d.tipo === tipo).length
                            const color = TIPOS_COLOR[tipo]
                            return (
                                <div key={tipo} className={`p-3 rounded-lg border ${color.bg} ${color.border}`}>
                                    <p className={`text-xs font-medium ${color.text}`}>{tipo}</p>
                                    <p className={`text-2xl font-bold ${color.text}`}>{count}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
