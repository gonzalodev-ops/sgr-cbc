import { createClient, SupabaseClient } from '@supabase/supabase-js'
import logger from '@/lib/utils/logger'

// Tipos para el motor de deteccion de riesgo
interface TareaEnRiesgo {
    tarea_id: string
    cliente_id: string
    contribuyente_id: string
    id_obligacion: string
    estado: string
    fecha_estado_presentado: string | null
    en_riesgo: boolean
}

interface TareaConDocumento {
    tarea_id: string
    tiene_comprobante_pago: boolean
}

interface ConfigRiesgo {
    dias_sin_pago_para_riesgo: number
    habilitado: boolean
}

interface TareaRiesgoDetalle {
    tarea_id: string
    cliente_id: string
    cliente_nombre: string
    contribuyente_id: string
    rfc: string
    id_obligacion: string
    obligacion_nombre: string
    fecha_estado_presentado: string
    dias_sin_pago: number
}

// Constantes
const QUERY_LIMIT = 1000
const DEFAULT_DIAS_RIESGO = 3

/**
 * Motor de deteccion de riesgo por falta de pago
 *
 * Detecta tareas que:
 * 1. Estan en estado 'presentado'
 * 2. Llevan mas de X dias sin comprobante de pago
 * 3. No tienen documento tipo 'COMPROBANTE_PAGO'
 *
 * @param supabaseUrl - URL de Supabase
 * @param supabaseKey - Clave de servicio de Supabase
 * @returns Resultado de la deteccion
 */
export async function detectarTareasEnRiesgo(
    supabaseUrl: string,
    supabaseKey: string
): Promise<{
    success: boolean
    tareasMaradasEnRiesgo: number
    tareasDesmarcadas: number
    errores: string[]
}> {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const errores: string[] = []
    let tareasMaradasEnRiesgo = 0
    let tareasDesmarcadas = 0

    try {
        // 1. Obtener configuracion de riesgo
        const config = await obtenerConfigRiesgo(supabase)

        if (!config.habilitado) {
            return {
                success: true,
                tareasMaradasEnRiesgo: 0,
                tareasDesmarcadas: 0,
                errores: ['Deteccion de riesgo deshabilitada en configuracion']
            }
        }

        const diasParaRiesgo = config.dias_sin_pago_para_riesgo

        // 2. Obtener tareas en estado 'presentado' con fecha_estado_presentado
        const { data: tareasPresentadas, error: tareasError } = await supabase
            .from('tarea')
            .select('tarea_id, cliente_id, contribuyente_id, id_obligacion, estado, fecha_estado_presentado, en_riesgo')
            .eq('estado', 'presentado')
            .not('fecha_estado_presentado', 'is', null)
            .limit(QUERY_LIMIT)

        if (tareasError) {
            throw new Error(`Error obteniendo tareas presentadas: ${tareasError.message}`)
        }

        if (!tareasPresentadas || tareasPresentadas.length === 0) {
            return {
                success: true,
                tareasMaradasEnRiesgo: 0,
                tareasDesmarcadas: 0,
                errores: []
            }
        }

        // 3. Obtener IDs de tareas
        const tareaIds = tareasPresentadas.map(t => t.tarea_id)

        // 4. Verificar cuales tienen comprobante de pago
        const tareasConComprobante = await verificarComprobantesPago(supabase, tareaIds)

        // 5. Calcular fecha limite para riesgo
        const fechaLimiteRiesgo = new Date()
        fechaLimiteRiesgo.setDate(fechaLimiteRiesgo.getDate() - diasParaRiesgo)

        // 6. Procesar cada tarea
        const tareasParaMarcar: string[] = []
        const tareasParaDesmarcar: string[] = []

        for (const tarea of tareasPresentadas as TareaEnRiesgo[]) {
            const tieneComprobante = tareasConComprobante.has(tarea.tarea_id)
            const fechaPresentado = new Date(tarea.fecha_estado_presentado!)
            const diasSinPago = Math.floor((Date.now() - fechaPresentado.getTime()) / (1000 * 60 * 60 * 24))

            // Logica de marcado:
            // - Si NO tiene comprobante Y paso el tiempo -> marcar en riesgo
            // - Si SI tiene comprobante Y esta marcada -> desmarcar
            if (!tieneComprobante && diasSinPago > diasParaRiesgo && !tarea.en_riesgo) {
                tareasParaMarcar.push(tarea.tarea_id)
            } else if (tieneComprobante && tarea.en_riesgo) {
                tareasParaDesmarcar.push(tarea.tarea_id)
            }
        }

        // 7. Actualizar tareas en batch
        if (tareasParaMarcar.length > 0) {
            const { error: updateError } = await supabase
                .from('tarea')
                .update({ en_riesgo: true, updated_at: new Date().toISOString() })
                .in('tarea_id', tareasParaMarcar)

            if (updateError) {
                errores.push(`Error marcando tareas en riesgo: ${updateError.message}`)
            } else {
                tareasMaradasEnRiesgo = tareasParaMarcar.length
            }
        }

        if (tareasParaDesmarcar.length > 0) {
            const { error: updateError } = await supabase
                .from('tarea')
                .update({ en_riesgo: false, updated_at: new Date().toISOString() })
                .in('tarea_id', tareasParaDesmarcar)

            if (updateError) {
                errores.push(`Error desmarcando tareas: ${updateError.message}`)
            } else {
                tareasDesmarcadas = tareasParaDesmarcar.length
            }
        }

        // 8. Registrar en log del sistema
        await supabase
            .from('system_log')
            .insert({
                tipo: 'RISK_DETECTION',
                mensaje: `Deteccion de riesgo completada: ${tareasMaradasEnRiesgo} marcadas, ${tareasDesmarcadas} desmarcadas`,
                metadata: {
                    tareas_marcadas: tareasMaradasEnRiesgo,
                    tareas_desmarcadas: tareasDesmarcadas,
                    config_dias: diasParaRiesgo
                }
            })

        return {
            success: errores.length === 0,
            tareasMaradasEnRiesgo,
            tareasDesmarcadas,
            errores
        }

    } catch (error) {
        logger.error('Error en detectarTareasEnRiesgo', error)
        return {
            success: false,
            tareasMaradasEnRiesgo: 0,
            tareasDesmarcadas: 0,
            errores: [(error as Error).message]
        }
    }
}

