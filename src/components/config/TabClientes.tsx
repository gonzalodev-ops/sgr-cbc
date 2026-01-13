'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Pencil, Trash2, X, Save, ChevronDown, ChevronUp, Building2, Tag, FileCheck, ChevronRight, ChevronLeft, Check } from 'lucide-react'

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

// Interfaces para el wizard
interface WizardRFC {
    rfc: string
    tipo_persona: string
    razon_social: string
    team_id: string
    regimenes: string[]
}

interface WizardServicio {
    servicio_id: string
    talla_id: string
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
    const [editing, setEditing] = useState<Cliente | null>(null)

    // Wizard state
    const [showWizard, setShowWizard] = useState(false)
    const [wizardStep, setWizardStep] = useState(1)
    const [saving, setSaving] = useState(false)

    // Wizard form data
    const [wizardCliente, setWizardCliente] = useState({
        nombre_comercial: '', razon_social_principal: '', segmento: '',
        contacto_nombre: '', contacto_email: '', contacto_telefono: '', notas: ''
    })
    const [wizardRFCs, setWizardRFCs] = useState<WizardRFC[]>([])
    const [wizardServicios, setWizardServicios] = useState<WizardServicio[]>([])

    // Temp RFC form in wizard
    const [tempRFC, setTempRFC] = useState<WizardRFC>({ rfc: '', tipo_persona: 'PM', razon_social: '', team_id: '', regimenes: [] })

    // For editing existing clients (inline)
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

        const contribMap: Record<string, Contribuyente[]> = {}
        ccData?.forEach((cc: any) => {
            if (!contribMap[cc.cliente_id]) contribMap[cc.cliente_id] = []
            if (cc.contribuyente) contribMap[cc.cliente_id].push(cc.contribuyente)
        })
        setContribuyentes(contribMap)

        const crMap: Record<string, string[]> = {}
        crData?.forEach((cr: ContribuyenteRegimen) => {
            if (!crMap[cr.contribuyente_id]) crMap[cr.contribuyente_id] = []
            crMap[cr.contribuyente_id].push(cr.c_regimen)
        })
        setContribuyenteRegimenes(crMap)

        const csMap: Record<string, ClienteServicio[]> = {}
        csData?.forEach((cs: ClienteServicio) => {
            if (!csMap[cs.cliente_id]) csMap[cs.cliente_id] = []
            csMap[cs.cliente_id].push(cs)
        })
        setClienteServicios(csMap)

