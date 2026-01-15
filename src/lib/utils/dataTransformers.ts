/**
 * SGR-CBC Data Transformation Utilities
 *
 * Helpers for transforming Supabase query results.
 * Handles the quirks of Supabase relations that can return
 * arrays or single objects depending on the query.
 *
 * Common patterns addressed:
 * - Relations sometimes return as arrays even for single items
 * - Null handling for optional relationships
 * - Type-safe extraction of nested data
 */

// ============================================
// RELATION NORMALIZATION
// ============================================

/**
 * Normalize a Supabase relation that may come as array or single object
 * Returns the first item if array, or the item itself if object, or null
 *
 * Use case: When you select a foreign key relation and it might return
 * as an array with one item or as a single object depending on the query.
 *
 * @param data - The relation data from Supabase
 * @returns Single object or null
 *
 * @example
 * const cliente = normalizeRelation(tarea.cliente)
 * // If tarea.cliente was [{ nombre: 'ABC' }], returns { nombre: 'ABC' }
 * // If tarea.cliente was { nombre: 'ABC' }, returns { nombre: 'ABC' }
 * // If tarea.cliente was null or [], returns null
 */
export function normalizeRelation<T>(data: T | T[] | null | undefined): T | null {
  if (data === null || data === undefined) {
    return null
  }

  if (Array.isArray(data)) {
    return data.length > 0 ? data[0] : null
  }

  return data
}

/**
 * Normalize a Supabase relation to always return an array
 * Ensures consistent handling whether result is array or single object
 *
 * @param data - The relation data from Supabase
 * @returns Array of items (empty array if null/undefined)
 *
 * @example
 * const tareas = normalizeRelationArray(user.tareas)
 * // Always returns an array, even if source was single object or null
 */
export function normalizeRelationArray<T>(data: T | T[] | null | undefined): T[] {
  if (data === null || data === undefined) {
    return []
  }

  if (Array.isArray(data)) {
    return data
  }

  return [data]
}

/**
 * Extract the first item from a potential array or single value
 * Alias for normalizeRelation with a more intuitive name
 *
 * @param data - Data that might be array or single item
 * @returns First item or null
 */
export function extractFirst<T>(data: T | T[] | null | undefined): T | null {
  return normalizeRelation(data)
}

/**
 * Ensure data is always an array (safe array access)
 * Alias for normalizeRelationArray with a more intuitive name
 *
 * @param data - Data that might be array or single item
 * @returns Array (empty if null/undefined)
 */
export function safeArray<T>(data: T | T[] | null | undefined): T[] {
  return normalizeRelationArray(data)
}

// ============================================
// NESTED PROPERTY ACCESS
// ============================================

/**
 * Safely get a nested property from a normalized relation
 *
 * @param data - The relation data
 * @param key - Property key to extract
 * @returns The property value or undefined
 *
 * @example
 * const nombreCliente = getNestedProperty(tarea.cliente, 'nombre_comercial')
 */
export function getNestedProperty<T, K extends keyof T>(
  data: T | T[] | null | undefined,
  key: K
): T[K] | undefined {
  const normalized = normalizeRelation(data)
  return normalized?.[key]
}

/**
 * Safely get a deeply nested property
 *
 * @param data - The data object
 * @param path - Dot-separated path (e.g., 'cliente.nombre_comercial')
 * @returns The value at path or undefined
 *
 * @example
 * const nombre = getDeepProperty(tarea, 'cliente.nombre_comercial')
 */
export function getDeepProperty<T = unknown>(
  data: Record<string, unknown> | null | undefined,
  path: string
): T | undefined {
  if (!data || !path) return undefined

  const keys = path.split('.')
  let current: unknown = data

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined
    }

    // Handle arrays
    if (Array.isArray(current)) {
      current = current[0]
      if (current === null || current === undefined) {
        return undefined
      }
    }

    current = (current as Record<string, unknown>)[key]
  }

  return current as T
}

// ============================================
// TAREA-SPECIFIC TRANSFORMERS
// ============================================

/**
 * Interface for raw tarea data from Supabase with relations
 */
interface TareaRaw {
  tarea_id: string
  estado: string
  fecha_limite_oficial: string
  prioridad: string
  cliente?: { nombre_comercial: string } | { nombre_comercial: string }[] | null
  contribuyente?: { rfc: string } | { rfc: string }[] | null
  obligacion?: { nombre_corto: string } | { nombre_corto: string }[] | null
  periodicidad?: { nombre: string } | { nombre: string }[] | null
  responsable?: { nombre: string } | { nombre: string }[] | null
  [key: string]: unknown
}

/**
 * Interface for normalized tarea data
 */
interface TareaNormalized {
  tarea_id: string
  estado: string
  fecha_limite_oficial: string
  prioridad: string
  cliente: { nombre_comercial: string } | null
  contribuyente: { rfc: string } | null
  obligacion: { nombre_corto: string } | null
  periodicidad?: { nombre: string } | null
  responsable?: { nombre: string } | null
  [key: string]: unknown
}