/**
 * Obtener lista detallada de tareas en riesgo
 */
export async function obtenerTareasEnRiesgoDetalle(
    supabaseUrl: string,
    supabaseKey: string
): Promise<{
    success: boolean
    tareas: TareaRiesgoDetalle[]
    errores: string[]
}> {
    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        const { data: tareas, error } = await supabase
            .from('tarea')
            .select(`
                tarea_id,
                cliente_id,
                contribuyente_id,
                id_obligacion,
                fecha_estado_presentado,
                cliente:cliente_id (
                    nombre_comercial
                ),
                contribuyente:contribuyente_id (
                    rfc
                ),
                obligacion:id_obligacion (
                    nombre_corto
                )
            `)
            .eq('en_riesgo', true)
            .eq('estado', 'presentado')
            .order('fecha_estado_presentado', { ascending: true })
            .limit(QUERY_LIMIT)

        if (error) {
            throw new Error(`Error obteniendo tareas en riesgo: ${error.message}`)
        }

        interface TareaRaw {
            tarea_id: string
            cliente_id: string
            contribuyente_id: string
            id_obligacion: string
            fecha_estado_presentado: string
            cliente: { nombre_comercial: string } | null
            contribuyente: { rfc: string } | null
            obligacion: { nombre_corto: string } | null
        }

        const tareasDetalle: TareaRiesgoDetalle[] = (tareas as TareaRaw[] || []).map(t => {
            const fechaPresentado = new Date(t.fecha_estado_presentado)
            const diasSinPago = Math.floor((Date.now() - fechaPresentado.getTime()) / (1000 * 60 * 60 * 24))

            return {
                tarea_id: t.tarea_id,
                cliente_id: t.cliente_id,
                cliente_nombre: t.cliente?.nombre_comercial || 'Sin cliente',
                contribuyente_id: t.contribuyente_id,
                rfc: t.contribuyente?.rfc || 'N/A',
                id_obligacion: t.id_obligacion,
                obligacion_nombre: t.obligacion?.nombre_corto || t.id_obligacion,
                fecha_estado_presentado: t.fecha_estado_presentado,
                dias_sin_pago: diasSinPago
            }
        })

        return {
            success: true,
            tareas: tareasDetalle,
            errores: []
        }

    } catch (error) {
        logger.error('Error en obtenerTareasEnRiesgoDetalle', error)
        return {
            success: false,
            tareas: [],
            errores: [(error as Error).message]
        }
    }
}

