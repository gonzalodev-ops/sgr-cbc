'use client'

import { useState, useEffect } from 'react'
import { Database, AlertCircle, Play, CheckCircle, XCircle, Trash2, Calendar, Clock, Settings } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface GeneracionResult {
    success: boolean
    mensaje: string
    errores?: string[]
    stats?: { tareas: number; pasos: number }
}

interface DeletePreview {
    periodo: string
    tareas: number
    pasos: number
    mensaje: string
}

interface AutoGenConfig {
    habilitado: boolean
    dia_ejecucion: number
    hora_ejecucion: string
    ultimo_periodo_generado: string | null
    updated_at: string | null
}

export default function TabDatos() {
    const [periodo, setPeriodo] = useState('')
    const [generando, setGenerando] = useState(false)
    const [resultado, setResultado] = useState<GeneracionResult | null>(null)
    const [log, setLog] = useState<string[]>([])

    // Estado para eliminación
    const [periodoEliminar, setPeriodoEliminar] = useState('')
    const [eliminando, setEliminando] = useState(false)
    const [deletePreview, setDeletePreview] = useState<DeletePreview | null>(null)
    const [loadingPreview, setLoadingPreview] = useState(false)

    // Estado para auto-generación
    const [autoGenConfig, setAutoGenConfig] = useState<AutoGenConfig>({
        habilitado: false,
        dia_ejecucion: 1,
        hora_ejecucion: '06:00',
        ultimo_periodo_generado: null,
        updated_at: null
    })
    const [guardandoConfig, setGuardandoConfig] = useState(false)

    // Cargar configuración de auto-generación al montar
    useEffect(() => {
        loadAutoGenConfig()
    }, [])

    async function loadAutoGenConfig() {
        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { data, error } = await supabase
                .from('config_sistema')
                .select('*')
                .eq('clave', 'auto_gen_tareas')
                .single()

            if (data && !error) {
                const valor = data.valor as AutoGenConfig
                setAutoGenConfig({
                    habilitado: valor.habilitado || false,
                    dia_ejecucion: valor.dia_ejecucion || 1,
                    hora_ejecucion: valor.hora_ejecucion || '06:00',
                    ultimo_periodo_generado: valor.ultimo_periodo_generado || null,
                    updated_at: data.updated_at
                })
            }
        } catch (error) {
            console.error('Error cargando config:', error)
        }
    }

    async function handleGenerarTareas() {
        if (!periodo) return alert('Selecciona un período')

        setGenerando(true)
        setResultado(null)
        setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - Iniciando generación para ${periodo}...`])

        try {
            const response = await fetch('/api/engine/generate-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ periodo })
            })

            const result = await response.json()

            setResultado({
                success: result.success,
                mensaje: result.mensaje || result.error || 'Proceso completado',
                errores: result.errores,
                stats: result.stats
            })

            setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${result.success ? '✓' : '✗'} ${result.mensaje || result.error}`])

        } catch (error) {
            setResultado({
                success: false,
                mensaje: `Error: ${(error as Error).message}`
            })
            setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ✗ Error: ${(error as Error).message}`])
        }

        setGenerando(false)
    }

    // Preview de eliminación
    async function handlePreviewDelete() {
        if (!periodoEliminar) return

        setLoadingPreview(true)
        setDeletePreview(null)

        try {
            const response = await fetch(`/api/engine/delete-tasks?periodo=${periodoEliminar}`)
            const data = await response.json()

            if (response.ok) {
                setDeletePreview(data)
            } else {
                alert(data.error || 'Error obteniendo preview')
            }
        } catch (error) {
            alert(`Error: ${(error as Error).message}`)
        }

        setLoadingPreview(false)
    }

    // Eliminar tareas
    async function handleEliminarTareas() {
        if (!periodoEliminar) return

        if (!confirm(`¿Estás seguro de eliminar ${deletePreview?.tareas || 0} tareas del período ${periodoEliminar}? Esta acción no se puede deshacer.`)) {
            return
        }

        setEliminando(true)
        setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - Eliminando tareas de ${periodoEliminar}...`])

        try {
            const response = await fetch(`/api/engine/delete-tasks?periodo=${periodoEliminar}`, {
                method: 'DELETE'
            })

            const result = await response.json()

            if (response.ok && result.success) {
                setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ✓ ${result.mensaje}`])
                setDeletePreview(null)
                setPeriodoEliminar('')
            } else {
                setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ✗ ${result.error || 'Error eliminando'}`])
            }
        } catch (error) {
            setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ✗ Error: ${(error as Error).message}`])
        }

        setEliminando(false)
    }

    // Guardar configuración de auto-generación
    async function handleGuardarAutoGen() {
        setGuardandoConfig(true)

        try {
            const response = await fetch('/api/engine/auto-gen-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(autoGenConfig)
            })

            const result = await response.json()

            if (response.ok && result.success) {
                setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ✓ Configuración de auto-generación guardada`])
                setAutoGenConfig(prev => ({ ...prev, updated_at: new Date().toISOString() }))
            } else {
                setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ✗ ${result.error || 'Error guardando'}`])
            }
        } catch (error) {
            setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ✗ Error: ${(error as Error).message}`])
        }

        setGuardandoConfig(false)
    }

    return (
        <div className="space-y-6">
            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-amber-600 mt-0.5" size={20} />
                <div>
                    <p className="font-medium text-amber-800">Zona de Administración</p>
                    <p className="text-sm text-amber-700 mt-1">
                        Estas acciones afectan directamente la base de datos. Usa con precaución.
                    </p>
                </div>
            </div>

            {/* Generar Tareas */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Database className="text-blue-600" size={20} />
                    Generar Tareas para Período
                </h3>

                <p className="text-sm text-slate-700 mb-4">
                    Genera las tareas mensuales para todos los RFCs activos según sus regímenes,
                    servicios contratados y obligaciones fiscales correspondientes.
                </p>

                <div className="flex gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Período Fiscal
                        </label>
                        <input
                            type="month"
                            value={periodo}
                            onChange={(e) => setPeriodo(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={handleGenerarTareas}
                        disabled={generando || !periodo}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {generando ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Generando...
                            </>
                        ) : (
                            <>
                                <Play size={18} />
                                Generar Tareas
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Eliminar Tareas */}
            <div className="bg-white border border-red-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Trash2 className="text-red-600" size={20} />
                    Eliminar Tareas de Período
                </h3>

                <p className="text-sm text-slate-700 mb-4">
                    Elimina todas las tareas generadas para un período específico. Esto también eliminará
                    los pasos, eventos y documentos asociados.
                </p>

                <div className="flex gap-4 items-end flex-wrap">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Período a Eliminar
                        </label>
                        <input
                            type="month"
                            value={periodoEliminar}
                            onChange={(e) => {
                                setPeriodoEliminar(e.target.value)
                                setDeletePreview(null)
                            }}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <button
                        onClick={handlePreviewDelete}
                        disabled={loadingPreview || !periodoEliminar}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                    >
                        {loadingPreview ? 'Consultando...' : 'Ver Preview'}
                    </button>
                    {deletePreview && deletePreview.tareas > 0 && (
                        <button
                            onClick={handleEliminarTareas}
                            disabled={eliminando}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {eliminando ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={18} />
                                    Eliminar {deletePreview.tareas} Tareas
                                </>
                            )}
                        </button>
                    )}
                </div>

                {deletePreview && (
                    <div className={`mt-4 p-3 rounded-lg ${deletePreview.tareas > 0 ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-200'}`}>
                        <p className={`text-sm ${deletePreview.tareas > 0 ? 'text-red-700' : 'text-slate-700'}`}>
                            {deletePreview.mensaje}
                        </p>
                    </div>
                )}
            </div>

            {/* Resultado de generación */}
            {resultado && (
                <div className={`rounded-lg p-4 flex items-start gap-3 ${resultado.success
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                    {resultado.success
                        ? <CheckCircle className="text-green-600 mt-0.5" size={20} />
                        : <XCircle className="text-red-600 mt-0.5" size={20} />
                    }
                    <div className="flex-1">
                        <p className={`font-medium ${resultado.success ? 'text-green-800' : 'text-red-800'}`}>
                            {resultado.mensaje}
                        </p>
                        {resultado.stats && (
                            <p className="text-sm text-green-700 mt-1">
                                Se generaron {resultado.stats.tareas} tareas con {resultado.stats.pasos} pasos.
                            </p>
                        )}
                        {resultado.errores && resultado.errores.length > 0 && (
                            <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                {resultado.errores.slice(0, 5).map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                                {resultado.errores.length > 5 && (
                                    <li>... y {resultado.errores.length - 5} errores más</li>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Log */}
            {log.length > 0 && (
                <div className="bg-slate-900 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-slate-400">Log de operaciones:</p>
                        <button
                            onClick={() => setLog([])}
                            className="text-xs text-slate-500 hover:text-slate-300"
                        >
                            Limpiar
                        </button>
                    </div>
                    {log.map((entry, i) => (
                        <p key={i} className={`text-sm font-mono ${entry.includes('✓') ? 'text-green-400' :
                                entry.includes('✗') ? 'text-red-400' :
                                    'text-slate-400'
                            }`}>
                            {entry}
                        </p>
                    ))}
                </div>
            )}

            {/* Programación Automática */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar className="text-purple-600" size={20} />
                    Generación Automática de Tareas
                </h3>

                <p className="text-sm text-slate-700 mb-4">
                    Configura la generación automática de tareas al inicio de cada período fiscal.
                    El sistema generará las tareas automáticamente según la programación configurada.
                </p>

                <div className="space-y-4">
                    {/* Toggle habilitado */}
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoGenConfig.habilitado}
                                onChange={(e) => setAutoGenConfig(prev => ({ ...prev, habilitado: e.target.checked }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                        <span className="text-sm font-medium text-slate-700">
                            {autoGenConfig.habilitado ? 'Generación automática activada' : 'Generación automática desactivada'}
                        </span>
                    </div>

                    {autoGenConfig.habilitado && (
                        <div className="pl-4 border-l-2 border-purple-200 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        <Clock size={14} className="inline mr-1" />
                                        Día del mes
                                    </label>
                                    <select
                                        value={autoGenConfig.dia_ejecucion}
                                        onChange={(e) => setAutoGenConfig(prev => ({ ...prev, dia_ejecucion: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        {[1, 2, 3, 4, 5].map(dia => (
                                            <option key={dia} value={dia}>Día {dia} de cada mes</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        <Clock size={14} className="inline mr-1" />
                                        Hora de ejecución
                                    </label>
                                    <input
                                        type="time"
                                        value={autoGenConfig.hora_ejecucion}
                                        onChange={(e) => setAutoGenConfig(prev => ({ ...prev, hora_ejecucion: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            {autoGenConfig.ultimo_periodo_generado && (
                                <p className="text-xs text-slate-700">
                                    Último período generado automáticamente: <strong>{autoGenConfig.ultimo_periodo_generado}</strong>
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleGuardarAutoGen}
                        disabled={guardandoConfig}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {guardandoConfig ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Settings size={18} />
                                Guardar Configuración
                            </>
                        )}
                    </button>

                    {autoGenConfig.updated_at && (
                        <p className="text-xs text-slate-700">
                            Última actualización: {new Date(autoGenConfig.updated_at).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>

            {/* Acciones adicionales */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h4 className="font-medium text-slate-700 mb-2">Verificar Integridad</h4>
                    <p className="text-sm text-slate-700 mb-3">
                        Revisa que todos los datos estén correctamente enlazados.
                    </p>
                    <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm">
                        Ejecutar Verificación
                    </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h4 className="font-medium text-slate-700 mb-2">Recalcular Scoring</h4>
                    <p className="text-sm text-slate-700 mb-3">
                        Actualiza los puntos de todas las tareas según las nuevas reglas.
                    </p>
                    <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm">
                        Recalcular Puntos
                    </button>
                </div>
            </div>
        </div>
    )
}
