'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { FileCheck, Plus, Search } from 'lucide-react'
import EntregableForm from '@/components/entregables/EntregableForm'
import EntregableList from '@/components/entregables/EntregableList'

interface Entregable {
    entregable_id: string
    nombre: string
    descripcion?: string
    tipo: 'OBLIGACION' | 'OPERATIVO' | 'OTRO'
    activo: boolean
    entregable_obligacion?: Array<{
        id_obligacion: string
        peso_relativo?: number
    }>
}

export default function EntregablesPage() {
    const [entregables, setEntregables] = useState<Entregable[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<Entregable | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const { data } = await supabase
            .from('entregable')
            .select(`
                *,
                entregable_obligacion (
                    id_obligacion,
                    peso_relativo
                )
            `)
            .eq('activo', true)
            .order('nombre')

        setEntregables(data || [])
        setLoading(false)
    }

    async function saveEntregable(form: any) {
        if (editing) {
            // Update existing
            const { error } = await supabase
                .from('entregable')
                .update({
                    nombre: form.nombre,
                    descripcion: form.descripcion,
                    tipo: form.tipo
                })
                .eq('entregable_id', editing.entregable_id)

            if (error) {
                alert('Error al actualizar: ' + error.message)
                return
            }
        } else {
            // Create new
            const { error } = await supabase
                .from('entregable')
                .insert({
                    entregable_id: form.entregable_id,
                    nombre: form.nombre,
                    descripcion: form.descripcion,
                    tipo: form.tipo,
                    activo: true
                })

            if (error) {
                alert('Error al crear: ' + error.message)
                return
            }
        }

        resetForm()
        loadData()
    }

    async function deleteEntregable(id: string) {
        const { error } = await supabase
            .from('entregable')
            .update({ activo: false })
            .eq('entregable_id', id)

        if (error) {
            alert('Error al eliminar: ' + error.message)
            return
        }

        loadData()
    }

    function resetForm() {
        setShowForm(false)
        setEditing(null)
    }

    function handleEdit(entregable: Entregable) {
        setEditing(entregable)
        setShowForm(true)
    }

    function handleNewEntregable() {
        setEditing(null)
        setShowForm(true)
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <FileCheck size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Entregables</h1>
                            <p className="text-slate-500">Catálogo de servicios y documentos</p>
                        </div>
                    </div>
                </div>
                <div className="text-center py-8 text-slate-500">Cargando...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <FileCheck size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Entregables</h1>
                            <p className="text-slate-500">Catálogo de servicios y documentos</p>
                        </div>
                    </div>
                    <button
                        onClick={handleNewEntregable}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus size={18} /> Nuevo Entregable
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <EntregableForm
                    editing={editing}
                    onSave={saveEntregable}
                    onCancel={resetForm}
                />
            )}

            {/* List */}
            <EntregableList
                entregables={entregables}
                searchTerm={searchTerm}
                onEdit={handleEdit}
                onDelete={deleteEntregable}
                onObligacionUpdate={loadData}
            />

            {/* Stats */}
            {entregables.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>
                            Total de entregables: <strong>{entregables.length}</strong>
                        </span>
                        <div className="flex gap-4">
                            <span>
                                Obligación: <strong>{entregables.filter(e => e.tipo === 'OBLIGACION').length}</strong>
                            </span>
                            <span>
                                Operativo: <strong>{entregables.filter(e => e.tipo === 'OPERATIVO').length}</strong>
                            </span>
                            <span>
                                Otro: <strong>{entregables.filter(e => e.tipo === 'OTRO').length}</strong>
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
