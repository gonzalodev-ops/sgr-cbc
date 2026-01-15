/**
 * SGR-CBC System Thresholds
 *
 * Configurable thresholds used throughout the application for alerts,
 * risk detection, workload management, and gamification.
 *
 * These values can be overridden by config_sistema table values at runtime.
 */

// ============================================
// RISK DETECTION THRESHOLDS
// ============================================

/**
 * Days after presentation without payment to trigger risk alert
 * Used in: riskDetector.ts, AlertasRiesgo.tsx
 */
export const DIAS_RIESGO_PRESENTACION = 3

/**
 * Days before deadline to show warning/urgent indicator
 * Used in: mi-dia/page.tsx, colaborador/page.tsx
 */
export const DIAS_ALERTA_VENCIMIENTO = 5

/**
 * Days before deadline to show critical warning (red alert)
 */
export const DIAS_CRITICO_VENCIMIENTO = 2

/**
 * Days threshold for "proximos dias" category in task prioritization
 */
export const DIAS_PROXIMOS_VENCIMIENTO = 3

// ============================================
// WORKLOAD THRESHOLDS
// ============================================

/**
 * Maximum active tasks per collaborator before overload warning
 * Used in: AlertasRiesgo.tsx, CargaEquipo.tsx
 */
export const CARGA_MAXIMA_COLABORADOR = 30

/**
 * Percentage above average to consider a collaborator "overloaded"
 * Used in: CargaEquipo.tsx
 */
export const PORCENTAJE_SOBRECARGA = 30

/**
 * Minimum tasks to consider for workload balancing calculations
 */
export const MINIMO_TAREAS_BALANCE = 5

/**
 * Maximum tasks to transfer in auto-reassignment
 */
export const MAXIMO_TAREAS_REASIGNACION = 5

// ============================================
// GAMIFICATION / POINTS THRESHOLDS
// ============================================

/**
 * Base points per completed task
 */
export const PUNTOS_TAREA_BASE = 10

/**
 * Bonus points for completing task before deadline
 */
export const PUNTOS_BONUS_ANTICIPADO = 5

/**
 * Penalty points for late task completion
 */
export const PUNTOS_PENALIZACION_TARDIO = -3

/**
 * Points multiplier for high priority tasks
 */
export const MULTIPLICADOR_PRIORIDAD_ALTA = 1.5

/**
 * Points multiplier for medium priority tasks
 */
export const MULTIPLICADOR_PRIORIDAD_MEDIA = 1.0

/**
 * Points multiplier for low priority tasks
 */
export const MULTIPLICADOR_PRIORIDAD_BAJA = 0.75

/**
 * Bonus points for no rework required
 */
export const PUNTOS_BONUS_SIN_RETRABAJO = 3

/**
 * Penalty points per rework iteration
 */
export const PUNTOS_PENALIZACION_RETRABAJO = -5

// ============================================
// AUDIT THRESHOLDS
// ============================================

/**
 * Default percentage of tasks to select for audit per period
 */
export const PORCENTAJE_AUDITORIA_DEFAULT = 10

/**
 * Minimum tasks to select for audit even if percentage is lower
 */
export const MINIMO_TAREAS_AUDITORIA = 3

/**
 * Maximum days to complete an audit after selection
 */
export const DIAS_LIMITE_AUDITORIA = 5

// ============================================
// SLA THRESHOLDS (in days)
// ============================================

/**
 * Default SLA for pending state
 */
export const SLA_PENDIENTE_DIAS = 2

/**
 * Default SLA for in-progress state
 */
export const SLA_EN_CURSO_DIAS = 3

/**
 * Default SLA for validation state
 */
export const SLA_EN_VALIDACION_DIAS = 1

/**
 * Default SLA for blocked by client state
 */
export const SLA_BLOQUEADO_DIAS = 5

// ============================================
// PAGINATION / UI THRESHOLDS
// ============================================

/**
 * Default page size for tables
 */
export const DEFAULT_PAGE_SIZE = 20

/**
 * Maximum items to show in alerts summary
 */
export const MAX_ALERTAS_MOSTRAR = 5

/**
 * Maximum items in quick lists before "ver mas"
 */
export const MAX_ITEMS_LISTA_RAPIDA = 10

/**
 * Query limit for database fetches
 */
export const QUERY_LIMIT = 1000

// ============================================
// SEGUIMIENTO THRESHOLDS
// ============================================

/**
 * Days without response before escalating seguimiento
 */
export const DIAS_ESCALAR_SEGUIMIENTO = 3

/**
 * Maximum open seguimientos per task before blocking
 */
export const MAX_SEGUIMIENTOS_ABIERTOS = 5

// ============================================
// HELPER OBJECT FOR RUNTIME OVERRIDES
// ============================================

/**
 * All thresholds in a single object for easy runtime override
 */