/**
 * Obtener configuracion de riesgo desde la base de datos
 */
async function obtenerConfigRiesgo(supabase: SupabaseClient): Promise<ConfigRiesgo> {
    const { data, error } = await supabase
        .from('config_sistema')
        .select('valor')
        .eq('clave', 'riesgo_falta_pago')
        .single()

    if (error || !data) {
        logger.warn('No se encontro configuracion de riesgo, usando valores por defecto')
        return {
            dias_sin_pago_para_riesgo: DEFAULT_DIAS_RIESGO,
            habilitado: true
        }
    }

    const valor = data.valor as ConfigRiesgo
    return {
        dias_sin_pago_para_riesgo: valor.dias_sin_pago_para_riesgo || DEFAULT_DIAS_RIESGO,
        habilitado: valor.habilitado !== false
    }
}

/**
 * Verificar cuales tareas tienen comprobante de pago
 */
async function verificarComprobantesPago(
    supabase: SupabaseClient,
    tareaIds: string[]
): Promise<Set<string>> {
    const { data, error } = await supabase
        .from('tarea_documento')
        .select(`
            tarea_id,
            documento:documento_id (
                tipo_documento
            )
        `)
        .in('tarea_id', tareaIds)
        .limit(QUERY_LIMIT)

    const tareasConComprobante = new Set<string>()

    if (error || !data) {
        logger.error('Error verificando comprobantes de pago', error)
        return tareasConComprobante
    }

    interface TareaDocumentoRaw {
        tarea_id: string
        documento: { tipo_documento: string } | { tipo_documento: string }[] | null
    }

    for (const td of data as TareaDocumentoRaw[]) {
        // Manejar tanto array como objeto
        const tipoDocumento = Array.isArray(td.documento)
            ? td.documento[0]?.tipo_documento
            : td.documento?.tipo_documento

        if (tipoDocumento === 'COMPROBANTE_PAGO') {
            tareasConComprobante.add(td.tarea_id)
        }
    }

    return tareasConComprobante
}

/**
 * Marcar una tarea especifica como en riesgo (uso manual)
 */
export async function marcarTareaEnRiesgo(
    supabaseUrl: string,
    supabaseKey: string,
    tareaId: string,
    enRiesgo: boolean
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error } = await supabase
        .from('tarea')
        .update({
            en_riesgo: enRiesgo,
            updated_at: new Date().toISOString()
        })
        .eq('tarea_id', tareaId)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Obtener conteo de tareas en riesgo por cliente
 */
export async function obtenerConteoRiesgoPorCliente(
    supabaseUrl: string,
    supabaseKey: string
): Promise<{
    success: boolean
    conteo: Array<{ cliente_id: string; cliente_nombre: string; tareas_en_riesgo: number }>
    errores: string[]
}> {
    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        const { data, error } = await supabase
            .from('tarea')
            .select(`
                cliente_id,
                cliente:cliente_id (
                    nombre_comercial
                )
            `)
            .eq('en_riesgo', true)
            .eq('estado', 'presentado')
            .limit(QUERY_LIMIT)

        if (error) {
            throw new Error(`Error obteniendo conteo: ${error.message}`)
        }

        interface TareaClienteRaw {
            cliente_id: string
            cliente: { nombre_comercial: string } | null
        }

        // Agrupar por cliente
        const conteoPorCliente = new Map<string, { nombre: string; count: number }>()

        for (const t of data as TareaClienteRaw[]) {
            const clienteId = t.cliente_id
            const nombreCliente = t.cliente?.nombre_comercial || 'Sin nombre'

            if (conteoPorCliente.has(clienteId)) {
                conteoPorCliente.get(clienteId)!.count++
            } else {
                conteoPorCliente.set(clienteId, { nombre: nombreCliente, count: 1 })
            }
        }

        const conteo = Array.from(conteoPorCliente.entries()).map(([id, data]) => ({
            cliente_id: id,
            cliente_nombre: data.nombre,
            tareas_en_riesgo: data.count
        })).sort((a, b) => b.tareas_en_riesgo - a.tareas_en_riesgo)

        return {
            success: true,
            conteo,
            errores: []
        }

    } catch (error) {
        logger.error('Error en obtenerConteoRiesgoPorCliente', error)
        return {
            success: false,
            conteo: [],
            errores: [(error as Error).message]
        }
    }
}
