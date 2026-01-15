/**
 * SGR-CBC Date Calculation Utilities
 *
 * Consolidated date functions used across the application.
 * Standardizes date handling for consistency in calculations and display.
 */

import { DIAS_PROXIMOS_VENCIMIENTO } from '../constants/thresholds'

// ============================================
// CONSTANTS
// ============================================

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24

/**
 * Locale for date formatting (Mexican Spanish)
 */
const DEFAULT_LOCALE = 'es-MX'

// ============================================
// CORE DATE CALCULATIONS
// ============================================

/**
 * Calculate remaining days until a deadline
 * Positive = days until deadline, Negative = days overdue
 *
 * @param fechaLimite - The deadline date
 * @returns Number of days remaining (negative if overdue)
 *
 * @example
 * calcularDiasRestantes(new Date('2026-01-20')) // returns 5 if today is Jan 15
 * calcularDiasRestantes(new Date('2026-01-10')) // returns -5 if today is Jan 15
 */
export function calcularDiasRestantes(fechaLimite: Date | string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const limite = typeof fechaLimite === 'string' ? new Date(fechaLimite) : new Date(fechaLimite)
  limite.setHours(0, 0, 0, 0)

  return Math.ceil((limite.getTime() - hoy.getTime()) / MILLISECONDS_PER_DAY)
}

/**
 * Calculate the difference in days between two dates
 *
 * @param fecha1 - First date
 * @param fecha2 - Second date
 * @returns Difference in days (positive if fecha1 > fecha2)
 *
 * @example
 * diferenciaEnDias(new Date('2026-01-20'), new Date('2026-01-15')) // returns 5
 */
export function diferenciaEnDias(fecha1: Date | string, fecha2: Date | string): number {
  const d1 = typeof fecha1 === 'string' ? new Date(fecha1) : new Date(fecha1)
  const d2 = typeof fecha2 === 'string' ? new Date(fecha2) : new Date(fecha2)

  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)

  return Math.floor((d1.getTime() - d2.getTime()) / MILLISECONDS_PER_DAY)
}

/**
 * Check if a date is overdue (past today)
 *
 * @param fecha - The date to check
 * @returns true if the date is in the past
 */
export function esFechaVencida(fecha: Date | string): boolean {
  return calcularDiasRestantes(fecha) < 0
}

/**
 * Check if a date is today
 *
 * @param fecha - The date to check
 * @returns true if the date is today
 */
export function esFechaHoy(fecha: Date | string): boolean {
  return calcularDiasRestantes(fecha) === 0
}

/**
 * Check if a date is within the "proximos dias" threshold
 *
 * @param fecha - The date to check
 * @param dias - Number of days threshold (default: DIAS_PROXIMOS_VENCIMIENTO)
 * @returns true if the date is within the threshold
 */
export function esProximoVencimiento(fecha: Date | string, dias = DIAS_PROXIMOS_VENCIMIENTO): boolean {
  const diasRestantes = calcularDiasRestantes(fecha)
  return diasRestantes > 0 && diasRestantes <= dias
}

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format a date for display
 *
 * @param fecha - The date to format
 * @param formato - Format type: 'corto', 'largo', 'iso', 'relativo'
 * @returns Formatted date string
 *
 * @example
 * formatearFecha(new Date(), 'corto') // "15 ene"
 * formatearFecha(new Date(), 'largo') // "15 de enero de 2026"
 * formatearFecha(new Date(), 'iso') // "2026-01-15"
 */
