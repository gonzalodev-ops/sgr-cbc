import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/utils/logger'

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

interface ClienteContribuyente {
    cliente_id: string
    contribuyente_id: string
}

interface ClienteServicio {
    cliente_id: string
    servicio_id: string
}

interface ServicioObligacion {
    servicio_id: string
    id_obligacion: string
}

interface TareaExistente {
    tarea_id: string
    contribuyente_id: string
    id_obligacion: string
    periodo_fiscal: string
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

// Constantes de paginación
const QUERY_LIMIT = 1000

/**
 * Motor de generación de tareas (OPTIMIZADO)
 * Estrategia: Batch queries + procesamiento en memoria
 * 1. Cargar todos los datos necesarios en pocas queries
 * 2. Procesar en memoria para evitar N+1
 * 3. Insertar tareas en batch
 */
export async function generarTareas(
    supabaseUrl: string,
    supabaseKey: string,
    periodo: string,
    contribuyenteId?: string
): Promise<{ success: boolean; tareasGeneradas: number; errores: string[] }> {

    const supabase = createClient(supabaseUrl, supabaseKey)
    const errores: string[] = []
    const tareasAInsertar: TareaGenerada[] = []

    try {
        // === FASE 1: Carga batch de todos los datos necesarios ===

        // 1.1 Obtener contribuyentes
        const contribuyentesQuery = supabase
            .from('contribuyente')
            .select('contribuyente_id, rfc, tipo_persona')
            .limit(QUERY_LIMIT)

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

        const contribuyenteIds = contribuyentes.map(c => c.contribuyente_id)

        // 1.2 Batch: Obtener TODOS los regímenes de los contribuyentes
        const { data: todosRegimenes, error: regError } = await supabase
            .from('contribuyente_regimen')
            .select('contribuyente_id, c_regimen, vigencia_desde, vigencia_hasta')
            .in('contribuyente_id', contribuyenteIds)
            .limit(QUERY_LIMIT)

        if (regError) {
            logger.error('Error obteniendo regímenes', regError)
        }

        // Crear mapa: contribuyente_id -> regímenes[]
        const regimenesPorContribuyente = new Map<string, ContribuyenteRegimen[]>()
        ;(todosRegimenes || []).forEach((r: ContribuyenteRegimen) => {
            const existing = regimenesPorContribuyente.get(r.contribuyente_id) || []
            existing.push(r)
            regimenesPorContribuyente.set(r.contribuyente_id, existing)
        })

        // 1.3 Batch: Obtener TODAS las relaciones cliente-contribuyente
        const { data: clienteContribData, error: ccError } = await supabase
            .from('cliente_contribuyente')
            .select('cliente_id, contribuyente_id')
            .in('contribuyente_id', contribuyenteIds)
            .limit(QUERY_LIMIT)

        if (ccError) {
            logger.error('Error obteniendo cliente-contribuyente', ccError)
        }

        // Crear mapa: contribuyente_id -> cliente_id
        const clientePorContribuyente = new Map<string, string>()
        ;(clienteContribData || []).forEach((cc: ClienteContribuyente) => {
            clientePorContribuyente.set(cc.contribuyente_id, cc.cliente_id)
        })

        // 1.4 Obtener todos los clientes únicos
        const clienteIds = [...new Set(clienteContribData?.map(cc => cc.cliente_id) || [])]

        // 1.5 Batch: Obtener TODOS los servicios de los clientes
        const { data: serviciosClientes, error: scError } = await supabase
            .from('cliente_servicio')
            .select('cliente_id, servicio_id')
            .in('cliente_id', clienteIds)
            .limit(QUERY_LIMIT)

        if (scError) {
            logger.error('Error obteniendo servicios de clientes', scError)
        }

        // Crear mapa: cliente_id -> servicio_ids[]
        const serviciosPorCliente = new Map<string, string[]>()
        ;(serviciosClientes || []).forEach((cs: ClienteServicio) => {
            const existing = serviciosPorCliente.get(cs.cliente_id) || []
            existing.push(cs.servicio_id)
            serviciosPorCliente.set(cs.cliente_id, existing)
        })

        // 1.6 Obtener todos los servicios únicos
        const servicioIds = [...new Set(serviciosClientes?.map(s => s.servicio_id) || [])]

        // 1.7 Batch: Obtener TODAS las obligaciones por servicio
        const { data: obligacionesServicios, error: osError } = await supabase
            .from('servicio_obligacion')
            .select('servicio_id, id_obligacion')
            .in('servicio_id', servicioIds)
            .limit(QUERY_LIMIT)

        if (osError) {
            logger.error('Error obteniendo obligaciones de servicios', osError)
        }

        // Crear mapa: servicio_id -> obligacion_ids[]
        const obligacionesPorServicio = new Map<string, string[]>()
        ;(obligacionesServicios || []).forEach((so: ServicioObligacion) => {
            const existing = obligacionesPorServicio.get(so.servicio_id) || []
            existing.push(so.id_obligacion)
            obligacionesPorServicio.set(so.servicio_id, existing)
        })

        // 1.8 Obtener todos los regímenes únicos
        const regimenCodes = [...new Set(todosRegimenes?.map(r => r.c_regimen) || [])]

        // 1.9 Batch: Obtener TODAS las obligaciones por régimen
        const { data: obligacionesRegimenes, error: orError } = await supabase
            .from('regimen_obligacion')
            .select('c_regimen, id_obligacion, condicion_json')
            .in('c_regimen', regimenCodes)
            .limit(QUERY_LIMIT)

        if (orError) {
            logger.error('Error obteniendo obligaciones de regímenes', orError)
        }

        // Crear mapa: c_regimen -> obligaciones[]
        const obligacionesPorRegimen = new Map<string, RegimenObligacion[]>()
        ;(obligacionesRegimenes || []).forEach((or: RegimenObligacion) => {
            const existing = obligacionesPorRegimen.get(or.c_regimen) || []
            existing.push(or)
            obligacionesPorRegimen.set(or.c_regimen, existing)
        })

        // 1.10 Batch: Obtener TODAS las tareas existentes para el periodo
        const { data: tareasExistentes, error: teError } = await supabase
            .from('tarea')
            .select('tarea_id, contribuyente_id, id_obligacion, periodo_fiscal')
            .eq('periodo_fiscal', periodo)
            .in('contribuyente_id', contribuyenteIds)
            .limit(QUERY_LIMIT)

        if (teError) {
            logger.error('Error obteniendo tareas existentes', teError)
        }

        // Crear set de tareas existentes: "contribuyente_id|id_obligacion|periodo"
        const tareasExistentesSet = new Set<string>()
        ;(tareasExistentes || []).forEach((t: TareaExistente) => {
            tareasExistentesSet.add(`${t.contribuyente_id}|${t.id_obligacion}|${t.periodo_fiscal}`)
        })

        // === FASE 2: Procesamiento en memoria ===

        for (const contribuyente of contribuyentes as Contribuyente[]) {
            try {
                // Obtener regímenes del contribuyente (desde mapa)
                const regimenes = regimenesPorContribuyente.get(contribuyente.contribuyente_id) || []
                if (regimenes.length === 0) continue

                // Obtener cliente asociado (desde mapa)
                const clienteId = clientePorContribuyente.get(contribuyente.contribuyente_id)
                if (!clienteId) {
                    errores.push(`Contribuyente ${contribuyente.rfc} no tiene cliente asociado`)
                    continue
                }

                // Obtener servicios contratados (desde mapa)
                const serviciosIds = serviciosPorCliente.get(clienteId) || []
                if (serviciosIds.length === 0) continue

                // Calcular obligaciones cubiertas por servicios
                const obligacionesCubiertas = new Set<string>()
                serviciosIds.forEach(servId => {
                    const obligs = obligacionesPorServicio.get(servId) || []
                    obligs.forEach(o => obligacionesCubiertas.add(o))
                })

                // Para cada régimen, verificar obligaciones
                for (const regimen of regimenes) {
                    const obligacionesDelRegimen = obligacionesPorRegimen.get(regimen.c_regimen) || []

                    for (const obligacion of obligacionesDelRegimen) {
                        // Verificar si está contratada
                        if (!obligacionesCubiertas.has(obligacion.id_obligacion)) continue

                        // Verificar si ya existe
                        const tareaKey = `${contribuyente.contribuyente_id}|${obligacion.id_obligacion}|${periodo}`
                        if (tareasExistentesSet.has(tareaKey)) continue

                        // Calcular fecha límite
                        const [año, mes] = periodo.split('-').map(Number)
                        const mesSiguiente = mes === 12 ? 1 : mes + 1
                        const añoLimite = mes === 12 ? año + 1 : año
                        const fechaLimiteDefault = `${añoLimite}-${String(mesSiguiente).padStart(2, '0')}-17`

                        // Agregar a batch de inserción
                        tareasAInsertar.push({
                            cliente_id: clienteId,
                            contribuyente_id: contribuyente.contribuyente_id,
                            id_obligacion: obligacion.id_obligacion,
                            ejercicio: año,
                            periodo_fiscal: periodo,
                            fecha_limite_oficial: fechaLimiteDefault,
                            estado: 'no_iniciado'
                        })

                        // Agregar al set para evitar duplicados en este batch
                        tareasExistentesSet.add(tareaKey)
                    }
                }
            } catch (error) {
                errores.push(`Error procesando ${contribuyente.rfc}: ${(error as Error).message}`)
            }
        }

        // === FASE 3: Inserción batch ===

        if (tareasAInsertar.length > 0) {
            // Insertar en chunks de 100 para evitar timeouts
            const CHUNK_SIZE = 100
            for (let i = 0; i < tareasAInsertar.length; i += CHUNK_SIZE) {
                const chunk = tareasAInsertar.slice(i, i + CHUNK_SIZE)
                const { error: insertError } = await supabase
                    .from('tarea')
                    .insert(chunk)

                if (insertError) {
                    logger.error(`Error insertando tareas batch ${i}-${i + chunk.length}`, insertError)
                    errores.push(`Error insertando batch: ${insertError.message}`)
                }
            }
        }

        return {
            success: errores.length === 0,
            tareasGeneradas: tareasAInsertar.length,
            errores
        }

    } catch (error) {
        logger.error('Error en generarTareas', error)
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
        .limit(QUERY_LIMIT)

    if (error || !tareas) {
        logger.error('Error obteniendo resumen de tareas', error)
        return { total: 0, porEstado: {}, porTribu: {} }
    }

    const porEstado: Record<string, number> = {}
    const porTribu: Record<string, number> = {}

    interface TareaConTeam {
        tarea_id: string
        estado: string
        responsable_equipo_id: string | null
        teams: { nombre: string } | { nombre: string }[] | null
    }

    for (const tarea of tareas as TareaConTeam[]) {
        // Contar por estado
        porEstado[tarea.estado] = (porEstado[tarea.estado] || 0) + 1

        // Contar por tribu - manejar tipos correctamente
        let nombreTribu = 'Sin asignar'
        if (tarea.teams) {
            if (Array.isArray(tarea.teams) && tarea.teams.length > 0) {
                nombreTribu = tarea.teams[0].nombre || 'Sin asignar'
            } else if (!Array.isArray(tarea.teams) && typeof tarea.teams === 'object') {
                nombreTribu = tarea.teams.nombre || 'Sin asignar'
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
