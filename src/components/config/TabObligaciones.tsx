'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Pencil, Trash2, X, Save, FileText, Link2, Calendar } from 'lucide-react'

interface Obligacion {
    id_obligacion: string
    nombre_corto: string
    descripcion?: string
    nivel: string
    impuesto: string
    periodicidad: string
    es_informativa: boolean
    fundamento_resumen?: string
    activo: boolean
}

interface Regimen {
    c_regimen: string
    descripcion: string
    tipo_persona: string
    activo: boolean
}

interface CalendarioRegla {
    calendario_regla_id: string
    id_evento_calendario: string
    nombre: string
    tipo_evento: string
    dia_base?: number
    mes_base?: number
    regla_texto: string
}

const NIVELES = ['FEDERAL', 'ESTATAL', 'SEGURIDAD_SOCIAL']
const PERIODICIDADES = ['MENSUAL', 'ANUAL', 'EVENTUAL', 'POR_OPERACION', 'PERMANENTE']

export default function TabObligaciones() {
    const [obligaciones, setObligaciones] = useState<Obligacion[]>([])
    const [regimenes, setRegimenes] = useState<Regimen[]>([])
    const [calendarios, setCalendarios] = useState<CalendarioRegla[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<Obligacion | null>(null)
    const [tab, setTab] = useState<'obligaciones' | 'regimenes' | 'calendario'>('obligaciones')

    const [form, setForm] = useState({
        id_obligacion: '', nombre_corto: '', descripcion: '', nivel: 'FEDERAL',
        impuesto: '', periodicidad: 'MENSUAL', es_informativa: false, fundamento_resumen: ''
    })

    const [regimenForm, setRegimenForm] = useState({ c_regimen: '', descripcion: '', tipo_persona: 'PM' })
    const [showRegimenForm, setShowRegimenForm] = useState(false)
    const [editingRegimen, setEditingRegimen] = useState<Regimen | null>(null)

    const [calendarioForm, setCalendarioForm] = useState({ id_evento_calendario: '', nombre: '', tipo_evento: 'MENSUAL', dia_base: 17, regla_texto: '' })
    const [showCalendarioForm, setShowCalendarioForm] = useState(false)
    const [editingCalendario, setEditingCalendario] = useState<CalendarioRegla | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const loadData = useCallback(async () => {
        setLoading(true)
        const [{ data: oblig }, { data: reg }, { data: cal }] = await Promise.all([
            supabase.from('obligacion_fiscal').select('*').eq('activo', true).order('nombre_corto'),
            supabase.from('regimen_fiscal').select('*').eq('activo', true).order('c_regimen'),
            supabase.from('calendario_regla').select('*').eq('activo', true).order('nombre')
        ])
        setObligaciones(oblig || [])
        setRegimenes(reg || [])
        setCalendarios(cal || [])
        setLoading(false)
    }, [supabase])

    useEffect(() => { loadData() }, [loadData])

    // OBLIGACIONES
    async function saveObligacion() {
        if (!form.id_obligacion || !form.nombre_corto) return alert('ID y Nombre requeridos')
        if (editing) {
            await supabase.from('obligacion_fiscal').update(form).eq('id_obligacion', editing.id_obligacion)
        } else {
            await supabase.from('obligacion_fiscal').insert({ ...form, activo: true })
        }
        resetForm()
        loadData()
    }

    async function deleteObligacion(id: string) {
        if (!confirm('¿Eliminar obligación?')) return
        await supabase.from('obligacion_fiscal').update({ activo: false }).eq('id_obligacion', id)
        loadData()
    }

    function resetForm() {
        setForm({ id_obligacion: '', nombre_corto: '', descripcion: '', nivel: 'FEDERAL', impuesto: '', periodicidad: 'MENSUAL', es_informativa: false, fundamento_resumen: '' })
        setEditing(null)
        setShowForm(false)
    }

    function editObligacion(o: Obligacion) {
        setForm({ id_obligacion: o.id_obligacion, nombre_corto: o.nombre_corto, descripcion: o.descripcion || '', nivel: o.nivel, impuesto: o.impuesto, periodicidad: o.periodicidad, es_informativa: o.es_informativa, fundamento_resumen: o.fundamento_resumen || '' })
        setEditing(o)
        setShowForm(true)
    }

    // REGIMENES
    async function saveRegimen() {
        if (!regimenForm.c_regimen || !regimenForm.descripcion) return alert('Código y Descripción requeridos')
        if (editingRegimen) {
            await supabase.from('regimen_fiscal').update(regimenForm).eq('c_regimen', editingRegimen.c_regimen)
        } else {
            await supabase.from('regimen_fiscal').insert({ ...regimenForm, activo: true })
        }
        setRegimenForm({ c_regimen: '', descripcion: '', tipo_persona: 'PM' })
        setEditingRegimen(null)
        setShowRegimenForm(false)
        loadData()
    }

    async function deleteRegimen(id: string) {
        if (!confirm('¿Eliminar régimen?')) return
        await supabase.from('regimen_fiscal').update({ activo: false }).eq('c_regimen', id)
        loadData()
    }

    // CALENDARIO
    async function saveCalendario() {
        if (!calendarioForm.id_evento_calendario || !calendarioForm.nombre || !calendarioForm.regla_texto) return alert('Campos requeridos')
        if (editingCalendario) {
            await supabase.from('calendario_regla').update(calendarioForm).eq('calendario_regla_id', editingCalendario.calendario_regla_id)
        } else {
            await supabase.from('calendario_regla').insert({ ...calendarioForm, motor_version: 1, activo: true })
        }
        setCalendarioForm({ id_evento_calendario: '', nombre: '', tipo_evento: 'MENSUAL', dia_base: 17, regla_texto: '' })
        setEditingCalendario(null)
        setShowCalendarioForm(false)
        loadData()
    }

    async function deleteCalendario(id: string) {
        if (!confirm('¿Eliminar regla?')) return
        await supabase.from('calendario_regla').update({ activo: false }).eq('calendario_regla_id', id)
        loadData()
    }

    if (loading) return <div className="text-center py-8 text-slate-500">Cargando...</div>

    return (
        <div className="space-y-4">
            {/* Sub-tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button onClick={() => setTab('obligaciones')} className={`px-4 py-2 rounded-t-lg font-medium ${tab === 'obligaciones' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}>
                    <FileText size={16} className="inline mr-1" /> Obligaciones
                </button>
                <button onClick={() => setTab('regimenes')} className={`px-4 py-2 rounded-t-lg font-medium ${tab === 'regimenes' ? 'bg-purple-100 text-purple-700' : 'text-slate-500'}`}>
                    <Link2 size={16} className="inline mr-1" /> Regímenes
                </button>
                <button onClick={() => setTab('calendario')} className={`px-4 py-2 rounded-t-lg font-medium ${tab === 'calendario' ? 'bg-amber-100 text-amber-700' : 'text-slate-500'}`}>
                    <Calendar size={16} className="inline mr-1" /> Calendario
                </button>
            </div>

            {/* OBLIGACIONES */}
            {tab === 'obligaciones' && (
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <h3 className="font-semibold text-slate-800">Obligaciones Fiscales ({obligaciones.length})</h3>
                        <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"><Plus size={16} /> Nueva</button>
                    </div>

                    {showForm && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between"><h4 className="font-semibold text-blue-800">{editing ? 'Editar' : 'Nueva'} Obligación</h4><button onClick={resetForm}><X size={20} className="text-slate-400" /></button></div>
                            <div className="grid grid-cols-3 gap-3">
                                <input placeholder="ID (ISR_MENSUAL) *" value={form.id_obligacion} onChange={e => setForm({ ...form, id_obligacion: e.target.value.toUpperCase() })} disabled={!!editing} className="px-3 py-2 border rounded-lg disabled:bg-slate-100 font-mono" />
                                <input placeholder="Nombre Corto *" value={form.nombre_corto} onChange={e => setForm({ ...form, nombre_corto: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                                <input placeholder="Impuesto (ISR, IVA...)" value={form.impuesto} onChange={e => setForm({ ...form, impuesto: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                                <select value={form.nivel} onChange={e => setForm({ ...form, nivel: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500">
                                    {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <select value={form.periodicidad} onChange={e => setForm({ ...form, periodicidad: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500">
                                    {PERIODICIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <label className="flex items-center gap-2 px-3 py-2">
                                    <input type="checkbox" checked={form.es_informativa} onChange={e => setForm({ ...form, es_informativa: e.target.checked })} />
                                    Es informativa
                                </label>
                            </div>
                            <input placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                            <input placeholder="Fundamento Legal" value={form.fundamento_resumen} onChange={e => setForm({ ...form, fundamento_resumen: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                            <button onClick={saveObligacion} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Save size={18} /> Guardar</button>
                        </div>
                    )}

                    <table className="w-full text-left bg-white rounded-lg overflow-hidden border border-slate-200">
                        <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                            <tr><th className="p-3">ID</th><th className="p-3">Nombre</th><th className="p-3">Impuesto</th><th className="p-3">Nivel</th><th className="p-3">Periodicidad</th><th className="p-3">Info?</th><th className="p-3 text-right">Acciones</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {obligaciones.map(o => (
                                <tr key={o.id_obligacion} className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-xs">{o.id_obligacion}</td>
                                    <td className="p-3 font-medium">{o.nombre_corto}</td>
                                    <td className="p-3">{o.impuesto}</td>
                                    <td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{o.nivel}</span></td>
                                    <td className="p-3">{o.periodicidad}</td>
                                    <td className="p-3">{o.es_informativa ? '✓' : '-'}</td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => editObligacion(o)} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button>
                                        <button onClick={() => deleteObligacion(o.id_obligacion)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* REGIMENES */}
            {tab === 'regimenes' && (
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <h3 className="font-semibold text-slate-800">Regímenes Fiscales ({regimenes.length})</h3>
                        <button onClick={() => setShowRegimenForm(true)} className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm"><Plus size={16} /> Nuevo</button>
                    </div>

                    {showRegimenForm && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between"><h4 className="font-semibold text-purple-800">{editingRegimen ? 'Editar' : 'Nuevo'} Régimen</h4><button onClick={() => { setShowRegimenForm(false); setEditingRegimen(null) }}><X size={20} className="text-slate-400" /></button></div>
                            <div className="grid grid-cols-3 gap-3">
                                <input placeholder="Código (601) *" value={regimenForm.c_regimen} onChange={e => setRegimenForm({ ...regimenForm, c_regimen: e.target.value })} disabled={!!editingRegimen} className="px-3 py-2 border rounded-lg disabled:bg-slate-100" />
                                <input placeholder="Descripción *" value={regimenForm.descripcion} onChange={e => setRegimenForm({ ...regimenForm, descripcion: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                                <select value={regimenForm.tipo_persona} onChange={e => setRegimenForm({ ...regimenForm, tipo_persona: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500">
                                    <option value="PF">Persona Física</option>
                                    <option value="PM">Persona Moral</option>
                                    <option value="AMBOS">Ambos</option>
                                </select>
                            </div>
                            <button onClick={saveRegimen} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg"><Save size={18} /> Guardar</button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        {regimenes.map(r => (
                            <div key={r.c_regimen} className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-3">
                                <div>
                                    <span className="font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-sm mr-2">{r.c_regimen}</span>
                                    <span className="text-sm">{r.descripcion}</span>
                                    <span className={`ml-2 text-xs px-1 rounded ${r.tipo_persona === 'PF' ? 'bg-blue-100 text-blue-700' : r.tipo_persona === 'PM' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{r.tipo_persona}</span>
                                </div>
                                <div>
                                    <button onClick={() => { setRegimenForm({ c_regimen: r.c_regimen, descripcion: r.descripcion, tipo_persona: r.tipo_persona }); setEditingRegimen(r); setShowRegimenForm(true) }} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={14} /></button>
                                    <button onClick={() => deleteRegimen(r.c_regimen)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CALENDARIO */}
            {tab === 'calendario' && (
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <h3 className="font-semibold text-slate-800">Reglas de Calendario ({calendarios.length})</h3>
                        <button onClick={() => setShowCalendarioForm(true)} className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm"><Plus size={16} /> Nueva</button>
                    </div>

                    {showCalendarioForm && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between"><h4 className="font-semibold text-amber-800">{editingCalendario ? 'Editar' : 'Nueva'} Regla</h4><button onClick={() => { setShowCalendarioForm(false); setEditingCalendario(null) }}><X size={20} className="text-slate-400" /></button></div>
                            <div className="grid grid-cols-4 gap-3">
                                <input placeholder="ID Evento *" value={calendarioForm.id_evento_calendario} onChange={e => setCalendarioForm({ ...calendarioForm, id_evento_calendario: e.target.value.toUpperCase() })} disabled={!!editingCalendario} className="px-3 py-2 border rounded-lg disabled:bg-slate-100" />
                                <input placeholder="Nombre *" value={calendarioForm.nombre} onChange={e => setCalendarioForm({ ...calendarioForm, nombre: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                                <select value={calendarioForm.tipo_evento} onChange={e => setCalendarioForm({ ...calendarioForm, tipo_evento: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500">
                                    <option value="MENSUAL">Mensual</option>
                                    <option value="ANUAL">Anual</option>
                                </select>
                                <input type="number" placeholder="Día base" value={calendarioForm.dia_base} onChange={e => setCalendarioForm({ ...calendarioForm, dia_base: parseInt(e.target.value) })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" min={1} max={31} />
                            </div>
                            <input placeholder="Regla Texto (ej: 'Día 17 del mes siguiente') *" value={calendarioForm.regla_texto} onChange={e => setCalendarioForm({ ...calendarioForm, regla_texto: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                            <button onClick={saveCalendario} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg"><Save size={18} /> Guardar</button>
                        </div>
                    )}

                    <table className="w-full text-left bg-white rounded-lg overflow-hidden border border-slate-200">
                        <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                            <tr><th className="p-3">ID</th><th className="p-3">Nombre</th><th className="p-3">Tipo</th><th className="p-3">Día Base</th><th className="p-3">Regla</th><th className="p-3 text-right">Acciones</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {calendarios.map(c => (
                                <tr key={c.calendario_regla_id} className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-xs">{c.id_evento_calendario}</td>
                                    <td className="p-3 font-medium">{c.nombre}</td>
                                    <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${c.tipo_evento === 'MENSUAL' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{c.tipo_evento}</span></td>
                                    <td className="p-3">{c.dia_base || '-'}</td>
                                    <td className="p-3 text-slate-500 text-xs">{c.regla_texto}</td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => { setCalendarioForm({ id_evento_calendario: c.id_evento_calendario, nombre: c.nombre, tipo_evento: c.tipo_evento, dia_base: c.dia_base || 17, regla_texto: c.regla_texto }); setEditingCalendario(c); setShowCalendarioForm(true) }} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button>
                                        <button onClick={() => deleteCalendario(c.calendario_regla_id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
