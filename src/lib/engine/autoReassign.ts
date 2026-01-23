import { createClient } from '@supabase/supabase-js'

interface ReasignacionResult {
  success: boolean
  reasignadas: number
  errores: string[]
  detalles?: {
    tareaId: string
    clienteNombre: string
    obligacionNombre: string
    nuevoResponsable: string
  }[]
}

/**
 * Motor de reasignación automática de tareas
 * Reasigna todas las tareas pendientes de un colaborador ausente
 *
 * @param supabaseUrl - URL de Supabase
 * @param supabaseKey - Service role key de Supabase
 * @param colaboradorId - UUID del colaborador ausente
 * @param suplenteId - UUID del suplente (opcional)
 * @returns Resultado de la operación con cantidad de tareas reasignadas
 */
export async function reasignarTareasDeColaborador(
  supabaseUrl: string,
  supabaseKey: string,
  colaboradorId: string,
  suplenteId?: string
): Promise<ReasignacionResult> {
  const supabase = createClient(supabaseUrl, supabaseKey)
  const errores: string[] = []
  let reasignadas = 0
  const detalles: ReasignacionResult['detalles'] = []

  try {
    // 1. Obtener información del colaborador ausente
    const { data: colaborador, error: colabError } = await supabase
      .from('users')
      .select('user_id, nombre, email')
      .eq('user_id', colaboradorId)
      .single()

    if (colabError || !colaborador) {
      return {
        success: false,
        reasignadas: 0,
        errores: [`Colaborador no encontrado: ${colabError?.message || 'ID inválido'}`]
      }
    }

    // 2. Buscar tareas pendientes/activas del colaborador
    // Solo reasignamos tareas que no estén finalizadas
    const estadosActivos = ['pendiente', 'en_curso', 'pendiente_evidencia', 'en_validacion', 'bloqueado_cliente']

    const { data: tareasPendientes, error: tareasError } = await supabase
      .from('tarea')
      .select(`
        tarea_id,
        estado,
        cliente_id,
        contribuyente_id,
        id_obligacion,
        periodo_fiscal,
        cliente:cliente_id (
          nombre_comercial
        ),
        obligacion_fiscal:id_obligacion (
          nombre_corto
        ),
        contribuyente:contribuyente_id (
          rfc,
          team_id
        )
      `)
      .eq('responsable_usuario_id', colaboradorId)
      .in('estado', estadosActivos)

    if (tareasError) {
      return {
        success: false,
        reasignadas: 0,
        errores: [`Error al buscar tareas: ${tareasError.message}`]
      }
    }

    if (!tareasPendientes || tareasPendientes.length === 0) {
      return {
        success: true,
        reasignadas: 0,
        errores: [`El colaborador ${colaborador.nombre} no tiene tareas activas para reasignar`]
      }
    }

    // 3. Determinar el nuevo responsable
    let nuevoResponsableId: string
    let nuevoResponsableNombre: string

    if (suplenteId) {
      // Si se especificó un suplente, usarlo
      const { data: suplente, error: suplenteError } = await supabase
        .from('users')
        .select('user_id, nombre, activo')
        .eq('user_id', suplenteId)
        .single()

      if (suplenteError || !suplente) {
        return {
          success: false,
          reasignadas: 0,
          errores: [`Suplente no encontrado: ${suplenteError?.message || 'ID inválido'}`]
        }
      }

      if (!suplente.activo) {
        return {
          success: false,
          reasignadas: 0,
          errores: [`El suplente ${suplente.nombre} no está activo`]
        }
      }

      nuevoResponsableId = suplente.user_id
      nuevoResponsableNombre = suplente.nombre
    } else {
      // Si no hay suplente, buscar al líder del equipo del colaborador
      const { data: miembroEquipo, error: equipoError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams:team_id (
            nombre
          )
        `)
        .eq('user_id', colaboradorId)
        .eq('activo', true)
        .single()

      if (equipoError || !miembroEquipo) {
        return {
          success: false,
          reasignadas: 0,
          errores: [`El colaborador ${colaborador.nombre} no pertenece a ningún equipo activo`]
        }
      }

      // Buscar al líder del equipo
      const { data: lider, error: liderError } = await supabase
        .from('team_members')
        .select(`
          user_id,
          users:user_id (
            nombre,
            activo
          )
        `)
        .eq('team_id', miembroEquipo.team_id)
        .eq('rol_en_equipo', 'LIDER')
        .eq('activo', true)
        .single()

      if (liderError || !lider) {
        return {
          success: false,
          reasignadas: 0,
          errores: [`No se encontró un líder activo en el equipo del colaborador`]
        }
      }

      const liderUser = lider.users as { nombre: string; activo: boolean } | { nombre: string; activo: boolean }[] | null
      const liderData = Array.isArray(liderUser) ? liderUser[0] : liderUser
      if (!liderData?.activo) {
        return {
          success: false,
          reasignadas: 0,
          errores: [`El líder del equipo no está activo`]
        }
      }

      nuevoResponsableId = lider.user_id
      nuevoResponsableNombre = liderData?.nombre || 'Líder'
    }

    // 4. Reasignar cada tarea
    for (const tarea of tareasPendientes) {
      try {
        // Actualizar responsable de la tarea
        const { error: updateError } = await supabase
          .from('tarea')
          .update({
            responsable_usuario_id: nuevoResponsableId,
            updated_at: new Date().toISOString()
          })
          .eq('tarea_id', tarea.tarea_id)

        if (updateError) {
          const obligacionRaw = tarea.obligacion_fiscal as unknown
          const obligacionData = Array.isArray(obligacionRaw)
            ? (obligacionRaw[0] as { nombre_corto: string } | undefined)
            : (obligacionRaw as { nombre_corto: string } | null)
          errores.push(
            `Error al reasignar tarea ${tarea.tarea_id} (${obligacionData?.nombre_corto}): ${updateError.message}`
          )
          continue
        }

        // Registrar evento de reasignación
        const { error: eventoError } = await supabase
          .from('tarea_evento')
          .insert({
            tarea_id: tarea.tarea_id,
            tipo_evento: 'REASIGNACION_AUTOMATICA',
            actor_usuario_id: colaboradorId,
            occurred_at: new Date().toISOString(),
            metadata_json: {
              colaborador_ausente: colaborador.nombre,
              colaborador_ausente_id: colaboradorId,
              nuevo_responsable: nuevoResponsableNombre,
              nuevo_responsable_id: nuevoResponsableId,
              motivo: suplenteId ? 'Ausencia con suplente definido' : 'Ausencia sin suplente, reasignado a líder de equipo',
              fecha_reasignacion: new Date().toISOString()
            }
          })

        if (eventoError) {
          errores.push(
            `Tarea ${tarea.tarea_id} reasignada pero no se pudo registrar el evento: ${eventoError.message}`
          )
        }

        reasignadas++
        const clienteRaw = tarea.cliente as unknown
        const clienteData = Array.isArray(clienteRaw)
          ? (clienteRaw[0] as { nombre_comercial: string } | undefined)
          : (clienteRaw as { nombre_comercial: string } | null)
        const obligacionFiscalRaw = tarea.obligacion_fiscal as unknown
        const obligacionFiscalData = Array.isArray(obligacionFiscalRaw)
          ? (obligacionFiscalRaw[0] as { nombre_corto: string } | undefined)
          : (obligacionFiscalRaw as { nombre_corto: string } | null)
        detalles.push({
          tareaId: tarea.tarea_id,
          clienteNombre: clienteData?.nombre_comercial || 'N/A',
          obligacionNombre: obligacionFiscalData?.nombre_corto || 'N/A',
          nuevoResponsable: nuevoResponsableNombre
        })

      } catch (error) {
        errores.push(
          `Error procesando tarea ${tarea.tarea_id}: ${(error as Error).message}`
        )
      }
    }

    return {
      success: errores.length === 0,
      reasignadas,
      errores: errores.length > 0 ? errores : [],
      detalles
    }

  } catch (error) {
    return {
      success: false,
      reasignadas: 0,
      errores: [`Error general: ${(error as Error).message}`]
    }
  }
}

/**
 * Procesar ausencias activas y reasignar tareas
 * Útil para ejecución automática (cron job)
 *
 * @param supabaseUrl - URL de Supabase
 * @param supabaseKey - Service role key de Supabase
 * @returns Resultado con resumen de reasignaciones
 */
export async function procesarAusenciasActivas(
  supabaseUrl: string,
  supabaseKey: string
): Promise<{
  success: boolean
  ausenciasProcesadas: number
  totalReasignadas: number
  errores: string[]
}> {
  const supabase = createClient(supabaseUrl, supabaseKey)
  const errores: string[] = []
  let ausenciasProcesadas = 0
  let totalReasignadas = 0

  try {
    const hoy = new Date().toISOString().split('T')[0]

    // Buscar ausencias activas que incluyan la fecha de hoy
    const { data: ausenciasActivas, error: ausenciasError } = await supabase
      .from('ausencia')
      .select(`
        ausencia_id,
        colaborador_id,
        suplente_id,
        tipo,
        fecha_inicio,
        fecha_fin,
        users:colaborador_id (
          nombre
        )
      `)
      .eq('activo', true)
      .lte('fecha_inicio', hoy)
      .gte('fecha_fin', hoy)

    if (ausenciasError) {
      return {
        success: false,
        ausenciasProcesadas: 0,
        totalReasignadas: 0,
        errores: [`Error al buscar ausencias: ${ausenciasError.message}`]
      }
    }

    if (!ausenciasActivas || ausenciasActivas.length === 0) {
      return {
        success: true,
        ausenciasProcesadas: 0,
        totalReasignadas: 0,
        errores: ['No hay ausencias activas para procesar']
      }
    }

    // Procesar cada ausencia
    for (const ausencia of ausenciasActivas) {
      try {
        const resultado = await reasignarTareasDeColaborador(
          supabaseUrl,
          supabaseKey,
          ausencia.colaborador_id,
          ausencia.suplente_id || undefined
        )

        if (resultado.success) {
          ausenciasProcesadas++
          totalReasignadas += resultado.reasignadas
        } else {
          const ausenciaUserRaw = ausencia.users as unknown
          const ausenciaUserData = Array.isArray(ausenciaUserRaw)
            ? (ausenciaUserRaw[0] as { nombre: string } | undefined)
            : (ausenciaUserRaw as { nombre: string } | null)
          errores.push(
            `Ausencia de ${ausenciaUserData?.nombre}: ${resultado.errores.join(', ')}`
          )
        }
      } catch (error) {
        errores.push(
          `Error procesando ausencia ${ausencia.ausencia_id}: ${(error as Error).message}`
        )
      }
    }

    return {
      success: errores.length === 0,
      ausenciasProcesadas,
      totalReasignadas,
      errores: errores.length > 0 ? errores : []
    }

  } catch (error) {
    return {
      success: false,
      ausenciasProcesadas: 0,
      totalReasignadas: 0,
      errores: [`Error general: ${(error as Error).message}`]
    }
  }
}