export function formatearFecha(
  fecha: Date | string | null | undefined,
  formato: 'corto' | 'largo' | 'iso' | 'relativo' | 'completo' = 'corto'
): string {
  if (!fecha) return '-'

  const date = typeof fecha === 'string' ? new Date(fecha) : fecha

  if (isNaN(date.getTime())) return '-'

  switch (formato) {
    case 'corto':
      return date.toLocaleDateString(DEFAULT_LOCALE, {
        day: '2-digit',
        month: 'short'
      })

    case 'largo':
      return date.toLocaleDateString(DEFAULT_LOCALE, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

    case 'completo':
      return date.toLocaleDateString(DEFAULT_LOCALE, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

    case 'iso':
      return date.toISOString().split('T')[0]

    case 'relativo':
      return formatearFechaRelativa(date)

    default:
      return date.toLocaleDateString(DEFAULT_LOCALE)
  }
}

/**
 * Format a date relative to today
 *
 * @param fecha - The date to format
 * @returns Relative description (e.g., "Hoy", "Manana", "Hace 2 dias")
 */
export function formatearFechaRelativa(fecha: Date | string): string {
  const dias = calcularDiasRestantes(fecha)

  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Manana'
  if (dias === -1) return 'Ayer'
  if (dias > 1 && dias <= 7) return `En ${dias} dias`
  if (dias < -1 && dias >= -7) return `Hace ${Math.abs(dias)} dias`
  if (dias > 7) return `En ${Math.ceil(dias / 7)} semanas`
  if (dias < -7) return `Hace ${Math.ceil(Math.abs(dias) / 7)} semanas`

  return formatearFecha(fecha, 'corto')
}

/**
 * Format a date with time
 *
 * @param fecha - The date to format
 * @returns Formatted date and time string
 */
export function formatearFechaHora(fecha: Date | string | null | undefined): string {
  if (!fecha) return '-'

  const date = typeof fecha === 'string' ? new Date(fecha) : fecha

  if (isNaN(date.getTime())) return '-'

  return date.toLocaleString(DEFAULT_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ============================================
// PERIOD CALCULATIONS
// ============================================

/**
 * Get the current period in YYYY-MM format
 *
 * @returns Current period string (e.g., "2026-01")
 */
export function obtenerPeriodoActual(): string {
  const hoy = new Date()
  const year = hoy.getFullYear()
  const month = String(hoy.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Get the previous period in YYYY-MM format
 *
 * @returns Previous period string (e.g., "2025-12")
 */
export function obtenerPeriodoAnterior(): string {
  const hoy = new Date()
  hoy.setMonth(hoy.getMonth() - 1)
  const year = hoy.getFullYear()
  const month = String(hoy.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Get a specific period relative to current
 *
 * @param offset - Number of months offset (negative for past, positive for future)
 * @returns Period string in YYYY-MM format
 */
export function obtenerPeriodoRelativo(offset: number): string {
  const fecha = new Date()
  fecha.setMonth(fecha.getMonth() + offset)
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Get the display name for a period
 *
 * @param periodo - Period in YYYY-MM format
 * @returns Formatted period name (e.g., "Enero 2026")
 */
export function obtenerNombrePeriodo(periodo: string): string {
  const [year, month] = periodo.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)

  return date.toLocaleDateString(DEFAULT_LOCALE, {
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Get the current fiscal year
 *
 * @returns Current year number
 */
export function obtenerEjercicioActual(): number {
  return new Date().getFullYear()
}

// ============================================
// DATE RANGE HELPERS
// ============================================

/**
 * Get the start and end dates for the current month
 */
export function obtenerRangoMesActual(): { inicio: Date; fin: Date } {
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)

  return { inicio, fin }
}

/**
 * Get the start and end dates for the current week (Monday to Sunday)
 */
export function obtenerRangoSemanaActual(): { inicio: Date; fin: Date } {
  const hoy = new Date()
  const diaSemana = hoy.getDay()
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana

  const inicio = new Date(hoy)
  inicio.setDate(hoy.getDate() + diffLunes)
  inicio.setHours(0, 0, 0, 0)

  const fin = new Date(inicio)
  fin.setDate(inicio.getDate() + 6)
  fin.setHours(23, 59, 59, 999)

  return { inicio, fin }
}

/**
 * Get dates for the next N days
 *
 * @param dias - Number of days to project
 * @returns Array of dates starting from today
 */
export function obtenerProximosDias(dias: number): Date[] {
  const resultado: Date[] = []
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  for (let i = 0; i <= dias; i++) {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() + i)
    resultado.push(fecha)
  }

  return resultado
}

// ============================================
// PRIORITY CATEGORY HELPERS
// (Used in mi-dia prioritization)
// ============================================

/**
 * Categoria de prioridad para tareas basada en fecha limite
 */
export type CategoriaPrioridadFecha = 'vencidas' | 'hoy' | 'proximos3dias' | 'bloqueadas' | 'resto'

/**
 * Determine the priority category for a task based on deadline
 *
 * @param fechaLimite - Task deadline
 * @param estaBloqueada - Whether task is blocked by client
 * @returns Priority category
 */
export function obtenerCategoriaPrioridad(
  fechaLimite: Date | string,
  estaBloqueada = false
): CategoriaPrioridadFecha {
  if (estaBloqueada) return 'bloqueadas'

  const diasRestantes = calcularDiasRestantes(fechaLimite)

  if (diasRestantes < 0) return 'vencidas'
  if (diasRestantes === 0) return 'hoy'
  if (diasRestantes <= DIAS_PROXIMOS_VENCIMIENTO) return 'proximos3dias'

  return 'resto'
}

/**
 * Get sort priority number for a category (lower = higher priority)
 */
export function obtenerOrdenPrioridad(categoria: CategoriaPrioridadFecha): number {
  switch (categoria) {
    case 'vencidas':
      return 1
    case 'hoy':
      return 2
    case 'proximos3dias':
      return 3
    case 'bloqueadas':
      return 4
    case 'resto':
      return 5
    default:
      return 99
  }
}

// ============================================
// BUSINESS DAY CALCULATIONS
// ============================================

/**
 * Check if a date is a weekend
 *
 * @param fecha - The date to check
 * @returns true if Saturday or Sunday
 */
export function esFinDeSemana(fecha: Date | string): boolean {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * Add business days to a date (excluding weekends)
 * Note: Does not account for holidays (use with dias_inhabiles table for that)
 *
 * @param fecha - Starting date
 * @param dias - Number of business days to add
 * @returns New date with business days added
 */
export function agregarDiasHabiles(fecha: Date | string, dias: number): Date {
  const result = typeof fecha === 'string' ? new Date(fecha) : new Date(fecha)
  let diasAgregados = 0

  while (diasAgregados < dias) {
    result.setDate(result.getDate() + 1)
    if (!esFinDeSemana(result)) {
      diasAgregados++
    }
  }

  return result
}

// ============================================
// TIMESTAMP HELPERS
// ============================================

/**
 * Get current timestamp in ISO format for database
 */
export function obtenerTimestampActual(): string {
  return new Date().toISOString()
}

/**
 * Parse an ISO timestamp string to Date
 *
 * @param timestamp - ISO timestamp string
 * @returns Date object or null if invalid
 */
export function parsearTimestamp(timestamp: string | null | undefined): Date | null {
  if (!timestamp) return null

  const date = new Date(timestamp)
  return isNaN(date.getTime()) ? null : date
}
