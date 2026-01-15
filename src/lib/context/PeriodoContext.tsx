'use client'

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

// Types
export type PeriodoSeleccionado = string | 'AMBOS' // "2025-12" | "2026-01" | "AMBOS"

export interface PeriodoContextType {
  periodoSeleccionado: PeriodoSeleccionado
  periodosDisponibles: string[]
  setPeriodo: (periodo: PeriodoSeleccionado) => void
  periodoEnConclusion: string // previous month
  periodoCorriente: string // current month
  // Helper functions
  isPeriodoAmbos: boolean
  getPeriodoLabel: (periodo: string) => string
  getPeriodoRange: () => { inicio: Date; fin: Date }
}

// localStorage key for persistence
const STORAGE_KEY = 'sgr-cbc-periodo-seleccionado'

// Default context value
const defaultContext: PeriodoContextType = {
  periodoSeleccionado: '',
  periodosDisponibles: [],
  setPeriodo: () => {},
  periodoEnConclusion: '',
  periodoCorriente: '',
  isPeriodoAmbos: false,
  getPeriodoLabel: () => '',
  getPeriodoRange: () => ({ inicio: new Date(), fin: new Date() }),
}

// Create context
const PeriodoContext = createContext<PeriodoContextType>(defaultContext)

// Helper functions
function formatPeriodo(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function getPreviousMonth(date: Date): Date {
  const prev = new Date(date)
  prev.setMonth(prev.getMonth() - 1)
  return prev
}

function generatePeriodosDisponibles(): string[] {
  const periodos: string[] = []
  const today = new Date()

  // Generate last 6 months plus current month
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setMonth(date.getMonth() - i)
    periodos.push(formatPeriodo(date))
  }

  return periodos
}

function getPeriodoLabelImpl(periodo: string): string {
  if (periodo === 'AMBOS') return 'Ambos Periodos'

  const [year, month] = periodo.split('-')
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  const monthIndex = parseInt(month, 10) - 1
  return `${monthNames[monthIndex]} ${year}`
}

// Provider props
interface PeriodoProviderProps {
  children: React.ReactNode
  defaultPeriodo?: PeriodoSeleccionado
}

// Provider component
export function PeriodoProvider({ children, defaultPeriodo }: PeriodoProviderProps) {
  const today = useMemo(() => new Date(), [])

  // Calculate current and previous periods
  const periodoCorriente = useMemo(() => formatPeriodo(today), [today])
  const periodoEnConclusion = useMemo(() => formatPeriodo(getPreviousMonth(today)), [today])

  // Generate available periods
  const periodosDisponibles = useMemo(() => generatePeriodosDisponibles(), [])

  // Initialize state with localStorage or default
  const [periodoSeleccionado, setPeriodoState] = useState<PeriodoSeleccionado>(() => {
    // Don't access localStorage during SSR
    if (typeof window === 'undefined') {
      return defaultPeriodo || periodoCorriente
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && (stored === 'AMBOS' || periodosDisponibles.includes(stored))) {
        return stored
      }
    } catch (error) {
      console.error('Error reading periodo from localStorage:', error)
    }

    return defaultPeriodo || periodoCorriente
  })

  // Sync with localStorage on client side
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && (stored === 'AMBOS' || periodosDisponibles.includes(stored))) {
        if (stored !== periodoSeleccionado) {
          setPeriodoState(stored)
        }
      }
    } catch (error) {
      console.error('Error syncing periodo from localStorage:', error)
    }
  }, [periodosDisponibles]) // Only run once on mount

  // Persist to localStorage when period changes
  const setPeriodo = useCallback((periodo: PeriodoSeleccionado) => {
    setPeriodoState(periodo)

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, periodo)
      } catch (error) {
        console.error('Error saving periodo to localStorage:', error)
      }
    }
  }, [])

  // Helper: check if "AMBOS" is selected
  const isPeriodoAmbos = periodoSeleccionado === 'AMBOS'

  // Helper: get period label
  const getPeriodoLabel = useCallback((periodo: string): string => {
    return getPeriodoLabelImpl(periodo)
  }, [])

  // Helper: get date range for current selection
  const getPeriodoRange = useCallback((): { inicio: Date; fin: Date } => {
    if (periodoSeleccionado === 'AMBOS') {
      // Return range covering both previous and current month
      const [prevYear, prevMonth] = periodoEnConclusion.split('-').map(Number)
      const [currYear, currMonth] = periodoCorriente.split('-').map(Number)

      const inicio = new Date(prevYear, prevMonth - 1, 1)
      const fin = new Date(currYear, currMonth, 0) // Last day of current month

      return { inicio, fin }
    }

    const [year, month] = periodoSeleccionado.split('-').map(Number)
    const inicio = new Date(year, month - 1, 1)
    const fin = new Date(year, month, 0) // Last day of the month

    return { inicio, fin }
  }, [periodoSeleccionado, periodoEnConclusion, periodoCorriente])

  // Build context value
  const contextValue = useMemo<PeriodoContextType>(() => ({
    periodoSeleccionado,
    periodosDisponibles,
    setPeriodo,
    periodoEnConclusion,
    periodoCorriente,
    isPeriodoAmbos,
    getPeriodoLabel,
    getPeriodoRange,
  }), [
    periodoSeleccionado,
    periodosDisponibles,
    setPeriodo,
    periodoEnConclusion,
    periodoCorriente,
    isPeriodoAmbos,
    getPeriodoLabel,
    getPeriodoRange,
  ])

  return (
    <PeriodoContext.Provider value={contextValue}>
      {children}
    </PeriodoContext.Provider>
  )
}

// Hook to use the context
export function usePeriodo(): PeriodoContextType {
  const context = useContext(PeriodoContext)

  if (context === defaultContext) {
    console.warn('usePeriodo must be used within a PeriodoProvider')
  }

  return context
}

// Export the context for advanced use cases
export { PeriodoContext }

export default PeriodoProvider
