import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCascadeFilters, CascadeFilterConfig } from './useCascadeFilters'

interface MockTask {
  id: string
  equipo_id: string
  equipo_nombre: string
  responsable_id: string
  responsable_nombre: string
  cliente_id: string
  cliente_nombre: string
  estado: string
}

const mockTasks: MockTask[] = [
  {
    id: '1',
    equipo_id: 'eq1',
    equipo_nombre: 'Equipo Fiscal',
    responsable_id: 'r1',
    responsable_nombre: 'Juan Pérez',
    cliente_id: 'c1',
    cliente_nombre: 'ACME Corp',
    estado: 'pendiente',
  },
  {
    id: '2',
    equipo_id: 'eq1',
    equipo_nombre: 'Equipo Fiscal',
    responsable_id: 'r1',
    responsable_nombre: 'Juan Pérez',
    cliente_id: 'c2',
    cliente_nombre: 'Beta Inc',
    estado: 'en_curso',
  },
  {
    id: '3',
    equipo_id: 'eq1',
    equipo_nombre: 'Equipo Fiscal',
    responsable_id: 'r2',
    responsable_nombre: 'María García',
    cliente_id: 'c1',
    cliente_nombre: 'ACME Corp',
    estado: 'completado',
  },
  {
    id: '4',
    equipo_id: 'eq2',
    equipo_nombre: 'Equipo Contable',
    responsable_id: 'r3',
    responsable_nombre: 'Carlos López',
    cliente_id: 'c3',
    cliente_nombre: 'Gamma SA',
    estado: 'pendiente',
  },
]

const mockConfig: CascadeFilterConfig<MockTask> = {
  getEquipo: (t) => t.equipo_id,
  getEquipoLabel: (t) => t.equipo_nombre,
  getColaborador: (t) => t.responsable_id,
  getColaboradorLabel: (t) => t.responsable_nombre,
  getCliente: (t) => t.cliente_id,
  getClienteLabel: (t) => t.cliente_nombre,
  getEstado: (t) => t.estado,
  getEstadoLabel: (t) => t.estado,
}

describe('useCascadeFilters', () => {
  it('should return all data when no filters applied', () => {
    const { result } = renderHook(() => useCascadeFilters(mockTasks, mockConfig))

    expect(result.current.filteredData).toHaveLength(4)
    expect(result.current.activeFilterCount).toBe(0)
  })

  it('should filter by equipo', () => {
    const { result } = renderHook(() => useCascadeFilters(mockTasks, mockConfig))

    act(() => {
      result.current.setFilter('equipo', 'eq1')
    })

    expect(result.current.filteredData).toHaveLength(3)
    expect(result.current.activeFilterCount).toBe(1)
    expect(result.current.filteredData.every((t) => t.equipo_id === 'eq1')).toBe(true)
  })

  it('should cascade: selecting equipo resets colaborador and cliente', () => {
    const { result } = renderHook(() => useCascadeFilters(mockTasks, mockConfig))

    // First select a colaborador
    act(() => {
      result.current.setFilter('colaborador', 'r1')
    })
    expect(result.current.filters.colaborador).toBe('r1')

    // Then select an equipo - colaborador should reset
    act(() => {
      result.current.setFilter('equipo', 'eq2')
    })
    expect(result.current.filters.equipo).toBe('eq2')
    expect(result.current.filters.colaborador).toBe('all')
  })

  it('should cascade: selecting colaborador resets cliente', () => {
    const { result } = renderHook(() => useCascadeFilters(mockTasks, mockConfig))

    // First select a cliente
    act(() => {
      result.current.setFilter('cliente', 'c1')
    })
    expect(result.current.filters.cliente).toBe('c1')

    // Then select a colaborador - cliente should reset
    act(() => {
      result.current.setFilter('colaborador', 'r2')
    })
    expect(result.current.filters.colaborador).toBe('r2')
    expect(result.current.filters.cliente).toBe('all')
  })

  it('should show only colaboradores from selected equipo', () => {
    const { result } = renderHook(() => useCascadeFilters(mockTasks, mockConfig))

    act(() => {
      result.current.setFilter('equipo', 'eq1')
    })

    // eq1 has r1 (Juan) and r2 (María)
    const colaboradorValues = result.current.options.colaboradores.map((c) => c.value)
    expect(colaboradorValues).toContain('r1')
    expect(colaboradorValues).toContain('r2')
    expect(colaboradorValues).not.toContain('r3') // Carlos is in eq2
  })

  it('should reset all filters', () => {
    const { result } = renderHook(() => useCascadeFilters(mockTasks, mockConfig))

    act(() => {
      result.current.setFilter('equipo', 'eq1')
      result.current.setFilter('estado', 'pendiente')
    })

    expect(result.current.activeFilterCount).toBe(2)

    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.filters.equipo).toBe('all')
    expect(result.current.filters.colaborador).toBe('all')
    expect(result.current.filters.cliente).toBe('all')
    expect(result.current.filters.estado).toBe('all')
    expect(result.current.activeFilterCount).toBe(0)
  })

  it('should filter by estado', () => {
    const { result } = renderHook(() => useCascadeFilters(mockTasks, mockConfig))

    act(() => {
      result.current.setFilter('estado', 'pendiente')
    })

    expect(result.current.filteredData).toHaveLength(2)
    expect(result.current.filteredData.every((t) => t.estado === 'pendiente')).toBe(true)
  })

  it('should combine multiple filters', () => {
    const { result } = renderHook(() => useCascadeFilters(mockTasks, mockConfig))

    act(() => {
      result.current.setFilter('equipo', 'eq1')
      result.current.setFilter('estado', 'pendiente')
    })

    // Only task 1 is in eq1 with estado pendiente
    expect(result.current.filteredData).toHaveLength(1)
    expect(result.current.filteredData[0].id).toBe('1')
  })
})
