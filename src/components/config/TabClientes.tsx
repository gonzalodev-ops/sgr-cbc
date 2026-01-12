'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { Plus, Pencil, Trash2, X, Save, ChevronDown, ChevronUp, Building2 } from 'lucide-react'

interface Cliente {
    cliente_id: string
    nombre_comercial: string
    razon_social_principal?: string
    segmento?: string
    contacto_nombre?: string
    contacto_email?: string
    contacto_telefono?: string
    notas?: string
    estado: string
}

interface Contribuyente {
    contribuyente_id: string
    rfc: string
    tipo_persona: string
    razon_social: string
    nombre_comercial?: string
}


const SEGMENTOS = ['MICRO', 'PEQUEÑA', 'MEDIANA', 'GRANDE', 'CORPORATIVO']

export default function TabClientes() {
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [contribuyentes, setContribuyentes] = useState<Record<string, Contribuyente[]>>({})
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<Cliente | null>(null)

    const [form, setForm] = useState({
        nombre_comercial: '', razon_social_principal: '', segmento: '',
        contacto_nombre: '', contacto_email: '', contacto_telefono: '', notas: ''
    })
    const [rfcForm, setRfcForm] = useState({ rfc: '', tipo_persona: 'PM', razon_social: '', cliente_id: '' })

    // Usar hook centralizado de Supabase
    const supabase = useSupabase()

    const loadData = useCallback(async () => {
        setLoading(true)
        const { data: clientesData } = await supabase.from('cliente').select('*').eq('estado', 'ACTIVO').order('nombre_comercial')
        setClientes(clientesData || [])

        const { data: ccData } = await supabase.from('cliente_contribuyente').select('cliente_id, contribuyente:contribuyente_id(*)')
        const map: Record<string, Contribuyente[]> = {}
        ccData?.forEach((cc: { cliente_id: string; contribuyente: Contribuyente | null }) => {
            if (!map[cc.cliente_id]) map[cc.cliente_id] = []
            if (cc.contribuyente) map[cc.cliente_id].push(cc.contribuyente)
        })
        setContribuyentes(map)
        setLoading(false)
    }, [supabase])

    useEffect(() => { loadData() }, [loadData])

    async function saveCliente() {
        if (!form.nombre_comercial) return alert('Nombre comercial requerido')
        if (editing) {
            await supabase.from('cliente').update(form).eq('cliente_id', editing.cliente_id)
        } else {
            await supabase.from('cliente').insert({ ...form, estado: 'ACTIVO' })
        }
        resetForm()
        loadData()
    }

    async function deleteCliente(id: string) {
        if (!confirm('¿Eliminar cliente y todos sus RFCs asociados?')) return
        await supabase.from('cliente').update({ estado: 'INACTIVO' }).eq('cliente_id', id)
        loadData()
    }

    async function saveRFC() {
        if (!rfcForm.rfc || !rfcForm.razon_social || !rfcForm.cliente_id) return alert('RFC y Razón Social requeridos')
        const { data: contrib, error } = await supabase.from('contribuyente')
            .insert({ rfc: rfcForm.rfc.toUpperCase(), tipo_persona: rfcForm.tipo_persona, razon_social: rfcForm.razon_social })
            .select().single()
        if (error) return alert('Error: ' + error.message)
        if (contrib) {
            await supabase.from('cliente_contribuyente').insert({ cliente_id: rfcForm.cliente_id, contribuyente_id: contrib.contribuyente_id })
        }
        setRfcForm({ rfc: '', tipo_persona: 'PM', razon_social: '', cliente_id: '' })
        loadData()
    }

    async function deleteRFC(contribuyenteId: string, clienteId: string) {
        if (!confirm('¿Eliminar RFC?')) return
        await supabase.from('cliente_contribuyente').delete().eq('cliente_id', clienteId).eq('contribuyente_id', contribuyenteId)
        loadData()
    }

    function resetForm() {
        setForm({ nombre_comercial: '', razon_social_principal: '', segmento: '', contacto_nombre: '', contacto_email: '', contacto_telefono: '', notas: '' })
        setEditing(null)
        setShowForm(false)
    }

    function editCliente(c: Cliente) {
        setForm({
            nombre_comercial: c.nombre_comercial,
            razon_social_principal: c.razon_social_principal || '',
            segmento: c.segmento || '',
            contacto_nombre: c.contacto_nombre || '',
            contacto_email: c.contacto_email || '',
            contacto_telefono: c.contacto_telefono || '',
            notas: c.notas || ''
        })
        setEditing(c)
        setShowForm(true)
    }

    if (loading) return <div className="text-center py-8 text-slate-500">Cargando clientes...</div>

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Clientes y RFCs</h2>
                <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus size={18} /> Nuevo Cliente
                </button>
            </div>

            {showForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-blue-800">{editing ? 'Editar' : 'Nuevo'} Cliente</h3>
                        <button onClick={resetForm}><X size={20} className="text-slate-400" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <input placeholder="Nombre Comercial *" value={form.nombre_comercial} onChange={e => setForm({ ...form, nombre_comercial: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                        <input placeholder="Razón Social" value={form.razon_social_principal} onChange={e => setForm({ ...form, razon_social_principal: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                        <select value={form.segmento} onChange={e => setForm({ ...form, segmento: e.target.value })} className="px-3 py-2 border rounded-lg text-slate-500">
                            <option value="">-- Segmento --</option>
                            {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input placeholder="Contacto: Nombre" value={form.contacto_nombre} onChange={e => setForm({ ...form, contacto_nombre: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                        <input placeholder="Contacto: Email" value={form.contacto_email} onChange={e => setForm({ ...form, contacto_email: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                        <input placeholder="Contacto: Teléfono" value={form.contacto_telefono} onChange={e => setForm({ ...form, contacto_telefono: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                    </div>
                    <textarea placeholder="Notas" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="w-full px-3 py-2 border rounded-lg placeholder:text-slate-500" rows={2} />
                    <button onClick={saveCliente} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save size={18} /> Guardar</button>
                </div>
            )}

            <div className="space-y-2">
                {clientes.map(c => (
                    <div key={c.cliente_id} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <div className="flex justify-between items-center p-4 hover:bg-slate-50 cursor-pointer" onClick={() => setExpanded(expanded === c.cliente_id ? null : c.cliente_id)}>
                            <div className="flex items-center gap-3">
                                {expanded === c.cliente_id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                <Building2 size={18} className="text-emerald-600" />
                                <div>
                                    <p className="font-medium text-slate-800">{c.nombre_comercial}</p>
                                    <p className="text-xs text-slate-400">{c.razon_social_principal || 'Sin razón social'} {c.segmento && `• ${c.segmento}`}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <span className="text-xs bg-slate-100 px-2 py-1 rounded">{contribuyentes[c.cliente_id]?.length || 0} RFCs</span>
                                <button onClick={() => editCliente(c)} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button>
                                <button onClick={() => deleteCliente(c.cliente_id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                        </div>

                        {expanded === c.cliente_id && (
                            <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-4">
                                {c.contacto_nombre && (
                                    <div className="bg-white p-3 rounded border border-slate-200">
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Contacto</p>
                                        <p className="text-sm">{c.contacto_nombre} {c.contacto_email && `• ${c.contacto_email}`} {c.contacto_telefono && `• ${c.contacto_telefono}`}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">RFCs Asociados</p>
                                    {contribuyentes[c.cliente_id]?.map(rfc => (
                                        <div key={rfc.contribuyente_id} className="flex justify-between items-center bg-white p-3 rounded border border-slate-200 mb-2">
                                            <div>
                                                <p className="font-mono text-sm font-medium">{rfc.rfc}</p>
                                                <p className="text-xs text-slate-400">{rfc.razon_social} ({rfc.tipo_persona})</p>
                                            </div>
                                            <button onClick={() => deleteRFC(rfc.contribuyente_id, c.cliente_id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                    {(!contribuyentes[c.cliente_id] || contribuyentes[c.cliente_id].length === 0) && <p className="text-sm text-slate-400 mb-2">Sin RFCs asociados</p>}
                                    <div className="flex gap-2 mt-2">
                                        <input placeholder="RFC *" value={rfcForm.cliente_id === c.cliente_id ? rfcForm.rfc : ''} onChange={e => setRfcForm({ ...rfcForm, rfc: e.target.value.toUpperCase(), cliente_id: c.cliente_id })} className="px-2 py-1 border rounded text-sm flex-1 font-mono placeholder:text-slate-500" maxLength={13} />
                                        <input placeholder="Razón Social *" value={rfcForm.cliente_id === c.cliente_id ? rfcForm.razon_social : ''} onChange={e => setRfcForm({ ...rfcForm, razon_social: e.target.value, cliente_id: c.cliente_id })} className="px-2 py-1 border rounded text-sm flex-1 placeholder:text-slate-500" />
                                        <select value={rfcForm.cliente_id === c.cliente_id ? rfcForm.tipo_persona : 'PM'} onChange={e => setRfcForm({ ...rfcForm, tipo_persona: e.target.value, cliente_id: c.cliente_id })} className="px-2 py-1 border rounded text-sm">
                                            <option value="PM">PM</option>
                                            <option value="PF">PF</option>
                                        </select>
                                        <button onClick={saveRFC} disabled={rfcForm.cliente_id !== c.cliente_id || !rfcForm.rfc || !rfcForm.razon_social} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"><Plus size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {clientes.length === 0 && <p className="text-center text-slate-400 py-8">No hay clientes. Agrega uno nuevo.</p>}
            </div>
        </div>
    )
}
