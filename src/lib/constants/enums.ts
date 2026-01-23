/**
 * SGR-CBC System Enumerations
 *
 * Centralized enum definitions for consistent type safety across the application.
 * These enums mirror the database constraints and should be kept in sync with schema.sql
 */

// ============================================
// TASK/TAREA RELATED ENUMS
// ============================================

/**
 * Estados de una tarea en el flujo de trabajo
 * Matches: database.ts EstadoTarea type
 */
export enum EstadoTarea {
  PENDIENTE = 'pendiente',
  EN_CURSO = 'en_curso',
  PENDIENTE_EVIDENCIA = 'pendiente_evidencia',
  EN_VALIDACION = 'en_validacion',
  BLOQUEADO_CLIENTE = 'bloqueado_cliente',
  PRESENTADO = 'presentado',
  PAGADO = 'pagado',
  CERRADO = 'cerrado',
  RECHAZADO = 'rechazado'
}

/**
 * Niveles de prioridad para tareas
 */
export enum Prioridad {
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAJA = 'BAJA'
}

/**
 * Niveles de riesgo para tareas
 */
export enum NivelRiesgo {
  ALTO = 'ALTO',
  MEDIO = 'MEDIO',
  BAJO = 'BAJO'
}

// ============================================
// USER/ROL RELATED ENUMS
// ============================================

/**
 * Roles globales del sistema
 * Determina acceso a diferentes modulos y funcionalidades
 */
export enum RolGlobal {
  ADMIN = 'ADMIN',
  SOCIO = 'SOCIO',
  LIDER = 'LIDER',
  COLABORADOR = 'COLABORADOR',
  AUDITOR = 'AUDITOR'
}

/**
 * Roles dentro de un equipo
 */
export enum RolEnEquipo {
  LIDER = 'LIDER',
  AUXILIAR_A = 'AUXILIAR_A',
  AUXILIAR_B = 'AUXILIAR_B',
  AUXILIAR_C = 'AUXILIAR_C'
}

/**
 * Tipo de colaborador para asignacion de pasos
 * A: Senior, B: Mid, C: Junior
 */
export enum TipoColaborador {
  A = 'A',
  B = 'B',
  C = 'C'
}

// ============================================
// EVENT TYPES ENUMS
// ============================================

/**
 * Tipos de eventos registrados en tarea_evento
 */
export enum TipoEvento {
  CAMBIO_ESTADO = 'cambio_estado',
  REASIGNACION = 'reasignacion',
  REASIGNACION_AUTOMATICA = 'REASIGNACION_AUTOMATICA',
  CAMBIO_FECHA = 'CAMBIO_FECHA',
  ASIGNACION = 'asignacion',
  COMENTARIO = 'comentario',
  EVIDENCIA = 'evidencia',
  VALIDACION = 'validacion'
}

/**
 * Tipos de evento calendario para obligaciones
 */
export enum TipoEventoCalendario {
  MENSUAL = 'MENSUAL',
  ANUAL = 'ANUAL'
}

// ============================================
// SEGUIMIENTO/TRACKING ENUMS
// ============================================

/**
 * Categorias para pendientes de seguimiento
 */
export enum CategoriaSeguimiento {
  PAGO = 'PAGO',
  TRAMITE = 'TRAMITE',
  CAMBIO = 'CAMBIO',
  DOCUMENTACION = 'DOCUMENTACION',
  REQUERIMIENTO = 'REQUERIMIENTO',
  OTRO = 'OTRO'
}

/**
 * Prioridad de seguimiento
 */
export enum PrioridadSeguimiento {
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAJA = 'BAJA'
}

// ============================================
// OBLIGATION/ENTREGABLE ENUMS
// ============================================

/**
 * Tipo de persona fiscal
 */
export enum TipoPersona {
  PERSONA_FISICA = 'PF',
  PERSONA_MORAL = 'PM',
  AMBOS = 'AMBOS'
}

/**
 * Nivel de obligacion fiscal
 */
export enum NivelObligacion {
  FEDERAL = 'FEDERAL',
  ESTATAL = 'ESTATAL',
  SEGURIDAD_SOCIAL = 'SEGURIDAD_SOCIAL'
}

/**
 * Periodicidad de obligaciones
 */
export enum Periodicidad {
  MENSUAL = 'MENSUAL',
  ANUAL = 'ANUAL',
  EVENTUAL = 'EVENTUAL',
  POR_OPERACION = 'POR_OPERACION',
  PERMANENTE = 'PERMANENTE'
}

/**
 * Tipo de entregable
 */
export enum TipoEntregable {
  OBLIGACION = 'OBLIGACION',
  OPERATIVO = 'OPERATIVO',
  OTRO = 'OTRO'
}

/**
 * Categoria de proceso operativo
 */
export enum CategoriaProceso {
  RECURRENTE = 'RECURRENTE',
  EXTRAORDINARIO = 'EXTRAORDINARIO'
}

// ============================================
// DOCUMENT ENUMS
// ============================================

/**
 * Tipos de documento
 */
export enum TipoDocumento {
  ACUSE = 'ACUSE',
  PAPEL_TRABAJO = 'PAPEL_TRABAJO',
  XML = 'XML',
  PDF = 'PDF',
  ESTADO_CUENTA = 'ESTADO_CUENTA',
  COMPROBANTE_PAGO = 'COMPROBANTE_PAGO',
  OTRO = 'OTRO'
}

// ============================================
// CLIENT/TALLA ENUMS
// ============================================

/**
 * Estado del cliente
 */
export enum EstadoCliente {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO'
}

/**
 * Dominio de talla para servicios
 */
