'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Pencil, Trash2, X, Save, Package, Ruler, Link2 } from 'lucide-react'

interface Servicio {
    servicio_id: string
    nombre: string
    descripcion?: string
    activo: boolean
}

interface Talla {
    talla_id: string
    ponderacion: number
    activo: boolean
}

interface Obligacion {
    id_obligacion: string
    nombre_corto: string
}

interface ServicioObligacion {
    servicio_id: string
    id_obligacion: string
}

const TALLAS_DEFAULT = [
    { talla_id: 'EXTRA_CHICA', ponderacion: 50 },
    { talla_id: 'CHICA', ponderacion: 75 },
    { talla_id: 'MEDIANA', ponderacion: 100 },
    { talla_id: 'GRANDE', ponderacion: 150 },
    { talla_id: 'EXTRA_GRANDE', ponderacion: 200 }
]

export default function TabServicios() {
    const [servicios, setServicios] = useState<Servicio[]>([])
    const [tallas, setTallas] = useState<Talla[]>([])
    const [obligaciones, setObligaciones] = useState<Obligacion[]>([])
    const [servicioObligaciones, setServicioObligaciones] = useState<ServicioObligacion[]>([])
    const [loading, setLoading] = useState(true)
    const [showServicioForm, setShowServicioForm] = useState(false)
    const [editingServicio, setEditingServicio] = useState<Servicio | null>(null)
    const [servicioForm, setServicioForm] = useState({ servicio_id: '', nombre: '', descripcion: '' })
    const [tab, setTab] = useState<'servicios' | 'tallas' | 'cobertura'>('servicios')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => { loadData() }, [])

    async function loadData() {
        setLoading(true)
        const [{ data: servData }, { data: tallaData }, { data: obligData }, { data: servObligData }] = await Promise.all([
            supabase.from('servicio').select('*').eq('activo', true).order('nombre'),
            supabase.from('talla').select('*').order('ponderacion'),
            supabase.from('obligacion_fiscal').select('id_obligacion, nombre_corto').eq('activo', true).order('nombre_corto'),
            supabase.from('servicio_obligacion').select('*')
        ])
        setServicios(servData || [])
        setTallas(tallaData || [])
        setObligaciones(obligData || [])
        setServicioObligaciones(servObligData || [])
        setLoading(false)
    }

    async function saveServicio() {
        if (!servicioForm.servicio_id || !servicioForm.nombre) return alert('ID y Nombre requeridos')
        if (editingServicio) {
            await supabase.from('servicio').update({ nombre: servicioForm.nombre, descripcion: servicioForm.descripcion }).eq('servicio_id', editingServicio.servicio_id)
        } else {
            await supabase.from('servicio').insert({ ...servicioForm, activo: true })
        }
        resetServicioForm()
        loadData()
    }

    async function deleteServicio(id: string) {
        if (!confirm('¿Eliminar servicio?')) return
        await supabase.from('servicio').update({ activo: false }).eq('servicio_id', id)
        loadData()
    }

    async function updateTallaPonderacion(tallaId: string, ponderacion: number) {
        await supabase.from('talla').update({ ponderacion }).eq('talla_id', tallaId)
        loadData()
    }

    async function initTallas() {
        if (tallas.length > 0) return alert('Ya existen tallas')
        for (const t of TALLAS_DEFAULT) {
            await supabase.from('talla').insert({ ...t, activo: true })
        }
        loadData()
    }

    async function toggleServicioObligacion(servicioId: string, obligacionId: string) {
        const existe = servicioObligaciones.some(
            so => so.servicio_id === servicioId && so.id_obligacion === obligacionId
        )

        if (existe) {
            await supabase.from('servicio_obligacion')
                .delete()
                .eq('servicio_id', servicioId)
                .eq('id_obligacion', obligacionId)
        } else {
            await supabase.from('servicio_obligacion')
                .insert({ servicio_id: servicioId, id_obligacion: obligacionId })
        }
        loadData()
    }

    function resetServicioForm() {
        setServicioForm({ servicio_id: '', nombre: '', descripcion: '' })
        setEditingServicio(null)
        setShowServicioForm(false)
    }

    if (loading) return <div className="text-center py-8 text-slate-500">Cargando...</div>

    return (
        <div className="space-y-4">
            <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button onClick={() => setTab('servicios')} className={`px-4 py-2 rounded-t-lg font-medium ${tab === 'servicios' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}>
                    <Package size={16} className="inline mr-1" /> Servicios CBC
                </button>
                <button onClick={() => setTab('tallas')} className={`px-4 py-2 rounded-t-lg font-medium ${tab === 'tallas' ? 'bg-pink-100 text-pink-700' : 'text-slate-500'}`}>
                    <Ruler size={16} className="inline mr-1" /> Tallas
                </button>
                <button onClick={() => setTab('cobertura')} className={`px-4 py-2 rounded-t-lg font-medium ${tab === 'cobertura' ? 'bg-green-100 text-green-700' : 'text-slate-500'}`}>
                    <Link2 size={16} className="inline mr-1" /> Cobertura
                </button>
            </div>

            {/* SERVICIOS */}
            {tab === 'servicios' && (
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <h3 className="font-semibold text-slate-800">Servicios CBC ({servicios.length})</h3>
                        <button onClick={() => { resetServicioForm(); setShowServicioForm(true) }} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm"><Plus size={16} /> Nuevo</button>
                    </div>

                    {showServicioForm && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between"><h4 className="font-semibold text-indigo-800">{editingServicio ? 'Editar' : 'Nuevo'} Servicio</h4><button onClick={resetServicioForm}><X size={20} className="text-slate-400" /></button></div>
                            <div className="grid grid-cols-3 gap-3">
                                <input placeholder="ID (CONTABILIDAD) *" value={servicioForm.servicio_id} onChange={e => setServicioForm({ ...servicioForm, servicio_id: e.target.value.toUpperCase() })} disabled={!!editingServicio} className="px-3 py-2 border rounded-lg disabled:bg-slate-100 font-mono" />
                                <input placeholder="Nombre *" value={servicioForm.nombre} onChange={e => setServicioForm({ ...servicioForm, nombre: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                                <input placeholder="Descripción" value={servicioForm.descripcion} onChange={e => setServicioForm({ ...servicioForm, descripcion: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                            </div>
                            <button onClick={saveServicio} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"><Save size={18} /> Guardar</button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        {servicios.map(s => (
                            <div key={s.servicio_id} className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-4">
                                <div>
                                    <p className="font-medium">{s.nombre}</p>
                                    <p className="text-xs text-slate-400 font-mono">{s.servicio_id}</p>
                                    {s.descripcion && <p className="text-xs text-slate-500 mt-1">{s.descripcion}</p>}
                                </div>
                                <div>
                                    <button onClick={() => { setServicioForm({ servicio_id: s.servicio_id, nombre: s.nombre, descripcion: s.descripcion || '' }); setEditingServicio(s); setShowServicioForm(true) }} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button>
                                    <button onClick={() => deleteServicio(s.servicio_id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {servicios.length === 0 && <p className="text-center text-slate-400 py-8">No hay servicios. Crea uno.</p>}
                </div>
            )}

            {/* TALLAS */}
            {tab === 'tallas' && (
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <h3 className="font-semibold text-slate-800">Tallas de Cliente</h3>
                        {tallas.length === 0 && <button onClick={initTallas} className="px-3 py-1.5 bg-pink-600 text-white rounded-lg text-sm">Inicializar Tallas Default</button>}
                    </div>

                    <p className="text-sm text-slate-500">Las tallas determinan el multiplicador de puntos base para cada cliente.</p>

                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                                <tr><th className="p-3">Talla</th><th className="p-3">Ponderación (%)</th><th className="p-3">Ejemplo (Base 100pts)</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tallas.map(t => (
                                    <tr key={t.talla_id} className="hover:bg-slate-50">
                                        <td className="p-3 font-medium">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${t.talla_id === 'EXTRA_CHICA' ? 'bg-green-100 text-green-700' :
                                                t.talla_id === 'CHICA' ? 'bg-blue-100 text-blue-700' :
                                                    t.talla_id === 'MEDIANA' ? 'bg-yellow-100 text-yellow-700' :
                                                        t.talla_id === 'GRANDE' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-red-100 text-red-700'
                                                }`}>{t.talla_id.replace('_', ' ')}</span>
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                value={t.ponderacion}
                                                onChange={e => updateTallaPonderacion(t.talla_id, parseInt(e.target.value))}
                                                className="w-20 px-2 py-1 border rounded text-center"
                                                min={10}
                                                max={500}
                                            />%
                                        </td>
                                        <td className="p-3 text-slate-600">{100 * t.ponderacion / 100} pts</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {tallas.length === 0 && <p className="text-center text-slate-400 py-8">No hay tallas. Haz clic en "Inicializar Tallas Default".</p>}
                </div>
            )}

            {/* COBERTURA - Matriz Servicio → Obligación */}
            {tab === 'cobertura' && (
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-slate-800">Cobertura de Obligaciones por Servicio</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Define qué obligaciones fiscales cubre cada servicio.
                            Esto determina qué tareas se generan para los clientes que contraten cada servicio.
                        </p>
                    </div>

                    {servicios.length === 0 || obligaciones.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            {servicios.length === 0 && <p>No hay servicios. Crea uno en la pestaña "Servicios CBC".</p>}
                            {obligaciones.length === 0 && <p>No hay obligaciones fiscales. Créalas en "Catálogo Fiscal".</p>}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                            <table className="w-full border-collapse min-w-max">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="p-3 text-left font-medium text-slate-600 sticky left-0 bg-slate-100 border-r border-slate-200 min-w-[200px]">
                                            Servicio
                                        </th>
                                        {obligaciones.map(o => (
                                            <th key={o.id_obligacion} className="p-2 text-center text-xs font-medium text-slate-600 min-w-[80px] border-l border-slate-100">
                                                <div className="writing-mode-vertical" title={o.id_obligacion}>
                                                    {o.nombre_corto}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {servicios.map(s => {
                                        const obligacionesDelServicio = servicioObligaciones.filter(so => so.servicio_id === s.servicio_id)
                                        return (
                                            <tr key={s.servicio_id} className="hover:bg-slate-50">
                                                <td className="p-3 font-medium sticky left-0 bg-white border-r border-slate-200">
                                                    <div>
                                                        <span>{s.nombre}</span>
                                                        <span className="ml-2 text-xs text-slate-400">
                                                            ({obligacionesDelServicio.length})
                                                        </span>
                                                    </div>
                                                </td>
                                                {obligaciones.map(o => {
                                                    const checked = servicioObligaciones.some(
                                                        so => so.servicio_id === s.servicio_id && so.id_obligacion === o.id_obligacion
                                                    )
                                                    return (
                                                        <td key={o.id_obligacion} className="p-2 text-center border-l border-slate-100">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleServicioObligacion(s.servicio_id, o.id_obligacion)}
                                                                className="w-5 h-5 cursor-pointer accent-green-600 rounded"
                                                            />
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                        <strong>¿Cómo funciona?</strong>
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                            <li>Marca las obligaciones que cubre cada servicio</li>
                            <li>Cuando un cliente contrata un servicio, se generarán tareas para las obligaciones marcadas</li>
                            <li>Solo se generan tareas si la obligación también aplica al régimen fiscal del RFC</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}