/**
 * Transform raw Supabase tarea data with normalized relations
 *
 * @param tareaRaw - Raw tarea from Supabase query
 * @returns Tarea with normalized relation objects
 *
 * @example
 * const tareas = tareasData.map(normalizeTarea)
 */
export function normalizeTarea(tareaRaw: TareaRaw): TareaNormalized {
  return {
    ...tareaRaw,
    cliente: normalizeRelation(tareaRaw.cliente),
    contribuyente: normalizeRelation(tareaRaw.contribuyente),
    obligacion: normalizeRelation(tareaRaw.obligacion),
    periodicidad: normalizeRelation(tareaRaw.periodicidad),
    responsable: normalizeRelation(tareaRaw.responsable)
  }
}

/**
 * Batch normalize an array of tareas
 *
 * @param tareasRaw - Array of raw tareas
 * @returns Array of normalized tareas
 */
export function normalizeTareas(tareasRaw: TareaRaw[]): TareaNormalized[] {
  return tareasRaw.map(normalizeTarea)
}

// ============================================
// USER/TEAM TRANSFORMERS
// ============================================

/**
 * Interface for raw user data with team relations
 */
interface UserWithTeamRaw {
  user_id: string
  nombre: string
  email: string
  rol_global: string
  team_members?: Array<{
    teams?: { nombre: string } | { nombre: string }[] | null
    rol_en_equipo?: string
  }> | null
  [key: string]: unknown
}

/**
 * Interface for normalized user with team info
 */
interface UserWithTeamNormalized {
  user_id: string
  nombre: string
  email: string
  rol_global: string
  equipo: string | null
  rol_en_equipo: string | null
  [key: string]: unknown
}

/**
 * Transform raw user data with team relations
 *
 * @param userRaw - Raw user from Supabase query
 * @returns User with flattened team info
 */
export function normalizeUserWithTeam(userRaw: UserWithTeamRaw): UserWithTeamNormalized {
  const teamMember = userRaw.team_members?.[0]
  const teamsData = teamMember?.teams

  // Handle teams data that might be array or object
  const teamName = Array.isArray(teamsData)
    ? teamsData[0]?.nombre
    : teamsData?.nombre

  return {
    ...userRaw,
    equipo: teamName || null,
    rol_en_equipo: teamMember?.rol_en_equipo || null
  }
}

// ============================================
// GENERIC OBJECT TRANSFORMERS
// ============================================

/**
 * Pick specific keys from an object
 *
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns New object with only specified keys
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Omit specific keys from an object
 *
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns New object without specified keys
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  for (const key of keys) {
    delete result[key]
  }
  return result as Omit<T, K>
}

// ============================================
// NULL SAFETY HELPERS
// ============================================

/**
 * Get value with fallback if null/undefined
 *
 * @param value - The value to check
 * @param fallback - Fallback value
 * @returns Value or fallback
 */
export function valueOrDefault<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback
}

/**
 * Get string value with fallback
 * Common case for displaying names/labels
 *
 * @param value - String value that might be null
 * @param fallback - Fallback string (default: '-')
 * @returns String value or fallback
 */
export function stringOrDefault(value: string | null | undefined, fallback = '-'): string {
  return value || fallback
}

/**
 * Get number value with fallback
 *
 * @param value - Number value that might be null
 * @param fallback - Fallback number (default: 0)
 * @returns Number value or fallback
 */
export function numberOrDefault(value: number | null | undefined, fallback = 0): number {
  return value ?? fallback
}

// ============================================
// ARRAY HELPERS
// ============================================

/**
 * Group an array by a key
 *
 * @param array - Array to group
 * @param key - Key to group by
 * @returns Object with arrays grouped by key value
 */
export function groupBy<T extends Record<string, unknown>>(
  array: T[],
  key: keyof T
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Count occurrences by a key
 *
 * @param array - Array to count
 * @param key - Key to count by
 * @returns Object with counts per key value
 */
export function countBy<T extends Record<string, unknown>>(
  array: T[],
  key: keyof T
): Record<string, number> {
  return array.reduce((counts, item) => {
    const countKey = String(item[key])
    counts[countKey] = (counts[countKey] || 0) + 1
    return counts
  }, {} as Record<string, number>)
}

/**
 * Remove duplicates from array by a key
 *
 * @param array - Array with potential duplicates
 * @param key - Key to check uniqueness
 * @returns Array with unique items
 */
export function uniqueBy<T extends Record<string, unknown>>(
  array: T[],
  key: keyof T
): T[] {
  const seen = new Set<unknown>()
  return array.filter((item) => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Check if value is not null or undefined
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Check if value is a non-empty array
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Filter out null/undefined values from array
 */
export function filterNullish<T>(array: (T | null | undefined)[]): T[] {
  return array.filter(isNotNullish)
}