export enum DominioTalla {
  FISCAL = 'FISCAL',
  NOMINA = 'NOMINA',
  IMSS = 'IMSS'
}

/**
 * Identificadores de talla
 */
export enum TallaId {
  EXTRA_CHICA = 'EXTRA_CHICA',
  CHICA = 'CHICA',
  MEDIANA = 'MEDIANA',
  GRANDE = 'GRANDE',
  EXTRA_GRANDE = 'EXTRA_GRANDE'
}

/**
 * Ponderacion de talla (puntos base)
 */
export enum TallaPonderacion {
  EXTRA_CHICA = 50,
  CHICA = 75,
  MEDIANA = 100,
  GRANDE = 150,
  EXTRA_GRANDE = 200
}

// ============================================
// AUDIT/QUALITY ENUMS
// ============================================

/**
 * Tipos de hallazgo en auditoria
 */
export enum TipoHallazgo {
  ERROR_TECNICO = 'ERROR_TECNICO',
  DOCUMENTACION = 'DOCUMENTACION',
  PROCESO = 'PROCESO',
  COMUNICACION = 'COMUNICACION'
}

/**
 * Gravedad del hallazgo
 */
export enum GravedadHallazgo {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA'
}

/**
 * Estado de retrabajo
 */
export enum EstadoRetrabajo {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADO = 'COMPLETADO'
}

// ============================================
// UI HELPER CONSTANTS
// ============================================

/**
 * Configuracion de colores por estado de tarea para UI
 */
export const ESTADO_TAREA_CONFIG: Record<EstadoTarea, { label: string; bgColor: string; textColor: string }> = {
  [EstadoTarea.PENDIENTE]: { label: 'Pendiente', bgColor: 'bg-slate-100', textColor: 'text-slate-700' },
  [EstadoTarea.EN_CURSO]: { label: 'En Curso', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  [EstadoTarea.PENDIENTE_EVIDENCIA]: { label: 'Pend. Evidencia', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  [EstadoTarea.EN_VALIDACION]: { label: 'En Validacion', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  [EstadoTarea.BLOQUEADO_CLIENTE]: { label: 'Bloqueado', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  [EstadoTarea.PRESENTADO]: { label: 'Presentado', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  [EstadoTarea.PAGADO]: { label: 'Pagado', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  [EstadoTarea.CERRADO]: { label: 'Cerrado', bgColor: 'bg-slate-100', textColor: 'text-slate-500' },
  [EstadoTarea.RECHAZADO]: { label: 'Rechazado', bgColor: 'bg-red-100', textColor: 'text-red-700' }
}

/**
 * Configuracion de colores por nivel de riesgo
 */
export const NIVEL_RIESGO_CONFIG: Record<NivelRiesgo, { label: string; bgColor: string; textColor: string }> = {
  [NivelRiesgo.ALTO]: { label: 'Alto', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  [NivelRiesgo.MEDIO]: { label: 'Medio', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  [NivelRiesgo.BAJO]: { label: 'Bajo', bgColor: 'bg-green-100', textColor: 'text-green-700' }
}

/**
 * Configuracion de colores por prioridad
 */
export const PRIORIDAD_CONFIG: Record<Prioridad, { label: string; bgColor: string; textColor: string }> = {
  [Prioridad.ALTA]: { label: 'Alta', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  [Prioridad.MEDIA]: { label: 'Media', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  [Prioridad.BAJA]: { label: 'Baja', bgColor: 'bg-slate-100', textColor: 'text-slate-700' }
}

/**
 * Configuracion de colores por gravedad de hallazgo
 */
export const GRAVEDAD_CONFIG: Record<GravedadHallazgo, { label: string; bgColor: string; textColor: string }> = {
  [GravedadHallazgo.BAJA]: { label: 'Baja', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  [GravedadHallazgo.MEDIA]: { label: 'Media', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  [GravedadHallazgo.ALTA]: { label: 'Alta', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  [GravedadHallazgo.CRITICA]: { label: 'Critica', bgColor: 'bg-red-100', textColor: 'text-red-700' }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a value is a valid EstadoTarea
 */
export function isEstadoTarea(value: string): value is EstadoTarea {
  return Object.values(EstadoTarea).includes(value as EstadoTarea)
}

/**
 * Check if a value is a valid RolGlobal
 */
export function isRolGlobal(value: string): value is RolGlobal {
  return Object.values(RolGlobal).includes(value as RolGlobal)
}

/**
 * Get all estados that are considered "active" (not final states)
 */
export function getEstadosActivos(): EstadoTarea[] {
  return [
    EstadoTarea.PENDIENTE,
    EstadoTarea.EN_CURSO,
    EstadoTarea.PENDIENTE_EVIDENCIA,
    EstadoTarea.EN_VALIDACION,
    EstadoTarea.BLOQUEADO_CLIENTE,
    EstadoTarea.RECHAZADO
  ]
}

/**
 * Get all estados that are considered "final" (completed states)
 */
export function getEstadosFinales(): EstadoTarea[] {
  return [
    EstadoTarea.PRESENTADO,
    EstadoTarea.PAGADO,
    EstadoTarea.CERRADO
  ]
}

/**
 * Check if a estado is a final state
 */
export function isEstadoFinal(estado: EstadoTarea): boolean {
  return getEstadosFinales().includes(estado)
}

/**
 * Get roles that have elevated permissions (can view all data)
 */
export function getRolesElevados(): RolGlobal[] {
  return [RolGlobal.ADMIN, RolGlobal.SOCIO, RolGlobal.AUDITOR]
}

/**
 * Check if a rol has elevated permissions
 */
export function isRolElevado(rol: RolGlobal): boolean {
  return getRolesElevados().includes(rol)
}
