'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Pencil, Trash2, X, Save, Settings, ChevronDown, ChevronUp, GripVertical, AlertTriangle, CheckCircle } from 'lucide-react'

interface Proceso {
    proceso_id: string
    nombre: string
    categoria_default: string
    activo: boolean
}

interface Paso {
    proceso_id: string
    paso_id: string
    nombre: string
    orden: number
    peso_pct: number
    tipo_colaborador?: string
    grupo_concurrencia?: number
    evidencia_requerida: boolean
    tipo_evidencia_sugerida?: string
}

const TIPOS_COLABORADOR = [
    { value: 'LIDER', label: 'Líder' },
    { value: 'A', label: 'Aux A' },
    { value: 'B', label: 'Aux B' },
    { value: 'C', label: 'Aux C' }
]

export default function TabProcesos() {
    const [procesos, setProcesos] = useState<Proceso[]>([])
    const [pasos, setPasos] = useState<Record<string, Paso[]>>({})
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)
    const [showProcesoForm, setShowProcesoForm] = useState(false)
    const [showPasoForm, setShowPasoForm] = useState<string | null>(null)
    const [editing, setEditing] = useState<Proceso | null>(null)
    const [editingPaso, setEditingPaso] = useState<Paso | null>(null)

    const [procesoForm, setProcesoForm] = useState({ proceso_id: '', nombre: '', categoria_default: 'RECURRENTE' })
    const [pasoForm, setPasoForm] = useState({ paso_id: '', nombre: '', orden: 1, peso_pct: 0, tipo_colaborador: '', evidencia_requerida: false, tipo_evidencia_sugerida: '' })

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => { loadData() }, [])

    async function loadData() {
        setLoading(true)
        const { data: procData } = await supabase.from('proceso_operativo').select('*').eq('activo', true).order('nombre')
        setProcesos(procData || [])

        const { data: pasosData } = await supabase.from('proceso_paso').select('*').eq('activo', true).order('orden')
        const map: Record<string, Paso[]> = {}
        pasosData?.forEach((p: Paso) => {
            if (!map[p.proceso_id]) map[p.proceso_id] = []
            map[p.proceso_id].push(p)
        })
        setPasos(map)
        setLoading(false)
    }

    async function saveProceso() {
        if (!procesoForm.proceso_id || !procesoForm.nombre) return alert('ID y Nombre requeridos')
        if (editing) {
            await supabase.from('proceso_operativo').update({ nombre: procesoForm.nombre, categoria_default: procesoForm.categoria_default }).eq('proceso_id', editing.proceso_id)
        } else {
            await supabase.from('proceso_operativo').insert({ ...procesoForm, activo: true })
        }
        resetProcesoForm()
        loadData()
    }

    async function deleteProceso(id: string) {
        if (!confirm('¿Eliminar proceso y todos sus pasos?')) return
        await supabase.from('proceso_operativo').update({ activo: false }).eq('proceso_id', id)
        loadData()
    }

    async function savePaso(procesoId: string) {
        if (!pasoForm.paso_id || !pasoForm.nombre) return alert('ID y Nombre requeridos')
        if (pasoForm.peso_pct < 0 || pasoForm.peso_pct > 100) return alert('Peso debe ser entre 0 y 100')

        const data = { ...pasoForm, proceso_id: procesoId, activo: true }
        if (editingPaso) {
            await supabase.from('proceso_paso').update(data).eq('proceso_id', procesoId).eq('paso_id', editingPaso.paso_id)
        } else {
            await supabase.from('proceso_paso').insert(data)
        }
        resetPasoForm()
        loadData()
    }

    async function deletePaso(procesoId: string, pasoId: string) {
        if (!confirm('¿Eliminar paso?')) return
        await supabase.from('proceso_paso').update({ activo: false }).eq('proceso_id', procesoId).eq('paso_id', pasoId)
        loadData()
    }

    function resetProcesoForm() {
        setProcesoForm({ proceso_id: '', nombre: '', categoria_default: 'RECURRENTE' })
        setEditing(null)
        setShowProcesoForm(false)
    }

    function resetPasoForm() {
        setPasoForm({ paso_id: '', nombre: '', orden: 1, peso_pct: 0, tipo_colaborador: '', evidencia_requerida: false, tipo_evidencia_sugerida: '' })
        setEditingPaso(null)
        setShowPasoForm(null)
    }

    function editProceso(p: Proceso) {
        setProcesoForm({ proceso_id: p.proceso_id, nombre: p.nombre, categoria_default: p.categoria_default })
        setEditing(p)
        setShowProcesoForm(true)
    }

    function editPaso(p: Paso) {
        setPasoForm({ paso_id: p.paso_id, nombre: p.nombre, orden: p.orden, peso_pct: p.peso_pct, tipo_colaborador: p.tipo_colaborador || '', evidencia_requerida: p.evidencia_requerida, tipo_evidencia_sugerida: p.tipo_evidencia_sugerida || '' })
        setEditingPaso(p)
        setShowPasoForm(p.proceso_id)
    }

    function addPaso(procesoId: string) {
        const existingPasos = pasos[procesoId] || []
        const nextOrden = existingPasos.length > 0 ? Math.max(...existingPasos.map(p => p.orden)) + 1 : 1
        const currentTotal = getTotalPeso(procesoId)
        const remaining = Math.max(0, 100 - currentTotal)
        setPasoForm({ paso_id: '', nombre: '', orden: nextOrden, peso_pct: remaining, tipo_colaborador: '', evidencia_requerida: false, tipo_evidencia_sugerida: '' })
        setEditingPaso(null)
        setShowPasoForm(procesoId)
    }

    function getTotalPeso(procesoId: string): number {
        return (pasos[procesoId] || []).reduce((sum, p) => sum + (p.peso_pct || 0), 0)
    }

    function getPesoStatus(procesoId: string): { color: string; bgColor: string; icon: 'check' | 'warning' | 'error'; message: string } {
        const total = getTotalPeso(procesoId)
        if (total === 100) {
            return { color: 'text-green-700', bgColor: 'bg-green-500', icon: 'check', message: 'Suma correcta' }
        } else if (total < 100) {
            return { color: 'text-amber-700', bgColor: 'bg-amber-500', icon: 'warning', message: `Faltan ${(100 - total).toFixed(1)}%` }
        } else {
            return { color: 'text-red-700', bgColor: 'bg-red-500', icon: 'error', message: `Excede por ${(total - 100).toFixed(1)}%` }
        }
    }

    if (loading) return <div className="text-center py-8 text-slate-500">Cargando...</div>

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Procesos Operativos y Pasos</h2>
                <button onClick={() => { resetProcesoForm(); setShowProcesoForm(true) }} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                    <Plus size={18} /> Nuevo Proceso
                </button>
            </div>

            {showProcesoForm && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between"><h3 className="font-semibold text-teal-800">{editing ? 'Editar' : 'Nuevo'} Proceso</h3><button onClick={resetProcesoForm}><X size={20} className="text-slate-400" /></button></div>
                    <div className="grid grid-cols-3 gap-3">
                        <input placeholder="ID Proceso (DECLARACION_IVA) *" value={procesoForm.proceso_id} onChange={e => setProcesoForm({ ...procesoForm, proceso_id: e.target.value.toUpperCase() })} disabled={!!editing} className="px-3 py-2 border rounded-lg disabled:bg-slate-100 font-mono text-slate-900 bg-white placeholder:text-slate-500" />
                        <input placeholder="Nombre *" value={procesoForm.nombre} onChange={e => setProcesoForm({ ...procesoForm, nombre: e.target.value })} className="px-3 py-2 border rounded-lg text-slate-900 bg-white placeholder:text-slate-500" />
                        <select value={procesoForm.categoria_default} onChange={e => setProcesoForm({ ...procesoForm, categoria_default: e.target.value })} className="px-3 py-2 border rounded-lg text-slate-900 bg-white">
                            <option value="RECURRENTE">Recurrente</option>
                            <option value="EXTRAORDINARIO">Extraordinario</option>
                        </select>
                    </div>
                    <button onClick={saveProceso} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg"><Save size={18} /> Guardar</button>
                </div>
            )}

            <div className="space-y-3">
                {procesos.map(p => {
                    const totalPeso = getTotalPeso(p.proceso_id)
                    const status = getPesoStatus(p.proceso_id)
                    const hasPasos = (pasos[p.proceso_id]?.length || 0) > 0

                    return (
                        <div key={p.proceso_id} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                            <div className="flex justify-between items-center p-4 hover:bg-slate-50 cursor-pointer" onClick={() => setExpanded(expanded === p.proceso_id ? null : p.proceso_id)}>
                                <div className="flex items-center gap-3">
                                    {expanded === p.proceso_id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    <Settings size={18} className="text-teal-600" />
                                    <div>
                                        <p className="font-medium text-slate-800">{p.nombre}</p>
                                        <p className="text-xs text-slate-400 font-mono">{p.proceso_id} | {p.categoria_default}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">{pasos[p.proceso_id]?.length || 0} pasos</span>
                                    {hasPasos && (
                                        <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                                            totalPeso === 100 ? 'bg-green-100 text-green-700' :
                                            totalPeso < 100 ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {totalPeso === 100 ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                            {totalPeso}%
                                        </span>
                                    )}
                                    <button onClick={() => editProceso(p)} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button>
                                    <button onClick={() => deleteProceso(p.proceso_id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            {expanded === p.proceso_id && (
                                <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-3">
                                    {/* Barra de progreso de peso */}
                                    {hasPasos && (
                                        <div className="bg-white p-3 rounded border border-slate-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-slate-500 uppercase">Distribucion de Peso</span>
                                                <span className={`text-xs font-medium ${status.color}`}>
                                                    {status.icon === 'check' ? <CheckCircle size={14} className="inline mr-1" /> : <AlertTriangle size={14} className="inline mr-1" />}
                                                    {totalPeso}% - {status.message}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className={`h-3 rounded-full transition-all ${status.bgColor}`}
                                                    style={{ width: `${Math.min(totalPeso, 100)}%` }}
                                                />
                                            </div>
                                            {totalPeso !== 100 && (
                                                <p className={`text-xs mt-2 ${status.color}`}>
                                                    {totalPeso < 100
                                                        ? `Agrega pasos o ajusta los pesos para completar el 100%`
                                                        : `Reduce los pesos de algunos pasos para que sumen exactamente 100%`
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-bold text-slate-500 uppercase">Pasos del Proceso</p>
                                        <button onClick={() => addPaso(p.proceso_id)} className="flex items-center gap-1 px-2 py-1 bg-teal-600 text-white rounded text-xs"><Plus size={14} /> Agregar Paso</button>
                                    </div>

                                    {showPasoForm === p.proceso_id && (
                                        <div className="bg-white border border-teal-200 rounded-lg p-3 space-y-3">
                                            <div className="flex justify-between"><span className="font-medium text-teal-700 text-sm">{editingPaso ? 'Editar' : 'Nuevo'} Paso</span><button onClick={resetPasoForm}><X size={16} className="text-slate-400" /></button></div>
                                            <div className="grid grid-cols-6 gap-2">
                                                <input placeholder="ID Paso *" value={pasoForm.paso_id} onChange={e => setPasoForm({ ...pasoForm, paso_id: e.target.value.toUpperCase() })} disabled={!!editingPaso} className="px-2 py-1 border rounded text-sm disabled:bg-slate-100 font-mono text-slate-900 bg-white placeholder:text-slate-500" />
                                                <input placeholder="Nombre *" value={pasoForm.nombre} onChange={e => setPasoForm({ ...pasoForm, nombre: e.target.value })} className="px-2 py-1 border rounded text-sm col-span-2 text-slate-900 bg-white placeholder:text-slate-500" />
                                                <input type="number" placeholder="Orden" value={pasoForm.orden} onChange={e => setPasoForm({ ...pasoForm, orden: parseInt(e.target.value) || 1 })} className="px-2 py-1 border rounded text-sm text-slate-900 bg-white" min={1} />
                                                <input type="number" placeholder="Peso %" value={pasoForm.peso_pct} onChange={e => setPasoForm({ ...pasoForm, peso_pct: parseFloat(e.target.value) || 0 })} className="px-2 py-1 border rounded text-sm text-slate-900 bg-white" min={0} max={100} step={1} />
                                                <select value={pasoForm.tipo_colaborador} onChange={e => setPasoForm({ ...pasoForm, tipo_colaborador: e.target.value })} className="px-2 py-1 border rounded text-sm text-slate-900 bg-white">
                                                    <option value="">Tipo</option>
                                                    {TIPOS_COLABORADOR.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pasoForm.evidencia_requerida} onChange={e => setPasoForm({ ...pasoForm, evidencia_requerida: e.target.checked })} /> Requiere evidencia</label>
                                                {pasoForm.evidencia_requerida && <input placeholder="Tipo evidencia" value={pasoForm.tipo_evidencia_sugerida} onChange={e => setPasoForm({ ...pasoForm, tipo_evidencia_sugerida: e.target.value })} className="px-2 py-1 border rounded text-sm flex-1 text-slate-900 bg-white placeholder:text-slate-500" />}
                                            </div>
                                            <button onClick={() => savePaso(p.proceso_id)} className="px-3 py-1 bg-teal-600 text-white rounded text-sm"><Save size={14} className="inline mr-1" /> Guardar</button>
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        {(pasos[p.proceso_id] || []).sort((a, b) => a.orden - b.orden).map(paso => (
                                            <div key={paso.paso_id} className="flex justify-between items-center bg-white p-3 rounded border border-slate-200">
                                                <div className="flex items-center gap-3">
                                                    <GripVertical size={14} className="text-slate-300" />
                                                    <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">{paso.orden}</span>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{paso.nombre}</p>
                                                        <p className="text-xs text-slate-400">
                                                            <span className="font-semibold text-teal-600">{paso.peso_pct}%</span>
                                                            {paso.tipo_colaborador && ` | ${paso.tipo_colaborador === 'LIDER' ? 'Líder' : `Aux ${paso.tipo_colaborador}`}`}
                                                            {paso.evidencia_requerida && ' | Evidencia'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {/* Mini barra de peso */}
                                                    <div className="w-16 bg-slate-200 rounded-full h-2 mr-2">
                                                        <div
                                                            className="h-2 rounded-full bg-teal-500"
                                                            style={{ width: `${paso.peso_pct}%` }}
                                                        />
                                                    </div>
                                                    <button onClick={() => editPaso(paso)} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={14} /></button>
                                                    <button onClick={() => deletePaso(p.proceso_id, paso.paso_id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!pasos[p.proceso_id] || pasos[p.proceso_id].length === 0) && <p className="text-sm text-slate-400">Sin pasos definidos. Agrega el primer paso.</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
                {procesos.length === 0 && <p className="text-center text-slate-400 py-8">No hay procesos. Crea uno nuevo.</p>}
            </div>
        </div>
    )
}
