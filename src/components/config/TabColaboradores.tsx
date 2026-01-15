'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Pencil, Trash2, X, Save, Users, UserPlus } from 'lucide-react'

interface Usuario {
    user_id: string
    nombre: string
    email: string
    rol_global: string
    activo: boolean
    equipo?: string
    rol_en_equipo?: string
}

interface Team {
    team_id: string
    nombre: string
    activo: boolean
}

const ROLES_GLOBAL = ['COLABORADOR', 'LIDER', 'SOCIO', 'ADMIN', 'AUDITOR']
const ROLES_EQUIPO = ['LIDER', 'AUXILIAR_A', 'AUXILIAR_B', 'AUXILIAR_C']

export default function TabColaboradores() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [equipos, setEquipos] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)
    const [showUserForm, setShowUserForm] = useState(false)
    const [showTeamForm, setShowTeamForm] = useState(false)
    const [editingUser, setEditingUser] = useState<Usuario | null>(null)
    const [editingTeam, setEditingTeam] = useState<Team | null>(null)

    const [userForm, setUserForm] = useState({ nombre: '', email: '', rol_global: 'COLABORADOR', equipo_id: '', rol_en_equipo: '' })
    const [teamForm, setTeamForm] = useState({ nombre: '' })

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => { loadData() }, [])

    async function loadData() {
        setLoading(true)
        const { data: usersData } = await supabase.from('users').select(`*, team_members(team_id, rol_en_equipo, teams:team_id(nombre))`).order('nombre')
        setUsuarios((usersData || []).map((u: any) => ({
            ...u,
            equipo: u.team_members?.[0]?.teams?.nombre || '',
            rol_en_equipo: u.team_members?.[0]?.rol_en_equipo || ''
        })))

        const { data: teamsData } = await supabase.from('teams').select('*').eq('activo', true).order('nombre')
        setEquipos(teamsData || [])
        setLoading(false)
    }

    async function saveUser() {
        if (!editingUser) {
            // Para crear usuarios nuevos necesitamos API con service role
            const res = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userForm)
            })
            const result = await res.json()
            if (!result.success) return alert('Error: ' + result.error)
        } else {
            await supabase.from('users').update({ nombre: userForm.nombre, rol_global: userForm.rol_global }).eq('user_id', editingUser.user_id)
            // Actualizar equipo si cambió
            if (userForm.equipo_id) {
                await supabase.from('team_members').delete().eq('user_id', editingUser.user_id)
                await supabase.from('team_members').insert({ team_id: userForm.equipo_id, user_id: editingUser.user_id, rol_en_equipo: userForm.rol_en_equipo || 'AUXILIAR_C', activo: true })
            }
        }
        resetUserForm()
        loadData()
    }

    async function deleteUser(id: string) {
        if (!confirm('¿Desactivar usuario?')) return
        await supabase.from('users').update({ activo: false }).eq('user_id', id)
        loadData()
    }

    async function saveTeam() {
        if (!teamForm.nombre) return alert('Nombre requerido')
        if (editingTeam) {
            await supabase.from('teams').update({ nombre: teamForm.nombre }).eq('team_id', editingTeam.team_id)
        } else {
            await supabase.from('teams').insert({ nombre: teamForm.nombre, activo: true })
        }
        resetTeamForm()
        loadData()
    }

    async function deleteTeam(id: string) {
        if (!confirm('¿Eliminar equipo?')) return
        await supabase.from('teams').update({ activo: false }).eq('team_id', id)
        loadData()
    }

    function resetUserForm() {
        setUserForm({ nombre: '', email: '', rol_global: 'COLABORADOR', equipo_id: '', rol_en_equipo: '' })
        setEditingUser(null)
        setShowUserForm(false)
    }

    function resetTeamForm() {
        setTeamForm({ nombre: '' })
        setEditingTeam(null)
        setShowTeamForm(false)
    }

    function editUser(u: Usuario) {
        setUserForm({ nombre: u.nombre, email: u.email, rol_global: u.rol_global, equipo_id: '', rol_en_equipo: u.rol_en_equipo || '' })
        setEditingUser(u)
        setShowUserForm(true)
    }

    if (loading) return <div className="text-center py-8 text-slate-700">Cargando...</div>

    return (
        <div className="space-y-6">
            {/* EQUIPOS */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800">Equipos (Tribus)</h2>
                    <button onClick={() => { resetTeamForm(); setShowTeamForm(true) }} className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                        <Plus size={16} /> Nuevo Equipo
                    </button>
                </div>

                {showTeamForm && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs text-purple-700 font-medium">Nombre del Equipo *</label>
                            <input value={teamForm.nombre} onChange={e => setTeamForm({ nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg mt-1 placeholder:text-slate-500" placeholder="Ej: Equipo Isidora" />
                        </div>
                        <button onClick={saveTeam} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><Save size={18} /></button>
                        <button onClick={resetTeamForm} className="px-4 py-2 border border-slate-300 rounded-lg"><X size={18} /></button>
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {equipos.map(t => (
                        <div key={t.team_id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                            <Users size={16} className="text-purple-600" />
                            <span className="font-medium text-slate-800">{t.nombre}</span>
                            <button onClick={() => { setTeamForm({ nombre: t.nombre }); setEditingTeam(t); setShowTeamForm(true) }} className="p-1 text-slate-500 hover:text-blue-600"><Pencil size={14} /></button>
                            <button onClick={() => deleteTeam(t.team_id)} className="p-1 text-slate-500 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                    ))}
                    {equipos.length === 0 && <p className="text-slate-700 text-sm">No hay equipos. Crea uno.</p>}
                </div>
            </div>

            <hr className="border-slate-200" />

            {/* USUARIOS */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800">Colaboradores</h2>
                    <button onClick={() => { resetUserForm(); setShowUserForm(true) }} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                        <UserPlus size={16} /> Nuevo Colaborador
                    </button>
                </div>

                {showUserForm && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                            <h3 className="font-semibold text-blue-800">{editingUser ? 'Editar' : 'Nuevo'} Colaborador</h3>
                            <button onClick={resetUserForm}><X size={20} className="text-slate-500" /></button>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            <input placeholder="Nombre *" value={userForm.nombre} onChange={e => setUserForm({ ...userForm, nombre: e.target.value })} className="px-3 py-2 border rounded-lg placeholder:text-slate-500" />
                            <input placeholder="Email *" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} disabled={!!editingUser} className="px-3 py-2 border rounded-lg disabled:bg-slate-100 placeholder:text-slate-500" />
                            <select value={userForm.rol_global} onChange={e => setUserForm({ ...userForm, rol_global: e.target.value })} className="px-3 py-2 border rounded-lg">
                                {ROLES_GLOBAL.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <select value={userForm.equipo_id} onChange={e => setUserForm({ ...userForm, equipo_id: e.target.value })} className="px-3 py-2 border rounded-lg">
                                <option value="">-- Equipo --</option>
                                {equipos.map(t => <option key={t.team_id} value={t.team_id}>{t.nombre}</option>)}
                            </select>
                        </div>
                        {userForm.equipo_id && (
                            <select value={userForm.rol_en_equipo} onChange={e => setUserForm({ ...userForm, rol_en_equipo: e.target.value })} className="px-3 py-2 border rounded-lg">
                                <option value="">-- Rol en Equipo --</option>
                                {ROLES_EQUIPO.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        )}
                        {!editingUser && <p className="text-xs text-blue-700">Se enviará invitación por email al nuevo usuario.</p>}
                        <button onClick={saveUser} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save size={18} /> Guardar</button>
                    </div>
                )}

                <table className="w-full text-left bg-white rounded-lg overflow-hidden border border-slate-200">
                    <thead className="bg-slate-100 text-xs uppercase text-slate-800">
                        <tr>
                            <th className="p-3">Nombre</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Rol Global</th>
                            <th className="p-3">Equipo</th>
                            <th className="p-3">Rol Equipo</th>
                            <th className="p-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                        {usuarios.filter(u => u.activo).map(u => (
                            <tr key={u.user_id} className="hover:bg-slate-50">
                                <td className="p-3 font-medium">{u.nombre}</td>
                                <td className="p-3 text-slate-700">{u.email}</td>
                                <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${u.rol_global === 'ADMIN' ? 'bg-red-100 text-red-700' : u.rol_global === 'LIDER' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{u.rol_global}</span></td>
                                <td className="p-3">{u.equipo || '-'}</td>
                                <td className="p-3">{u.rol_en_equipo || '-'}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => editUser(u)} className="p-1 text-slate-500 hover:text-blue-600"><Pencil size={16} /></button>
                                    <button onClick={() => deleteUser(u.user_id)} className="p-1 text-slate-500 hover:text-red-600"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
