import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/utils/logger'

/**
 * Motor de asignación de pasos
 * Para cada tarea, instanciar los pasos del proceso correspondiente
 */

interface ProcesoPaso {
    proceso_id: string
    paso_id: string
    nombre: string
    orden: number
    peso_pct: number
    tipo_colaborador: string | null
    grupo_concurrencia: number | null
    evidencia_requerida: boolean
}

interface TareaStep {
    tarea_id: string
    proceso_paso_id: string
    titulo: string
    orden: number
    peso_pct: number
    tipo_colaborador: string | null
    completado: boolean
    completado_at: string | null
    responsable_usuario_id: string | null
}

interface UserInfo {
    nombre: string
    email: string
}


/**
 * Generar pasos para una tarea basado en el proceso operativo
 */
export async function generarPasosTarea(
    supabaseUrl: string,
    supabaseKey: string,
    tareaId: string,
    procesoId: string // 'NOMINA' o 'IMSS'
): Promise<{ success: boolean; pasosGenerados: number; error?: string }> {

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        // 1. Verificar si ya existen pasos para esta tarea
        const { data: pasosExistentes, error: checkError } = await supabase
            .from('tarea_step')
            .select('id')
            .eq('tarea_id', tareaId)
            .limit(1)

        if (checkError) {
            return { success: false, pasosGenerados: 0, error: checkError.message }
        }

        if (pasosExistentes && pasosExistentes.length > 0) {
            return { success: true, pasosGenerados: 0, error: 'Ya existen pasos para esta tarea' }
        }

        // 2. Obtener pasos del proceso
        const { data: pasosProceso, error: pasosError } = await supabase
            .from('proceso_paso')
            .select('*')
            .eq('proceso_id', procesoId)
            .eq('activo', true)
            .order('orden', { ascending: true })

        if (pasosError) {
            return { success: false, pasosGenerados: 0, error: pasosError.message }
        }

        if (!pasosProceso || pasosProceso.length === 0) {
            return { success: false, pasosGenerados: 0, error: `No hay pasos definidos para proceso ${procesoId}` }
        }

        // 3. Crear los pasos de la tarea
        const tareasSteps = (pasosProceso as ProcesoPaso[]).map(paso => ({
            tarea_id: tareaId,
            proceso_paso_id: paso.paso_id,
            titulo: paso.nombre,
            orden: paso.orden,
            peso_pct: paso.peso_pct,
            tipo_colaborador: paso.tipo_colaborador,
            completado: false,
            completado_at: null,
            responsable_usuario_id: null
        }))


        const { error: insertError } = await supabase
            .from('tarea_step')
            .insert(tareasSteps)

        if (insertError) {
            return { success: false, pasosGenerados: 0, error: insertError.message }
        }

        return { success: true, pasosGenerados: tareasSteps.length }

    } catch (error) {
        return { success: false, pasosGenerados: 0, error: (error as Error).message }
    }
}

/**
 * Asignar responsable a un paso según el tipo de colaborador y el equipo
 */
export async function asignarResponsablePaso(
    supabaseUrl: string,
    supabaseKey: string,
    tareaStepId: string,
    equipoId: string,
    tipoColaborador: string // 'A', 'B', 'C'
): Promise<{ success: boolean; usuarioAsignado?: string; error?: string }> {

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        // Mapear tipo colaborador a rol
        const rolMap: Record<string, string> = {
            'A': 'AUXILIAR_A',
            'B': 'AUXILIAR_B',
            'C': 'AUXILIAR_C'
        }

        const rolBuscado = rolMap[tipoColaborador] || 'COLABORADOR'

        // Buscar miembro del equipo con ese rol
        const { data: miembros, error: miembrosError } = await supabase
            .from('team_members')
            .select('user_id, es_suplente')
            .eq('team_id', equipoId)
            .eq('rol_en_equipo', rolBuscado)
            .eq('es_suplente', false)
            .limit(1)

        if (miembrosError) {
            return { success: false, error: miembrosError.message }
        }

        if (!miembros || miembros.length === 0) {
            // Buscar suplente si no hay titular
            const { data: suplentes, error: suplentesError } = await supabase
                .from('team_members')
                .select('user_id')
                .eq('team_id', equipoId)
                .eq('rol_en_equipo', rolBuscado)
                .eq('es_suplente', true)
                .limit(1)

            if (suplentesError || !suplentes || suplentes.length === 0) {
                return { success: false, error: `No hay ${rolBuscado} disponible en el equipo` }
            }

            // Asignar suplente
            const { error: updateError } = await supabase
                .from('tarea_step')
                .update({ responsable_usuario_id: suplentes[0].user_id })
                .eq('id', tareaStepId)

            if (updateError) {
                return { success: false, error: updateError.message }
            }

            return { success: true, usuarioAsignado: suplentes[0].user_id }
        }

        // Asignar titular
        const { error: updateError } = await supabase
            .from('tarea_step')
            .update({ responsable_usuario_id: miembros[0].user_id })
            .eq('id', tareaStepId)

        if (updateError) {
            return { success: false, error: updateError.message }
        }

        return { success: true, usuarioAsignado: miembros[0].user_id }

    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
}

/**
 * Obtener pasos de una tarea con información completa
 */
export async function obtenerPasosTarea(
    supabaseUrl: string,
    supabaseKey: string,
    tareaId: string
): Promise<{
    pasos: Array<{
        id: string
        proceso_paso_id: string
        titulo: string
        orden: number
        peso_pct: number
        completado: boolean
        completado_at: string | null
        responsable: { nombre: string; email: string } | null
    }>
    error?: string
}> {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
        .from('tarea_step')
        .select(`
      tarea_step_id,
      proceso_paso_id,
      titulo,
      orden,
      peso_pct,
      completado,
      completado_at,
      users:responsable_usuario_id (nombre, email)
    `)
        .eq('tarea_id', tareaId)
        .order('orden', { ascending: true })

    if (error) {
        return { pasos: [], error: error.message }
    }

    return {
        pasos: (data || []).map(p => {
            let responsable: { nombre: string; email: string } | null = null
            if (p.users) {
                if (Array.isArray(p.users) && p.users.length > 0) {
                    const user = p.users[0] as UserInfo
                    responsable = { nombre: user.nombre, email: user.email }
                } else if (!Array.isArray(p.users)) {
                    const user = p.users as UserInfo
                    responsable = { nombre: user.nombre, email: user.email }
                }
            }
            return {
                id: p.tarea_step_id,
                proceso_paso_id: p.proceso_paso_id,
                titulo: p.titulo,
                orden: p.orden,
                peso_pct: p.peso_pct,
                completado: p.completado,
                completado_at: p.completado_at,
                responsable
            }
        })
    }

}