export const THRESHOLDS = {
  // Risk Detection
  diasRiesgoPresentacion: DIAS_RIESGO_PRESENTACION,
  diasAlertaVencimiento: DIAS_ALERTA_VENCIMIENTO,
  diasCriticoVencimiento: DIAS_CRITICO_VENCIMIENTO,
  diasProximosVencimiento: DIAS_PROXIMOS_VENCIMIENTO,

  // Workload
  cargaMaximaColaborador: CARGA_MAXIMA_COLABORADOR,
  porcentajeSobrecarga: PORCENTAJE_SOBRECARGA,
  minimoTareasBalance: MINIMO_TAREAS_BALANCE,
  maximoTareasReasignacion: MAXIMO_TAREAS_REASIGNACION,

  // Points
  puntosTareaBase: PUNTOS_TAREA_BASE,
  puntosBonusAnticipado: PUNTOS_BONUS_ANTICIPADO,
  puntosPenalizacionTardio: PUNTOS_PENALIZACION_TARDIO,
  multiplicadorPrioridadAlta: MULTIPLICADOR_PRIORIDAD_ALTA,
  multiplicadorPrioridadMedia: MULTIPLICADOR_PRIORIDAD_MEDIA,
  multiplicadorPrioridadBaja: MULTIPLICADOR_PRIORIDAD_BAJA,
  puntosBonusSinRetrabajo: PUNTOS_BONUS_SIN_RETRABAJO,
  puntosPenalizacionRetrabajo: PUNTOS_PENALIZACION_RETRABAJO,

  // Audit
  porcentajeAuditoriaDefault: PORCENTAJE_AUDITORIA_DEFAULT,
  minimoTareasAuditoria: MINIMO_TAREAS_AUDITORIA,
  diasLimiteAuditoria: DIAS_LIMITE_AUDITORIA,

  // SLA
  slaPendienteDias: SLA_PENDIENTE_DIAS,
  slaEnCursoDias: SLA_EN_CURSO_DIAS,
  slaEnValidacionDias: SLA_EN_VALIDACION_DIAS,
  slaBloqueadoDias: SLA_BLOQUEADO_DIAS,

  // Pagination
  defaultPageSize: DEFAULT_PAGE_SIZE,
  maxAlertasMostrar: MAX_ALERTAS_MOSTRAR,
  maxItemsListaRapida: MAX_ITEMS_LISTA_RAPIDA,
  queryLimit: QUERY_LIMIT,

  // Seguimiento
  diasEscalarSeguimiento: DIAS_ESCALAR_SEGUIMIENTO,
  maxSeguimientosAbiertos: MAX_SEGUIMIENTOS_ABIERTOS
} as const

/**
 * Type for threshold keys for type-safe access
 */
export type ThresholdKey = keyof typeof THRESHOLDS

/**
 * Get a threshold value, with optional runtime override from config
 */
export function getThreshold<K extends ThresholdKey>(
  key: K,
  configOverrides?: Partial<typeof THRESHOLDS>
): (typeof THRESHOLDS)[K] {
  if (configOverrides && key in configOverrides) {
    return configOverrides[key] as (typeof THRESHOLDS)[K]
  }
  return THRESHOLDS[key]
}

/**
 * Check if a task is at risk based on days without payment
 */
export function isEnRiesgoPago(diasSinPago: number, threshold = DIAS_RIESGO_PRESENTACION): boolean {
  return diasSinPago > threshold
}

/**
 * Check if a task is near deadline
 */
export function isProximoVencimiento(diasRestantes: number, threshold = DIAS_ALERTA_VENCIMIENTO): boolean {
  return diasRestantes > 0 && diasRestantes <= threshold
}

/**
 * Check if a collaborator is overloaded
 */
export function isSobrecargado(
  tareasActivas: number,
  promedioEquipo: number,
  umbralPorcentaje = PORCENTAJE_SOBRECARGA
): boolean {
  if (promedioEquipo === 0) return tareasActivas > CARGA_MAXIMA_COLABORADOR
  const porcentajeSobrePromedio = ((tareasActivas - promedioEquipo) / promedioEquipo) * 100
  return porcentajeSobrePromedio > umbralPorcentaje
}

/**
 * Calculate points for a completed task
 */
export function calcularPuntosTarea(
  tallaMultiplicador: number,
  prioridadMultiplicador: number,
  diasAnticipado: number,
  tieneRetrabajo: boolean
): number {
  let puntos = PUNTOS_TAREA_BASE * tallaMultiplicador * prioridadMultiplicador

  // Bonus/penalty por tiempo
  if (diasAnticipado > 0) {
    puntos += PUNTOS_BONUS_ANTICIPADO
  } else if (diasAnticipado < 0) {
    puntos += PUNTOS_PENALIZACION_TARDIO * Math.abs(diasAnticipado)
  }

  // Bonus/penalty por calidad
  if (!tieneRetrabajo) {
    puntos += PUNTOS_BONUS_SIN_RETRABAJO
  } else {
    puntos += PUNTOS_PENALIZACION_RETRABAJO
  }

  return Math.max(0, Math.round(puntos))
}
