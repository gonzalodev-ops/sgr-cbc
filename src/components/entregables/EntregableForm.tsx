'use client'

import { useState, useEffect } from 'react'
import { Save, X } from 'lucide-react'

interface EntregableFormProps {
    editing: any | null
    onSave: (form: any) => Promise<void>
    onCancel: () => void
}

const TIPOS = ['OBLIGACION', 'OPERATIVO', 'OTRO']

export default function EntregableForm({ editing, onSave, onCancel }: EntregableFormProps) {
    const [form, setForm] = useState({
        entregable_id: '',
        nombre: '',
        descripcion: '',
        tipo: 'OPERATIVO' as 'OBLIGACION' | 'OPERATIVO' | 'OTRO'
    })

    useEffect(() => {
        if (editing) {
            setForm({
                entregable_id: editing.entregable_id,
                nombre: editing.nombre,
                descripcion: editing.descripcion || '',
                tipo: editing.tipo
            })
        } else {
            setForm({
                entregable_id: '',
                nombre: '',
                descripcion: '',
                tipo: 'OPERATIVO'
            })
        }
    }, [editing])

    const handleSave = async () => {
        if (!form.entregable_id || !form.nombre) {
            alert('ID y Nombre son requeridos')
            return
        }
        await onSave(form)
    }

    return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-green-800">
                    {editing ? 'Editar' : 'Nuevo'} Entregable
                </h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <input
                    placeholder="ID Entregable (ej: DEC_IVA) *"
                    value={form.entregable_id}
                    onChange={e => setForm({ ...form, entregable_id: e.target.value.toUpperCase() })}
                    disabled={!!editing}
                    className="px-3 py-2 border rounded-lg disabled:bg-slate-100 font-mono placeholder:text-slate-500"
                />
                <input
                    placeholder="Nombre *"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    className="px-3 py-2 border rounded-lg placeholder:text-slate-500"
                />
            </div>

            <textarea
                placeholder="Descripción (opcional)"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg placeholder:text-slate-500"
                rows={3}
            />

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo de Entregable
                </label>
                <div className="flex gap-3">
                    {TIPOS.map(tipo => (
                        <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="tipo"
                                value={tipo}
                                checked={form.tipo === tipo}
                                onChange={e => setForm({ ...form, tipo: e.target.value as any })}
                                className="w-4 h-4"
                            />
                            <span className="text-sm">{tipo}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    <Save size={18} /> Guardar
                </button>
                <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                >
                    Cancelar
                </button>
            </div>
        </div>
    )
}
