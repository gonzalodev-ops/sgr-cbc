'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Pencil, Trash2, X, Save, ChevronDown, ChevronUp, Building2, Users, Tag, FileCheck } from 'lucide-react'

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
    team_id?: string
}

interface Regimen {
    c_regimen: string
    descripcion: string
    tipo_persona: string
}

interface ContribuyenteRegimen {
    contribuyente_id: string
    c_regimen: string
    activo: boolean
}

interface Servicio {
    servicio_id: string
    nombre: string
    descripcion?: string
}

interface ClienteServicio {
    cliente_id: string
    servicio_id: string
    talla_id?: string
    activo: boolean
}

interface Team {
    team_id: string
    nombre: string
}

interface Talla {
    talla_id: string
    ponderacion: number
}

const SEGMENTOS = ['MICRO', 'PEQUEÑA', 'MEDIANA', 'GRANDE', 'CORPORATIVO']
const TALLAS = ['EXTRA_CHICA', 'CHICA', 'MEDIANA', 'GRANDE', 'EXTRA_GRANDE']

export default function TabClientes() {
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [contribuyentes, setContribuyentes] = useState<Record<string, Contribuyente[]>>({})
    const [regimenes, setRegimenes] = useState<Regimen[]>([])
    const [contribuyenteRegimenes, setContribuyenteRegimenes] = useState<Record<string, string[]>>({})
    const [servicios, setServicios] = useState<Servicio[]>([])
    const [clienteServicios, setClienteServicios] = useState<Record<string, ClienteServicio[]>>({})
    const [teams, setTeams] = useState<Team[]>([])
    const [tallas, setTallas] = useState<Talla[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<Cliente | null>(null)

    const [form, setForm] = useState({
        nombre_comercial: '', razon_social_principal: '', segmento: '',
        contacto_nombre: '', contacto_email: '', contacto_telefono: '', notas: ''
    })
    const [rfcForm, setRfcForm] = useState({ rfc: '', tipo_persona: 'PM', razon_social: '', cliente_id: '', team_id: '' })

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => { loadData() }, [])

    async function loadData() {
        setLoading(true)

        const [
            { data: clientesData },
            { data: ccData },
            { data: regData },
            { data: crData },
            { data: servData },
            { data: csData },
            { data: teamsData },
            { data: tallasData }
        ] = await Promise.all([
            supabase.from('cliente').select('*').eq('estado', 'ACTIVO').order('nombre_comercial'),
            supabase.from('cliente_contribuyente').select('cliente_id, contribuyente:contribuyente_id(*)'),
            supabase.from('regimen_fiscal').select('*').eq('activo', true).order('c_regimen'),
            supabase.from('contribuyente_regimen').select('*').eq('activo', true),
            supabase.from('servicio').select('*').eq('activo', true).order('nombre'),
            supabase.from('cliente_servicio').select('*').eq('activo', true),
            supabase.from('teams').select('*').eq('activo', true).order('nombre'),
            supabase.from('talla').select('*').eq('activo', true)
        ])

        setClientes(clientesData || [])
        setRegimenes(regData || [])
        setServicios(servData || [])
        setTeams(teamsData || [])
        setTallas(tallasData || [])

        // Map contribuyentes by cliente
        const contribMap: Record<string, Contribuyente[]> = {}
        ccData?.forEach((cc: any) => {
            if (!contribMap[cc.cliente_id]) contribMap[cc.cliente_id] = []
            if (cc.contribuyente) contribMap[cc.cliente_id].push(cc.contribuyente)
        })
        setContribuyentes(contribMap)

        // Map regimenes by contribuyente
        const crMap: Record<string, string[]> = {}
        crData?.forEach((cr: ContribuyenteRegimen) => {
            if (!crMap[cr.contribuyente_id]) crMap[cr.contribuyente_id] = []
            crMap[cr.contribuyente_id].push(cr.c_regimen)
        })
        setContribuyenteRegimenes(crMap)

        // Map servicios by cliente
        const csMap: Record<string, ClienteServicio[]> = {}
        csData?.forEach((cs: ClienteServicio) => {
            if (!csMap[cs.cliente_id]) csMap[cs.cliente_id] = []
            csMap[cs.cliente_id].push(cs)
        })
        setClienteServicios(csMap)

        setLoading(false)
    }

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
            .insert({
                rfc: rfcForm.rfc.toUpperCase(),
                tipo_persona: rfcForm.tipo_persona,
                razon_social: rfcForm.razon_social,
                team_id: rfcForm.team_id || null
            })
            .select().single()
        if (error) return alert('Error: ' + error.message)
        if (contrib) {
            await supabase.from('cliente_contribuyente').insert({ cliente_id: rfcForm.cliente_id, contribuyente_id: contrib.contribuyente_id })
        }
        setRfcForm({ rfc: '', tipo_persona: 'PM', razon_social: '', cliente_id: '', team_id: '' })
        loadData()
    }

    async function deleteRFC(contribuyenteId: string, clienteId: string) {
        if (!confirm('¿Eliminar RFC?')) return
        await supabase.from('cliente_contribuyente').delete().eq('cliente_id', clienteId).eq('contribuyente_id', contribuyenteId)
        loadData()
    }

    async function toggleRegimen(contribuyenteId: string, cRegimen: string, isActive: boolean) {
        if (isActive) {
            await supabase.from('contribuyente_regimen').delete()
                .eq('contribuyente_id', contribuyenteId)
                .eq('c_regimen', cRegimen)
        } else {
            await supabase.from('contribuyente_regimen').insert({
                contribuyente_id: contribuyenteId,
                c_regimen: cRegimen,
                activo: true
            })
        }
        loadData()
    }

    async function toggleServicio(clienteId: string, servicioId: string, isActive: boolean) {
        if (isActive) {
            await supabase.from('cliente_servicio').delete()
                .eq('cliente_id', clienteId)
                .eq('servicio_id', servicioId)
        } else {
            await supabase.from('cliente_servicio').insert({
                cliente_id: clienteId,
                servicio_id: servicioId,
                talla_id: 'MEDIANA',
                activo: true
            })
        }
        loadData()
    }

    async function updateServicioTalla(clienteId: string, servicioId: string, tallaId: string) {
        await supabase.from('cliente_servicio')
            .update({ talla_id: tallaId })
            .eq('cliente_id', clienteId)
            .eq('servicio_id', servicioId)
        loadData()
    }

    async function updateRFCTeam(contribuyenteId: string, teamId: string) {
        await supabase.from('contribuyente')
            .update({ team_id: teamId || null })
            .eq('contribuyente_id', contribuyenteId)
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

    function getServicioTalla(clienteId: string, servicioId: string): string | undefined {
        return clienteServicios[clienteId]?.find(cs => cs.servicio_id === servicioId)?.talla_id
    }

    function isServicioActive(clienteId: string, servicioId: string): boolean {
        return clienteServicios[clienteId]?.some(cs => cs.servicio_id === servicioId) || false
    }

    function getTeamName(teamId?: string): string {
        if (!teamId) return 'Sin asignar'
        return teams.find(t => t.team_id === teamId)?.nombre || 'Sin asignar'
    }

    function countObligaciones(clienteId: string): number {
        const rfcs = contribuyentes[clienteId] || []
        const allRegimenes = new Set<string>()
        rfcs.forEach(rfc => {
            (contribuyenteRegimenes[rfc.contribuyente_id] || []).forEach(r => allRegimenes.add(r))
        })
        return allRegimenes.size
    }

    if (loading) return <div className="text-center py-8 text-slate-500">Cargando clientes...</div>

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Clientes y Configuracion</h2>
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
                        <input placeholder="Razon Social" value={form.razon_social_principal} onChange={e => setForm({ ...form, razon_social_principal: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                        <select value={form.segmento} onChange={e => setForm({ ...form, segmento: e.target.value })} className="px-3 py-2 border rounded-lg text-slate-700">
                            <option value="">-- Segmento --</option>
                            {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input placeholder="Contacto: Nombre" value={form.contacto_nombre} onChange={e => setForm({ ...form, contacto_nombre: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                        <input placeholder="Contacto: Email" value={form.contacto_email} onChange={e => setForm({ ...form, contacto_email: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                        <input placeholder="Contacto: Telefono" value={form.contacto_telefono} onChange={e => setForm({ ...form, contacto_telefono: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
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
                                    <p className="text-xs text-slate-400">{c.razon_social_principal || 'Sin razon social'} {c.segmento && `| ${c.segmento}`}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <span className="text-xs bg-slate-100 px-2 py-1 rounded">{contribuyentes[c.cliente_id]?.length || 0} RFCs</span>
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">{clienteServicios[c.cliente_id]?.length || 0} Servicios</span>
                                <button onClick={() => editCliente(c)} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button>
                                <button onClick={() => deleteCliente(c.cliente_id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                        </div>

                        {expanded === c.cliente_id && (
                            <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-4">
                                {/* Contacto */}
                                {c.contacto_nombre && (
                                    <div className="bg-white p-3 rounded border border-slate-200">
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Contacto</p>
                                        <p className="text-sm">{c.contacto_nombre} {c.contacto_email && `| ${c.contacto_email}`} {c.contacto_telefono && `| ${c.contacto_telefono}`}</p>
                                    </div>
                                )}

                                {/* RFCs y Regimenes */}
                                <div className="bg-white p-3 rounded border border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                        <FileCheck size={14} /> RFCs y Regimenes Fiscales
                                    </p>
                                    {contribuyentes[c.cliente_id]?.map(rfc => (
                                        <div key={rfc.contribuyente_id} className="border border-slate-100 rounded p-3 mb-2 bg-slate-50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-mono text-sm font-medium">{rfc.rfc}</p>
                                                    <p className="text-xs text-slate-400">{rfc.razon_social} ({rfc.tipo_persona})</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={rfc.team_id || ''}
                                                        onChange={e => updateRFCTeam(rfc.contribuyente_id, e.target.value)}
                                                        className="text-xs px-2 py-1 border rounded bg-white text-slate-900 font-medium"
                                                    >
                                                        <option value="" className="text-slate-900">Sin equipo</option>
                                                        {teams.map(t => <option key={t.team_id} value={t.team_id} className="text-slate-900">{t.nombre}</option>)}
                                                    </select>
                                                    <button onClick={() => deleteRFC(rfc.contribuyente_id, c.cliente_id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {regimenes.filter(r => r.tipo_persona === rfc.tipo_persona || r.tipo_persona === 'AMBOS').map(reg => {
                                                    const isActive = contribuyenteRegimenes[rfc.contribuyente_id]?.includes(reg.c_regimen)
                                                    return (
                                                        <button
                                                            key={reg.c_regimen}
                                                            onClick={() => toggleRegimen(rfc.contribuyente_id, reg.c_regimen, isActive)}
                                                            className={`text-xs px-2 py-1 rounded border transition-colors ${
                                                                isActive
                                                                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-purple-300'
                                                            }`}
                                                        >
                                                            {reg.c_regimen}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    {(!contribuyentes[c.cliente_id] || contribuyentes[c.cliente_id].length === 0) && (
                                        <p className="text-sm text-slate-400 mb-2">Sin RFCs asociados</p>
                                    )}
                                    <div className="flex gap-2 mt-2 pt-2 border-t border-slate-200">
                                        <input placeholder="RFC *" value={rfcForm.cliente_id === c.cliente_id ? rfcForm.rfc : ''} onChange={e => setRfcForm({ ...rfcForm, rfc: e.target.value.toUpperCase(), cliente_id: c.cliente_id })} className="px-2 py-1 border rounded text-sm flex-1 font-mono placeholder:text-slate-500" maxLength={13} />
                                        <input placeholder="Razon Social *" value={rfcForm.cliente_id === c.cliente_id ? rfcForm.razon_social : ''} onChange={e => setRfcForm({ ...rfcForm, razon_social: e.target.value, cliente_id: c.cliente_id })} className="px-2 py-1 border rounded text-sm flex-1 placeholder:text-slate-500" />
                                        <select value={rfcForm.cliente_id === c.cliente_id ? rfcForm.tipo_persona : 'PM'} onChange={e => setRfcForm({ ...rfcForm, tipo_persona: e.target.value, cliente_id: c.cliente_id })} className="px-2 py-1 border rounded text-sm">
                                            <option value="PM">PM</option>
                                            <option value="PF">PF</option>
                                        </select>
                                        <select value={rfcForm.cliente_id === c.cliente_id ? rfcForm.team_id : ''} onChange={e => setRfcForm({ ...rfcForm, team_id: e.target.value, cliente_id: c.cliente_id })} className="px-2 py-1 border rounded text-sm text-slate-900 font-medium">
                                            <option value="" className="text-slate-900">Equipo...</option>
                                            {teams.map(t => <option key={t.team_id} value={t.team_id} className="text-slate-900">{t.nombre}</option>)}
                                        </select>
                                        <button onClick={saveRFC} disabled={rfcForm.cliente_id !== c.cliente_id || !rfcForm.rfc || !rfcForm.razon_social} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"><Plus size={16} /></button>
                                    </div>
                                </div>

                                {/* Servicios Contratados con Talla */}
                                <div className="bg-white p-3 rounded border border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                        <Tag size={14} /> Servicios Contratados y Tallas
                                    </p>
                                    <div className="space-y-2">
                                        {servicios.map(serv => {
                                            const isActive = isServicioActive(c.cliente_id, serv.servicio_id)
                                            const talla = getServicioTalla(c.cliente_id, serv.servicio_id)
                                            return (
                                                <div key={serv.servicio_id} className={`flex items-center justify-between p-2 rounded border ${isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={isActive}
                                                            onChange={() => toggleServicio(c.cliente_id, serv.servicio_id, isActive)}
                                                            className="w-4 h-4 rounded"
                                                        />
                                                        <span className={`text-sm ${isActive ? 'font-medium text-slate-800' : 'text-slate-500'}`}>
                                                            {serv.nombre}
                                                        </span>
                                                    </div>
                                                    {isActive && (
                                                        <select
                                                            value={talla || 'MEDIANA'}
                                                            onChange={e => updateServicioTalla(c.cliente_id, serv.servicio_id, e.target.value)}
                                                            className="text-xs px-2 py-1 border rounded bg-white"
                                                        >
                                                            {TALLAS.map(t => (
                                                                <option key={t} value={t}>{t.replace('_', ' ')}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            )
                                        })}
                                        {servicios.length === 0 && (
                                            <p className="text-sm text-slate-400">No hay servicios configurados. Ve a la pestana Servicios.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Resumen */}
                                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                    <p className="text-xs text-blue-700">
                                        <strong>Resumen:</strong> {contribuyentes[c.cliente_id]?.length || 0} RFCs | {clienteServicios[c.cliente_id]?.length || 0} servicios contratados | {countObligaciones(c.cliente_id)} regimenes fiscales activos
                                    </p>
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
