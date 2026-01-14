import { createClient } from '@supabase/supabase-js'

// Tipos para el motor
interface Contribuyente {
    contribuyente_id: string
    rfc: string
    tipo_persona: string
}

interface ContribuyenteRegimen {
    contribuyente_id: string
    c_regimen: string
    vigencia_desde: string | null
    vigencia_hasta: string | null
}

interface RegimenObligacion {
    c_regimen: string
    id_obligacion: string
    condicion_json: Record<string, unknown> | null
}

interface ObligacionFiscal {
    id_obligacion: string
    nombre: string
    periodicidad: string
    nivel: string
}

interface ClienteServicio {
    cliente_id: string
    servicio_id: string
}

interface ServicioObligacion {
    servicio_id: string
    id_obligacion: string
}

interface CalendarioDeadline {
    calendario_regla_id: string
    periodo: string
    fecha_limite: string
}

interface TareaGenerada {
    cliente_id: string
    contribuyente_id: string
    id_obligacion: string
    ejercicio: number
    periodo_fiscal: string
    fecha_limite_oficial: string
    estado: string
}

/**
 * Motor de generación de tareas
 * Para cada RFC con régimen vigente:
 * 1. Consultar regimen_obligacion → obligaciones que aplican
 * 2. Filtrar por cliente_servicio → obligaciones contratadas
 * 3. Para cada obligación + periodo → generar tarea con deadline
 */
export async function generarTareas(
    supabaseUrl: string,
    supabaseKey: string,
    periodo: string, // Formato: '2026-01' para enero 2026
    contribuyenteId?: string // Opcional: generar solo para un RFC
): Promise<{ success: boolean; tareasGeneradas: number; errores: string[] }> {

    const supabase = createClient(supabaseUrl, supabaseKey)
    const errores: string[] = []
    let tareasGeneradas = 0

    try {
        // 1. Obtener contribuyentes (todos o uno específico)
        const contribuyentesQuery = supabase
            .from('contribuyente')
            .select('contribuyente_id, rfc, tipo_persona')

        if (contribuyenteId) {
            contribuyentesQuery.eq('contribuyente_id', contribuyenteId)
        }

        const { data: contribuyentes, error: contribError } = await contribuyentesQuery

        if (contribError) {
            throw new Error(`Error obteniendo contribuyentes: ${contribError.message}`)
        }

        if (!contribuyentes || contribuyentes.length === 0) {
            return { success: true, tareasGeneradas: 0, errores: ['No hay contribuyentes registrados'] }
        }

        // Para cada contribuyente
        for (const contribuyente of contribuyentes as Contribuyente[]) {
            try {
                // 2. Obtener regímenes vigentes del contribuyente
                const { data: regimenes, error: regError } = await supabase
                    .from('contribuyente_regimen')
                    .select('c_regimen, vigencia_desde, vigencia_hasta')
                    .eq('contribuyente_id', contribuyente.contribuyente_id)

                if (regError) {
                    errores.push(`Error obteniendo regímenes para ${contribuyente.rfc}: ${regError.message}`)
                    continue
                }

                if (!regimenes || regimenes.length === 0) {
                    continue // Sin regímenes, saltar
                }

                // 3. Obtener cliente asociado al contribuyente
                const { data: clienteContrib, error: ccError } = await supabase
                    .from('cliente_contribuyente')
                    .select('cliente_id')
                    .eq('contribuyente_id', contribuyente.contribuyente_id)
                    .single()

                if (ccError || !clienteContrib) {
                    errores.push(`Contribuyente ${contribuyente.rfc} no tiene cliente asociado`)
                    continue
                }

                const clienteId = clienteContrib.cliente_id

                // 4. Obtener servicios contratados por el cliente
                const { data: serviciosCliente, error: scError } = await supabase
                    .from('cliente_servicio')
                    .select('servicio_id')
                    .eq('cliente_id', clienteId)

                if (scError) {
                    errores.push(`Error obteniendo servicios para cliente ${clienteId}: ${scError.message}`)
                    continue
                }

                const serviciosIds = (serviciosCliente as ClienteServicio[] || []).map(s => s.servicio_id)

                if (serviciosIds.length === 0) {
                    continue // Sin servicios contratados
                }

                // 5. Obtener obligaciones cubiertas por los servicios
                const { data: obligacionesServicios, error: osError } = await supabase
                    .from('servicio_obligacion')
                    .select('id_obligacion')
                    .in('servicio_id', serviciosIds)

                if (osError) {
                    errores.push(`Error obteniendo obligaciones de servicios: ${osError.message}`)
                    continue
                }

                const obligacionesCubiertas = new Set(
                    (obligacionesServicios as ServicioObligacion[] || []).map(o => o.id_obligacion)
                )

                // 6. Para cada régimen, obtener obligaciones que aplican
                for (const regimen of regimenes as ContribuyenteRegimen[]) {
                    const { data: obligacionesRegimen, error: orError } = await supabase
                        .from('regimen_obligacion')
                        .select('id_obligacion, condicion_json')
                        .eq('c_regimen', regimen.c_regimen)

                    if (orError) {
                        errores.push(`Error obteniendo obligaciones del régimen ${regimen.c_regimen}: ${orError.message}`)
                        continue
                    }

                    // 7. Filtrar obligaciones que están contratadas
                    for (const obligacion of obligacionesRegimen as RegimenObligacion[] || []) {
                        if (!obligacionesCubiertas.has(obligacion.id_obligacion)) {
                            continue // No está contratada
                        }

                        // 8. Verificar si ya existe tarea para este RFC + obligación + periodo
                        const { data: tareaExistente, error: teError } = await supabase
                            .from('tarea')
                            .select('tarea_id')
                            .eq('contribuyente_id', contribuyente.contribuyente_id)
                            .eq('id_obligacion', obligacion.id_obligacion)
                            .eq('periodo_fiscal', periodo)
                            .single()

                        if (tareaExistente) {
                            continue // Ya existe, no duplicar
                        }

                        // 9. Calcular ejercicio y fecha límite por defecto
                        const [año, mes] = periodo.split('-').map(Number)
                        const ejercicio = año

                        // Fecha límite por defecto: día 17 del mes siguiente
                        const mesSiguiente = mes === 12 ? 1 : mes + 1
                        const añoLimite = mes === 12 ? año + 1 : año
                        const fechaLimiteDefault = `${añoLimite}-${String(mesSiguiente).padStart(2, '0')}-17`

                        // 10. Crear la tarea
                        const nuevaTarea: TareaGenerada = {
                            cliente_id: clienteId,
                            contribuyente_id: contribuyente.contribuyente_id,
                            id_obligacion: obligacion.id_obligacion,
                            ejercicio,
                            periodo_fiscal: periodo,
                            fecha_limite_oficial: fechaLimiteDefault,
                            estado: 'no_iniciado'
                        }

                        const { error: insertError } = await supabase
                            .from('tarea')
                            .insert(nuevaTarea)

                        if (insertError) {
                            errores.push(`Error creando tarea para ${contribuyente.rfc} - ${obligacion.id_obligacion}: ${insertError.message}`)
                        } else {
                            tareasGeneradas++
                        }
                    }
                }
            } catch (error) {
                errores.push(`Error procesando ${contribuyente.rfc}: ${(error as Error).message}`)
            }
        }

        return {
            success: errores.length === 0,
            tareasGeneradas,
            errores
        }

    } catch (error) {
        return {
            success: false,
            tareasGeneradas: 0,
            errores: [(error as Error).message]
        }
    }
}

