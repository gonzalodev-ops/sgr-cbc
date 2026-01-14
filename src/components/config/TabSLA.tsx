'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Save, Clock, Pause, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface SlaConfig {
    sla_config_id: string
    estado: string
    descripcion: string
    sla_activo: boolean
    sla_pausado: boolean
    dias_sla_default?: number
    orden_flujo: number
    es_estado_final: boolean
    color_ui?: string
    activo: boolean
}

const COLORES = [
    { id: 'slate', label: 'Gris', class: 'bg-slate-500' },
    { id: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { id: 'amber', label: 'Amarillo', class: 'bg-amber-500' },
    { id: 'purple', label: 'Morado', class: 'bg-purple-500' },
    { id: 'red', label: 'Rojo', class: 'bg-red-500' },
    { id: 'teal', label: 'Teal', class: 'bg-teal-500' },
    { id: 'green', label: 'Verde', class: 'bg-green-500' },
]

export default function TabSLA() {
    const [configs, setConfigs] = useState<SlaConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => { loadData() }, [])

    async function loadData() {
        setLoading(true)
        const { data } = await supabase
            .from('sla_config')
            .select('*')
            .eq('activo', true)
            .order('orden_flujo')
        setConfigs(data || [])
        setLoading(false)
    }

    async function updateConfig(id: string, field: string, value: any) {
        setSaving(id)
        await supabase
            .from('sla_config')
            .update({ [field]: value })
            .eq('sla_config_id', id)
        await loadData()
        setSaving(null)
    }

    function getColorClass(colorId?: string): string {
        return COLORES.find(c => c.id === colorId)?.class || 'bg-slate-500'
    }

    function getStatusIcon(config: SlaConfig) {
        if (config.es_estado_final) return <CheckCircle size={16} className="text-green-600" />
        if (config.sla_pausado) return <Pause size={16} className="text-amber-600" />
        if (config.sla_activo) return <Clock size={16} className="text-blue-600" />
        return <XCircle size={16} className="text-slate-400" />
    }

    function getStatusLabel(config: SlaConfig): string {
        if (config.es_estado_final) return 'Final'
        if (config.sla_pausado) return 'Pausa SLA'
        if (config.sla_activo) return 'Cuenta SLA'
        return 'Sin SLA'
    }

    if (loading) return <div className="text-center py-8 text-slate-700">Cargando...</div>

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">Configuracion de SLA por Estado</h2>
                    <p className="text-sm text-slate-700">Define como se comporta el SLA en cada estado de tarea</p>
                </div>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1"><Clock size={14} className="text-blue-600" /> Cuenta tiempo</div>
                    <div className="flex items-center gap-1"><Pause size={14} className="text-amber-600" /> Pausa</div>
                    <div className="flex items-center gap-1"><CheckCircle size={14} className="text-green-600" /> Final</div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="p-3 text-left w-8">#</th>
                            <th className="p-3 text-left">Estado</th>
                            <th className="p-3 text-left">Descripcion</th>
                            <th className="p-3 text-center">SLA Activo</th>
                            <th className="p-3 text-center">Pausa SLA</th>
                            <th className="p-3 text-center">Dias Limite</th>
                            <th className="p-3 text-center">Es Final</th>
                            <th className="p-3 text-center">Color</th>
                            <th className="p-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {configs.map((config, index) => (
                            <tr key={config.sla_config_id} className={`hover:bg-slate-50 ${saving === config.sla_config_id ? 'opacity-50' : ''}`}>
                                <td className="p-3 text-slate-600 text-sm">{config.orden_flujo}</td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${getColorClass(config.color_ui)}`} />
                                        <span className="font-mono text-sm font-medium">{config.estado}</span>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <input
                                        type="text"
                                        value={config.descripcion}
                                        onChange={e => updateConfig(config.sla_config_id, 'descripcion', e.target.value)}
                                        className="w-full px-2 py-1 border rounded text-sm bg-transparent hover:bg-white focus:bg-white"
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={config.sla_activo}
                                        onChange={e => updateConfig(config.sla_config_id, 'sla_activo', e.target.checked)}
                                        disabled={config.es_estado_final}
                                        className="w-4 h-4 rounded"
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={config.sla_pausado}
                                        onChange={e => updateConfig(config.sla_config_id, 'sla_pausado', e.target.checked)}
                                        disabled={config.es_estado_final}
                                        className="w-4 h-4 rounded"
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <input
                                        type="number"
                                        value={config.dias_sla_default || ''}
                                        onChange={e => updateConfig(config.sla_config_id, 'dias_sla_default', e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder="-"
                                        min={1}
                                        max={365}
                                        className="w-16 px-2 py-1 border rounded text-sm text-center"
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={config.es_estado_final}
                                        onChange={e => updateConfig(config.sla_config_id, 'es_estado_final', e.target.checked)}
                                        className="w-4 h-4 rounded"
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <select
                                        value={config.color_ui || 'slate'}
                                        onChange={e => updateConfig(config.sla_config_id, 'color_ui', e.target.value)}
                                        className="px-2 py-1 border rounded text-sm"
                                    >
                                        {COLORES.map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        {getStatusIcon(config)}
                                        <span className="text-xs text-slate-700">{getStatusLabel(config)}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Flujo de Estados</h4>
                <div className="flex flex-wrap gap-2 items-center">
                    {configs.map((config, index) => (
                        <div key={config.sla_config_id} className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getColorClass(config.color_ui)}`}>
                                {config.estado}
                            </div>
                            {index < configs.length - 1 && (
                                <span className="text-slate-600">→</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={18} className="text-blue-600" />
                        <span className="font-medium">SLA Activo</span>
                    </div>
                    <p className="text-slate-700 text-xs">
                        El tiempo cuenta para el calculo del SLA. Si la tarea permanece demasiado tiempo en este estado, se considera retrasada.
                    </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Pause size={18} className="text-amber-600" />
                        <span className="font-medium">Pausa SLA</span>
                    </div>
                    <p className="text-slate-700 text-xs">
                        El tiempo NO cuenta. Util para estados como "bloqueado_cliente" donde la demora no es responsabilidad del equipo.
                    </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={18} className="text-green-600" />
                        <span className="font-medium">Estado Final</span>
                    </div>
                    <p className="text-slate-700 text-xs">
                        La tarea esta completada. Ya no cuenta tiempo y no puede cambiar a otro estado (excepto rechazado).
                    </p>
                </div>
            </div>
        </div>
    )
}
