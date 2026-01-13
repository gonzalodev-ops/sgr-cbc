'use client'

import { useState } from 'react'
import { Database, AlertCircle, Play, CheckCircle, XCircle } from 'lucide-react'

interface GeneracionResult {
    success: boolean
    mensaje: string
    errores?: string[]
    stats?: { tareas: number; pasos: number }
}

export default function TabDatos() {
    const [periodo, setPeriodo] = useState('')
    const [generando, setGenerando] = useState(false)
    const [resultado, setResultado] = useState<GeneracionResult | null>(null)
    const [log, setLog] = useState<string[]>([])

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

                <p className="text-sm text-slate-500 mb-4">
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
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
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

            {/* Resultado */}
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

            {/* Acciones adicionales */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h4 className="font-medium text-slate-700 mb-2">Verificar Integridad</h4>
                    <p className="text-sm text-slate-500 mb-3">
                        Revisa que todos los datos estén correctamente enlazados.
                    </p>
                    <button className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-sm">
                        Ejecutar Verificación
                    </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h4 className="font-medium text-slate-700 mb-2">Recalcular Scoring</h4>
                    <p className="text-sm text-slate-500 mb-3">
                        Actualiza los puntos de todas las tareas según las nuevas reglas.
                    </p>
                    <button className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-sm">
                        Recalcular Puntos
                    </button>
                </div>
            </div>
        </div>
    )
}
