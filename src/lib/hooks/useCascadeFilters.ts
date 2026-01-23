'use client'

import { useState, useMemo, useCallback } from 'react'

// Types
export interface FilterOption {
  value: string
  label: string
}

export interface CascadeFilterState {
  equipo: string
  colaborador: string
  cliente: string
  estado: string
}

export interface CascadeFilterOptions {
  equipos: FilterOption[]
  colaboradores: FilterOption[]
  clientes: FilterOption[]
  estados: FilterOption[]
}

export interface CascadeFilterConfig<T> {
  getEquipo: (item: T) => string | null
  getColaborador: (item: T) => string | null
  getCliente: (item: T) => string | null
  getEstado: (item: T) => string
  getEquipoLabel?: (item: T) => string | null
  getColaboradorLabel?: (item: T) => string | null
  getClienteLabel?: (item: T) => string | null
  getEstadoLabel?: (item: T) => string
}

export interface CascadeFilterResult<T> {
  filters: CascadeFilterState
  setFilter: (key: keyof CascadeFilterState, value: string) => void
  resetFilters: () => void
  options: CascadeFilterOptions
  filteredData: T[]
  activeFilterCount: number
}

const INITIAL_FILTERS: CascadeFilterState = {
  equipo: 'all',
  colaborador: 'all',
  cliente: 'all',
  estado: 'all'
}

/**
 * Hook para filtros cascada/dinámicos
 * Cuando se selecciona un filtro, los filtros dependientes se recalculan
 */
export function useCascadeFilters<T>(
  data: T[],
  config: CascadeFilterConfig<T>
): CascadeFilterResult<T> {
  const [filters, setFilters] = useState<CascadeFilterState>(INITIAL_FILTERS)

  // Setter con lógica de cascada
  const setFilter = useCallback((key: keyof CascadeFilterState, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value }

      // Cascada: resetear filtros dependientes
      if (key === 'equipo') {
        next.colaborador = 'all'
        next.cliente = 'all'
      } else if (key === 'colaborador') {
        next.cliente = 'all'
      }

      return next
    })
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS)
  }, [])

  // Calcular opciones dinámicamente
  const options = useMemo(() => {
    // Equipos: siempre todos los disponibles
    const equiposMap = new Map<string, string>()
    data.forEach(item => {
      const id = config.getEquipo(item)
      const label = config.getEquipoLabel?.(item) ?? id
      if (id && label) equiposMap.set(id, label)
    })
    const equipos: FilterOption[] = Array.from(equiposMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))

    // Datos filtrados por equipo (para calcular colaboradores)
    const dataByEquipo = filters.equipo === 'all'
      ? data
      : data.filter(item => config.getEquipo(item) === filters.equipo)

    // Colaboradores: filtrados por equipo seleccionado
    const colaboradoresMap = new Map<string, string>()
    dataByEquipo.forEach(item => {
      const id = config.getColaborador(item)
      const label = config.getColaboradorLabel?.(item) ?? id
      if (id && label) colaboradoresMap.set(id, label)
    })
    const colaboradores: FilterOption[] = Array.from(colaboradoresMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))

    // Datos filtrados por colaborador (para calcular clientes)
    const dataByColaborador = filters.colaborador === 'all'
      ? dataByEquipo
      : dataByEquipo.filter(item => config.getColaborador(item) === filters.colaborador)

    // Clientes: filtrados por colaborador seleccionado
    const clientesMap = new Map<string, string>()
    dataByColaborador.forEach(item => {
      const id = config.getCliente(item)
      const label = config.getClienteLabel?.(item) ?? id
      if (id && label) clientesMap.set(id, label)
    })
    const clientes: FilterOption[] = Array.from(clientesMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))

    // Estados: siempre todos los disponibles (no depende de cascada)
    const estadosMap = new Map<string, string>()
    data.forEach(item => {
      const id = config.getEstado(item)
      const label = config.getEstadoLabel?.(item) ?? id
      if (id) estadosMap.set(id, label)
    })
    const estados: FilterOption[] = Array.from(estadosMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))

    return { equipos, colaboradores, clientes, estados }
  }, [data, filters.equipo, filters.colaborador, config])

  // Datos filtrados
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.equipo !== 'all' && config.getEquipo(item) !== filters.equipo) return false
      if (filters.colaborador !== 'all' && config.getColaborador(item) !== filters.colaborador) return false
      if (filters.cliente !== 'all' && config.getCliente(item) !== filters.cliente) return false
      if (filters.estado !== 'all' && config.getEstado(item) !== filters.estado) return false
      return true
    })
  }, [data, filters, config])

  // Contador de filtros activos
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== 'all').length
  }, [filters])

  return {
    filters,
    setFilter,
    resetFilters,
    options,
    filteredData,
    activeFilterCount
  }
}

export default useCascadeFilters