        setLoading(false)
    }

    // ========== WIZARD FUNCTIONS ==========

    function openWizard() {
        setWizardCliente({ nombre_comercial: '', razon_social_principal: '', segmento: '', contacto_nombre: '', contacto_email: '', contacto_telefono: '', notas: '' })
        setWizardRFCs([])
        setWizardServicios([])
        setTempRFC({ rfc: '', tipo_persona: 'PM', razon_social: '', team_id: '', regimenes: [] })
        setWizardStep(1)
        setShowWizard(true)
    }

    function closeWizard() {
        setShowWizard(false)
        setWizardStep(1)
    }

    function addRFCToWizard() {
        if (!tempRFC.rfc || !tempRFC.razon_social) return alert('RFC y Razón Social son requeridos')
        if (tempRFC.regimenes.length === 0) return alert('Selecciona al menos un régimen fiscal')
        setWizardRFCs([...wizardRFCs, { ...tempRFC, rfc: tempRFC.rfc.toUpperCase() }])
        setTempRFC({ rfc: '', tipo_persona: 'PM', razon_social: '', team_id: '', regimenes: [] })
    }

    function removeRFCFromWizard(index: number) {
        setWizardRFCs(wizardRFCs.filter((_, i) => i !== index))
    }

    function toggleTempRegimen(cRegimen: string) {
        if (tempRFC.regimenes.includes(cRegimen)) {
            setTempRFC({ ...tempRFC, regimenes: tempRFC.regimenes.filter(r => r !== cRegimen) })
        } else {
            setTempRFC({ ...tempRFC, regimenes: [...tempRFC.regimenes, cRegimen] })
        }
    }

    function toggleWizardServicio(servicioId: string) {
        const exists = wizardServicios.find(s => s.servicio_id === servicioId)
        if (exists) {
            setWizardServicios(wizardServicios.filter(s => s.servicio_id !== servicioId))
        } else {
            setWizardServicios([...wizardServicios, { servicio_id: servicioId, talla_id: 'MEDIANA' }])
        }
    }

    function updateWizardServicioTalla(servicioId: string, tallaId: string) {
        setWizardServicios(wizardServicios.map(s =>
            s.servicio_id === servicioId ? { ...s, talla_id: tallaId } : s
        ))
    }

    async function saveWizard() {
        if (!wizardCliente.nombre_comercial) return alert('Nombre comercial es requerido')
        if (wizardRFCs.length === 0) return alert('Agrega al menos un RFC')
        if (wizardServicios.length === 0) return alert('Selecciona al menos un servicio')

        setSaving(true)
        try {
            // 1. Create cliente
            const { data: clienteData, error: clienteError } = await supabase
                .from('cliente')
                .insert({ ...wizardCliente, estado: 'ACTIVO' })
                .select()
                .single()

            if (clienteError) throw new Error('Error al crear cliente: ' + clienteError.message)

            const clienteId = clienteData.cliente_id

            // 2. Create RFCs and their relationships
            for (const rfc of wizardRFCs) {
                const { data: contribData, error: contribError } = await supabase
                    .from('contribuyente')
                    .insert({
                        rfc: rfc.rfc,
                        tipo_persona: rfc.tipo_persona,
                        razon_social: rfc.razon_social,
                        team_id: rfc.team_id || null
                    })
                    .select()
                    .single()

                if (contribError) throw new Error('Error al crear RFC: ' + contribError.message)

                // Link to cliente
                await supabase.from('cliente_contribuyente').insert({
                    cliente_id: clienteId,
                    contribuyente_id: contribData.contribuyente_id
                })

                // Add regimens
                for (const regimen of rfc.regimenes) {
                    await supabase.from('contribuyente_regimen').insert({
                        contribuyente_id: contribData.contribuyente_id,
                        c_regimen: regimen,
                        activo: true
                    })
                }
            }

            // 3. Create servicios
            for (const serv of wizardServicios) {
                await supabase.from('cliente_servicio').insert({
                    cliente_id: clienteId,
                    servicio_id: serv.servicio_id,
                    talla_id: serv.talla_id,
                    activo: true
                })
            }

            alert('Cliente creado exitosamente')
            closeWizard()
            loadData()
        } catch (error) {
            alert((error as Error).message)
        } finally {
            setSaving(false)
        }
    }

    // ========== INLINE EDIT FUNCTIONS (for existing clients) ==========

    async function saveClienteEdit() {
        if (!editing || !wizardCliente.nombre_comercial) return
        const { error } = await supabase.from('cliente').update(wizardCliente).eq('cliente_id', editing.cliente_id)
        if (error) return alert('Error al actualizar: ' + error.message)
        setEditing(null)
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
            await supabase.from('contribuyente_regimen').delete().eq('contribuyente_id', contribuyenteId).eq('c_regimen', cRegimen)
        } else {
            await supabase.from('contribuyente_regimen').insert({ contribuyente_id: contribuyenteId, c_regimen: cRegimen, activo: true })
        }
        loadData()
    }

    async function toggleServicio(clienteId: string, servicioId: string, isActive: boolean) {
        if (isActive) {
            await supabase.from('cliente_servicio').delete().eq('cliente_id', clienteId).eq('servicio_id', servicioId)
        } else {
            await supabase.from('cliente_servicio').insert({ cliente_id: clienteId, servicio_id: servicioId, talla_id: 'MEDIANA', activo: true })
        }
        loadData()
    }

    async function updateServicioTalla(clienteId: string, servicioId: string, tallaId: string) {
        await supabase.from('cliente_servicio').update({ talla_id: tallaId }).eq('cliente_id', clienteId).eq('servicio_id', servicioId)
        loadData()
    }

    async function updateRFCTeam(contribuyenteId: string, teamId: string) {
        await supabase.from('contribuyente').update({ team_id: teamId || null }).eq('contribuyente_id', contribuyenteId)
        loadData()
    }

    function editCliente(c: Cliente) {
        setWizardCliente({
            nombre_comercial: c.nombre_comercial,
            razon_social_principal: c.razon_social_principal || '',
            segmento: c.segmento || '',
            contacto_nombre: c.contacto_nombre || '',
            contacto_email: c.contacto_email || '',
            contacto_telefono: c.contacto_telefono || '',
            notas: c.notas || ''
        })
        setEditing(c)
    }

    function getServicioTalla(clienteId: string, servicioId: string): string | undefined {
        return clienteServicios[clienteId]?.find(cs => cs.servicio_id === servicioId)?.talla_id
    }

    function isServicioActive(clienteId: string, servicioId: string): boolean {
        return clienteServicios[clienteId]?.some(cs => cs.servicio_id === servicioId) || false
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

    // ========== WIZARD UI ==========
    if (showWizard) {
        return (
            <div className="space-y-4">
                {/* Header con pasos */}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Nuevo Cliente</h2>
                        <button onClick={closeWizard} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>

                    {/* Progress steps */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {[1, 2, 3].map(step => (
                            <div key={step} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    wizardStep === step ? 'bg-blue-600 text-white' :
                                    wizardStep > step ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                                }`}>
                                    {wizardStep > step ? <Check size={16} /> : step}
                                </div>
                                <span className={`ml-2 text-sm ${wizardStep === step ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
                                    {step === 1 ? 'Datos Cliente' : step === 2 ? 'RFCs' : 'Servicios'}
                                </span>
                                {step < 3 && <ChevronRight size={16} className="mx-4 text-slate-300" />}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Datos del cliente */}
                    {wizardStep === 1 && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 mb-4">Ingresa los datos generales del cliente</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Comercial *</label>
                                    <input value={wizardCliente.nombre_comercial} onChange={e => setWizardCliente({ ...wizardCliente, nombre_comercial: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Ej: Mi Empresa" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
                                    <input value={wizardCliente.razon_social_principal} onChange={e => setWizardCliente({ ...wizardCliente, razon_social_principal: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Ej: Mi Empresa S.A. de C.V." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Segmento</label>
                                    <select value={wizardCliente.segmento} onChange={e => setWizardCliente({ ...wizardCliente, segmento: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                                        <option value="">-- Seleccionar --</option>
                                        {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contacto: Nombre</label>
                                    <input value={wizardCliente.contacto_nombre} onChange={e => setWizardCliente({ ...wizardCliente, contacto_nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Nombre del contacto" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contacto: Email</label>
                                    <input type="email" value={wizardCliente.contacto_email} onChange={e => setWizardCliente({ ...wizardCliente, contacto_email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="email@ejemplo.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contacto: Teléfono</label>
                                    <input type="tel" value={wizardCliente.contacto_telefono} onChange={e => setWizardCliente({ ...wizardCliente, contacto_telefono: e.target.value.replace(/[^0-9+\-() ]/g, '') })} className="w-full px-3 py-2 border rounded-lg" placeholder="(55) 1234-5678" maxLength={15} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                                <textarea value={wizardCliente.notas} onChange={e => setWizardCliente({ ...wizardCliente, notas: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Notas adicionales..." />
                            </div>
                        </div>
                    )}

                    {/* Step 2: RFCs */}
                    {wizardStep === 2 && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 mb-4">Agrega los RFCs (contribuyentes) del cliente y sus regímenes fiscales</p>

                            {/* RFCs agregados */}
                            {wizardRFCs.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase">RFCs agregados ({wizardRFCs.length})</p>
                                    {wizardRFCs.map((rfc, idx) => (
                                        <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-start">
                                            <div>
                                                <p className="font-mono font-medium">{rfc.rfc} <span className="text-xs text-slate-500">({rfc.tipo_persona})</span></p>
                                                <p className="text-sm text-slate-600">{rfc.razon_social}</p>
                                                <p className="text-xs text-slate-500">Regímenes: {rfc.regimenes.join(', ')}</p>
                                            </div>
                                            <button onClick={() => removeRFCFromWizard(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Formulario para agregar RFC */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                <p className="text-sm font-medium text-blue-800">Agregar RFC</p>
                                <div className="grid grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">RFC *</label>
                                        <input value={tempRFC.rfc} onChange={e => setTempRFC({ ...tempRFC, rfc: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border rounded-lg font-mono" maxLength={13} placeholder="XAXX010101000" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">Tipo</label>
                                        <select value={tempRFC.tipo_persona} onChange={e => setTempRFC({ ...tempRFC, tipo_persona: e.target.value, regimenes: [] })} className="w-full px-3 py-2 border rounded-lg">
                                            <option value="PM">Persona Moral</option>
                                            <option value="PF">Persona Física</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">Razón Social *</label>
                                        <input value={tempRFC.razon_social} onChange={e => setTempRFC({ ...tempRFC, razon_social: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Nombre o razón social" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">Equipo</label>
                                        <select value={tempRFC.team_id} onChange={e => setTempRFC({ ...tempRFC, team_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                                            <option value="">Sin asignar</option>
                                            {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.nombre}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Regímenes fiscales */}
                                <div>
                                    <label className="block text-xs text-slate-600 mb-2">Regímenes Fiscales * (selecciona al menos uno)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {regimenes.filter(r => r.tipo_persona === tempRFC.tipo_persona || r.tipo_persona === 'AMBOS').map(reg => (
                                            <button
                                                key={reg.c_regimen}
                                                type="button"
                                                onClick={() => toggleTempRegimen(reg.c_regimen)}
                                                className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                                                    tempRFC.regimenes.includes(reg.c_regimen)
                                                        ? 'bg-purple-100 border-purple-300 text-purple-700'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'
                                                }`}
                                            >
                                                {reg.c_regimen} - {reg.descripcion}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button type="button" onClick={addRFCToWizard} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    <Plus size={16} /> Agregar RFC
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Servicios */}
                    {wizardStep === 3 && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 mb-4">Selecciona los servicios que el cliente tiene contratados</p>

                            <div className="space-y-2">
                                {servicios.map(serv => {
                                    const selected = wizardServicios.find(s => s.servicio_id === serv.servicio_id)
                                    return (
                                        <div key={serv.servicio_id} className={`flex items-center justify-between p-3 rounded-lg border ${selected ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selected}
                                                    onChange={() => toggleWizardServicio(serv.servicio_id)}
                                                    className="w-5 h-5 rounded"
                                                />
                                                <div>
                                                    <p className={`font-medium ${selected ? 'text-slate-800' : 'text-slate-600'}`}>{serv.nombre}</p>
                                                    {serv.descripcion && <p className="text-xs text-slate-500">{serv.descripcion}</p>}
                                                </div>
                                            </div>
                                            {selected && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">Talla:</span>
                                                    <select
                                                        value={selected.talla_id}
                                                        onChange={e => updateWizardServicioTalla(serv.servicio_id, e.target.value)}
                                                        className="text-sm px-2 py-1 border rounded"
                                                    >
                                                        {TALLAS.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {servicios.length === 0 && (
                                    <p className="text-sm text-slate-400 text-center py-4">No hay servicios configurados. Ve a la pestaña Servicios primero.</p>
                                )}
                            </div>

                            {/* Resumen */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                <p className="text-sm font-medium text-blue-800 mb-2">Resumen</p>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>Cliente: <strong>{wizardCliente.nombre_comercial}</strong></li>
                                    <li>RFCs: <strong>{wizardRFCs.length}</strong></li>
                                    <li>Servicios: <strong>{wizardServicios.length}</strong></li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex justify-between mt-6 pt-4 border-t border-slate-200">
                        <button
                            onClick={() => wizardStep > 1 ? setWizardStep(wizardStep - 1) : closeWizard()}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                            <ChevronLeft size={16} /> {wizardStep === 1 ? 'Cancelar' : 'Anterior'}
                        </button>

                        {wizardStep < 3 ? (
                            <button
                                onClick={() => {
                                    if (wizardStep === 1 && !wizardCliente.nombre_comercial) return alert('Nombre comercial es requerido')
                                    if (wizardStep === 2 && wizardRFCs.length === 0) return alert('Agrega al menos un RFC')
                                    setWizardStep(wizardStep + 1)
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Siguiente <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={saveWizard}
                                disabled={saving || wizardServicios.length === 0}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                <Save size={16} /> {saving ? 'Guardando...' : 'Crear Cliente'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // ========== MAIN LIST UI ==========
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Clientes y Configuración</h2>
                <button onClick={openWizard} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus size={18} /> Nuevo Cliente
                </button>
            </div>

            {/* Edit inline form */}
            {editing && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-amber-800">Editar Cliente: {editing.nombre_comercial}</h3>
                        <button onClick={() => setEditing(null)}><X size={20} className="text-slate-400" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <input placeholder="Nombre Comercial *" value={wizardCliente.nombre_comercial} onChange={e => setWizardCliente({ ...wizardCliente, nombre_comercial: e.target.value })} className="px-3 py-2 border rounded-lg" />
                        <input placeholder="Razón Social" value={wizardCliente.razon_social_principal} onChange={e => setWizardCliente({ ...wizardCliente, razon_social_principal: e.target.value })} className="px-3 py-2 border rounded-lg" />
                        <select value={wizardCliente.segmento} onChange={e => setWizardCliente({ ...wizardCliente, segmento: e.target.value })} className="px-3 py-2 border rounded-lg">
                            <option value="">-- Segmento --</option>
                            {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input placeholder="Contacto: Nombre" value={wizardCliente.contacto_nombre} onChange={e => setWizardCliente({ ...wizardCliente, contacto_nombre: e.target.value })} className="px-3 py-2 border rounded-lg" />
                        <input placeholder="Contacto: Email" value={wizardCliente.contacto_email} onChange={e => setWizardCliente({ ...wizardCliente, contacto_email: e.target.value })} className="px-3 py-2 border rounded-lg" />
                        <input type="tel" placeholder="Contacto: Teléfono" value={wizardCliente.contacto_telefono} onChange={e => setWizardCliente({ ...wizardCliente, contacto_telefono: e.target.value.replace(/[^0-9+\-() ]/g, '') })} className="px-3 py-2 border rounded-lg" maxLength={15} />
                    </div>
                    <textarea placeholder="Notas" value={wizardCliente.notas} onChange={e => setWizardCliente({ ...wizardCliente, notas: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} />
                    <button onClick={saveClienteEdit} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"><Save size={18} /> Guardar Cambios</button>
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
                                    <p className="text-xs text-slate-400">{c.razon_social_principal || 'Sin razón social'} {c.segmento && `| ${c.segmento}`}</p>
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

                                {/* RFCs y Regímenes */}
                                <div className="bg-white p-3 rounded border border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                        <FileCheck size={14} /> RFCs y Regímenes Fiscales
                                    </p>
                                    {contribuyentes[c.cliente_id]?.map(rfc => (
                                        <div key={rfc.contribuyente_id} className="border border-slate-100 rounded p-3 mb-2 bg-slate-50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-mono text-sm font-medium">{rfc.rfc}</p>
                                                    <p className="text-xs text-slate-400">{rfc.razon_social} ({rfc.tipo_persona})</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <select value={rfc.team_id || ''} onChange={e => updateRFCTeam(rfc.contribuyente_id, e.target.value)} className="text-xs px-2 py-1 border rounded bg-white">
                                                        <option value="">Sin equipo</option>
                                                        {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.nombre}</option>)}
                                                    </select>
                                                    <button onClick={() => deleteRFC(rfc.contribuyente_id, c.cliente_id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {regimenes.filter(r => r.tipo_persona === rfc.tipo_persona || r.tipo_persona === 'AMBOS').map(reg => {
                                                    const isActive = contribuyenteRegimenes[rfc.contribuyente_id]?.includes(reg.c_regimen)
                                                    return (
                                                        <button key={reg.c_regimen} onClick={() => toggleRegimen(rfc.contribuyente_id, reg.c_regimen, isActive)} className={`text-xs px-2 py-1 rounded border transition-colors ${isActive ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-white border-slate-200 text-slate-500 hover:border-purple-300'}`}>
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
                                        <input placeholder="RFC *" value={rfcForm.cliente_id === c.cliente_id ? rfcForm.rfc : ''} onChange={e => setRfcForm({ ...rfcForm, rfc: e.target.value.toUpperCase(), cliente_id: c.cliente_id })} className="px-2 py-1 border rounded text-sm flex-1 font-mono" maxLength={13} />
                                        <input placeholder="Razón Social *" value={rfcForm.cliente_id === c.cliente_id ? rfcForm.razon_social : ''} onChange={e => setRfcForm({ ...rfcForm, razon_social: e.target.value, cliente_id: c.cliente_id })} className="px-2 py-1 border rounded text-sm flex-1" />
                                        <select value={rfcForm.cliente_id === c.cliente_id ? rfcForm.tipo_persona : 'PM'} onChange={e => setRfcForm({ ...rfcForm, tipo_persona: e.target.value, cliente_id: c.cliente_id })} className="px-2 py-1 border rounded text-sm">
                                            <option value="PM">PM</option>
                                            <option value="PF">PF</option>
                                        </select>
                                        <select value={rfcForm.cliente_id === c.cliente_id ? rfcForm.team_id : ''} onChange={e => setRfcForm({ ...rfcForm, team_id: e.target.value, cliente_id: c.cliente_id })} className="px-2 py-1 border rounded text-sm">
                                            <option value="">Equipo...</option>
                                            {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.nombre}</option>)}
                                        </select>
                                        <button onClick={saveRFC} disabled={rfcForm.cliente_id !== c.cliente_id || !rfcForm.rfc || !rfcForm.razon_social} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"><Plus size={16} /></button>
                                    </div>
                                </div>

                                {/* Servicios Contratados */}
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
                                                        <input type="checkbox" checked={isActive} onChange={() => toggleServicio(c.cliente_id, serv.servicio_id, isActive)} className="w-4 h-4 rounded" />
                                                        <span className={`text-sm ${isActive ? 'font-medium text-slate-800' : 'text-slate-500'}`}>{serv.nombre}</span>
                                                    </div>
                                                    {isActive && (
                                                        <select value={talla || 'MEDIANA'} onChange={e => updateServicioTalla(c.cliente_id, serv.servicio_id, e.target.value)} className="text-xs px-2 py-1 border rounded bg-white">
                                                            {TALLAS.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                                                        </select>
                                                    )}
                                                </div>
                                            )
                                        })}
                                        {servicios.length === 0 && <p className="text-sm text-slate-400">No hay servicios configurados.</p>}
                                    </div>
                                </div>

                                {/* Resumen */}
                                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                    <p className="text-xs text-blue-700">
                                        <strong>Resumen:</strong> {contribuyentes[c.cliente_id]?.length || 0} RFCs | {clienteServicios[c.cliente_id]?.length || 0} servicios | {countObligaciones(c.cliente_id)} regímenes
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {clientes.length === 0 && <p className="text-center text-slate-400 py-8">No hay clientes. Haz clic en "Nuevo Cliente" para agregar uno.</p>}
            </div>
        </div>
    )
}
