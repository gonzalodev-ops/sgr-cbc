'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Check, X, AlertTriangle, Loader2 } from 'lucide-react'

interface MatrizObligacionesProps {
    clienteId: string
}

interface RFCObligaciones {
    contribuyenteId: string
    rfc: string
    razonSocial: string
    obligaciones: ObligacionInfo[]
}

interface ObligacionInfo {
    idObligacion: string
    nombreCorto: string
    descripcion: string
    nivel: string
    periodicidad: string
    cubierta: boolean
}

export default function MatrizObligaciones({ clienteId }: MatrizObligacionesProps) {
    const [rfcsObligaciones, setRfcsObligaciones] = useState<RFCObligaciones[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        async function cargarMatriz() {
            try {
                setLoading(true)
                setError(null)

                // 1. Obtener IDs de contribuyentes del cliente
                const { data: clienteContribData, error: errorClienteContrib } = await supabase
                    .from('cliente_contribuyente')
                    .select('contribuyente_id')
                    .eq('cliente_id', clienteId)

                if (errorClienteContrib) throw errorClienteContrib

                if (!clienteContribData || clienteContribData.length === 0) {
                    setRfcsObligaciones([])
                    setLoading(false)
                    return
                }

                // Extraer IDs de contribuyentes
                const contribuyenteIds = clienteContribData.map((cc: any) => cc.contribuyente_id).filter(Boolean)

                if (contribuyenteIds.length === 0) {
                    setRfcsObligaciones([])
                    setLoading(false)
                    return
                }

                // 1b. Obtener datos de contribuyentes con sus regímenes
                const { data: contribuyentesData, error: errorContrib } = await supabase
                    .from('contribuyente')
                    .select(`
                        contribuyente_id,
                        rfc,
                        razon_social,
                        contribuyente_regimen (
                            c_regimen
                        )
                    `)
                    .in('contribuyente_id', contribuyenteIds)

                if (errorContrib) throw errorContrib

                if (!contribuyentesData || contribuyentesData.length === 0) {
                    setRfcsObligaciones([])
                    setLoading(false)
                    return
                }

                // 2. Obtener servicios contratados con sus obligaciones
                const { data: serviciosData, error: errorServicios } = await supabase
                    .from('cliente_servicio')
                    .select(`
                        servicio_id,
                        servicio (
                            servicio_obligacion (
                                id_obligacion
                            )
                        )
                    `)
                    .eq('cliente_id', clienteId)
                    .eq('activo', true)

                if (errorServicios) throw errorServicios

                // Construir set de obligaciones cubiertas
                const obligacionesCubiertas = new Set<string>()
                ;(serviciosData || []).forEach((cs: any) => {
                    const servicio = cs.servicio
                    if (servicio) {
                        const servicioObligaciones = Array.isArray(servicio.servicio_obligacion)
                            ? servicio.servicio_obligacion
                            : (servicio.servicio_obligacion ? [servicio.servicio_obligacion] : [])

                        servicioObligaciones.forEach((so: any) => {
                            if (so?.id_obligacion) {
                                obligacionesCubiertas.add(so.id_obligacion)
                            }
                        })
                    }
                })

                // 3. Para cada RFC, obtener sus obligaciones basadas en regímenes
                const resultado: RFCObligaciones[] = []

                for (const contrib of contribuyentesData) {
                    if (!contrib) continue

                    // Extraer regímenes del contribuyente
                    const regimenes = Array.isArray(contrib.contribuyente_regimen)
                        ? contrib.contribuyente_regimen
                        : (contrib.contribuyente_regimen ? [contrib.contribuyente_regimen] : [])

                    const regimenesIds = regimenes
                        .map((cr: any) => cr.c_regimen)
                        .filter(Boolean)

                    if (regimenesIds.length === 0) {
                        resultado.push({
                            contribuyenteId: contrib.contribuyente_id,
                            rfc: contrib.rfc,
                            razonSocial: contrib.razon_social,
                            obligaciones: []
                        })
                        continue
                    }

                    // Obtener obligaciones por régimen
                    const { data: obligacionesData, error: errorOblig } = await supabase
                        .from('regimen_obligacion')
                        .select(`
                            id_obligacion,
                            obligacion_fiscal (
                                id_obligacion,
                                nombre_corto,
                                descripcion,
                                nivel,
                                periodicidad
                            )
                        `)
                        .in('c_regimen', regimenesIds)
                        .eq('activo', true)

                    if (errorOblig) {
                        console.error('Error al obtener obligaciones:', errorOblig)
                        continue
                    }

                    // Construir lista de obligaciones con estado de cobertura
                    const obligacionesMap = new Map<string, ObligacionInfo>()

                    ;(obligacionesData || []).forEach((ro: any) => {
                        const oblig = ro.obligacion_fiscal
                        if (oblig) {
                            obligacionesMap.set(oblig.id_obligacion, {
                                idObligacion: oblig.id_obligacion,
                                nombreCorto: oblig.nombre_corto,
                                descripcion: oblig.descripcion || '',
                                nivel: oblig.nivel || '',
                                periodicidad: oblig.periodicidad || '',
                                cubierta: obligacionesCubiertas.has(oblig.id_obligacion)
                            })
                        }
                    })

                    resultado.push({
                        contribuyenteId: contrib.contribuyente_id,
                        rfc: contrib.rfc,
                        razonSocial: contrib.razon_social,
                        obligaciones: Array.from(obligacionesMap.values())
                            .sort((a, b) => a.nombreCorto.localeCompare(b.nombreCorto))
                    })
                }

                setRfcsObligaciones(resultado)
            } catch (err: any) {
                console.error('Error al cargar matriz:', err)
                setError(err.message || 'Error al cargar la matriz de obligaciones')
            } finally {
                setLoading(false)
            }
        }

        cargarMatriz()
    }, [clienteId])

    // Calcular resumen
    const totalObligaciones = rfcsObligaciones.reduce((sum, rfc) => sum + rfc.obligaciones.length, 0)
    const totalCubiertas = rfcsObligaciones.reduce(
        (sum, rfc) => sum + rfc.obligaciones.filter(o => o.cubierta).length,
        0
    )
    const porcentajeCobertura = totalObligaciones > 0 ? (totalCubiertas / totalObligaciones) * 100 : 0

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-slate-600" size={20} />
                    <p className="text-slate-700">Cargando matriz de obligaciones...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle size={20} />
                    <p className="font-medium">Error: {error}</p>
                </div>
            </div>
        )
    }

    if (rfcsObligaciones.length === 0) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle size={20} />
                    <p>Este cliente no tiene RFCs registrados</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Resumen de cobertura */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-slate-700 uppercase mb-1">Cobertura de Obligaciones</h3>
                        <p className="text-2xl font-bold text-slate-800">
                            {totalCubiertas} <span className="text-base text-slate-600">de</span> {totalObligaciones}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`text-3xl font-bold ${porcentajeCobertura >= 80 ? 'text-green-600' : porcentajeCobertura >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {porcentajeCobertura.toFixed(0)}%
                        </div>
                        <p className="text-xs text-slate-600">Cobertura</p>
                    </div>
                </div>
                <div className="mt-3 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all ${porcentajeCobertura >= 80 ? 'bg-green-500' : porcentajeCobertura >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${porcentajeCobertura}%` }}
                    />
                </div>
            </div>

            {/* Matriz por RFC */}
            {rfcsObligaciones.map((rfcData) => (
                <div key={rfcData.contribuyenteId} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    {/* Header del RFC */}
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-mono font-semibold text-slate-800">{rfcData.rfc}</p>
                                <p className="text-sm text-slate-700">{rfcData.razonSocial}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-600">Obligaciones</p>
                                <p className="text-lg font-bold text-slate-800">
                                    {rfcData.obligaciones.filter(o => o.cubierta).length} / {rfcData.obligaciones.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de obligaciones */}
                    {rfcData.obligaciones.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-700 uppercase">Estado</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-700 uppercase">Obligación</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-700 uppercase">Descripción</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-700 uppercase">Nivel</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-700 uppercase">Periodicidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {rfcData.obligaciones.map((oblig) => (
                                        <tr key={oblig.idObligacion} className={`hover:bg-slate-50 ${oblig.cubierta ? '' : 'bg-red-50/30'}`}>
                                            <td className="px-4 py-3">
                                                {oblig.cubierta ? (
                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                                                        <Check className="text-green-600" size={16} />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                                                        <X className="text-red-600" size={16} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-slate-800">{oblig.nombreCorto}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-slate-700">{oblig.descripcion}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
                                                    {oblig.nivel}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                                                    {oblig.periodicidad}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6 text-center">
                            <AlertTriangle className="mx-auto mb-2 text-amber-500" size={24} />
                            <p className="text-sm text-slate-700">No se encontraron obligaciones para este RFC</p>
                            <p className="text-xs text-slate-600 mt-1">Verifica que tenga regímenes fiscales asignados</p>
                        </div>
                    )}
                </div>
            ))}

            {/* Alerta si hay obligaciones no cubiertas */}
            {totalObligaciones > totalCubiertas && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-medium text-amber-800">
                                Hay {totalObligaciones - totalCubiertas} obligación(es) sin cobertura
                            </p>
                            <p className="text-sm text-amber-700 mt-1">
                                Considera contratar servicios adicionales para cubrir estas obligaciones fiscales.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