/**
 * Obtener resumen de tareas por periodo
 */
export async function obtenerResumenTareas(
    supabaseUrl: string,
    supabaseKey: string,
    periodo: string
): Promise<{
    total: number
    porEstado: Record<string, number>
    porTribu: Record<string, number>
}> {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: tareas, error } = await supabase
        .from('tarea')
        .select(`
      tarea_id,
      estado,
      responsable_equipo_id,
      teams:responsable_equipo_id (nombre)
    `)
        .eq('periodo_fiscal', periodo)

    if (error || !tareas) {
        return { total: 0, porEstado: {}, porTribu: {} }
    }

    const porEstado: Record<string, number> = {}
    const porTribu: Record<string, number> = {}

    for (const tarea of tareas) {
        // Contar por estado
        porEstado[tarea.estado] = (porEstado[tarea.estado] || 0) + 1

        // Contar por tribu
        let nombreTribu = 'Sin asignar'
        if (tarea.teams) {
            if (Array.isArray(tarea.teams) && tarea.teams.length > 0) {
                nombreTribu = (tarea.teams[0] as any).nombre || 'Sin asignar'
            } else if (!Array.isArray(tarea.teams)) {
                nombreTribu = (tarea.teams as any).nombre || 'Sin asignar'
            }
        }
        porTribu[nombreTribu] = (porTribu[nombreTribu] || 0) + 1
    }

    return {
        total: tareas.length,
        porEstado,
        porTribu
    }
}
