import { useState, useCallback } from 'react'

export interface AsyncState<T> {
    data: T | null
    loading: boolean
    error: string | null
}

export interface UseAsyncReturn<T> {
    data: T | null
    loading: boolean
    error: string | null
    execute: (asyncFn: () => Promise<T>) => Promise<void>
    reset: () => void
}

export function useAsync<T = any>(initialData: T | null = null): UseAsyncReturn<T> {
    const [state, setState] = useState<AsyncState<T>>({
        data: initialData,
        loading: false,
        error: null
    })

    const execute = useCallback(async (asyncFn: () => Promise<T>) => {
        setState({ data: null, loading: true, error: null })
        try {
            const result = await asyncFn()
            setState({ data: result, loading: false, error: null })
        } catch (err) {
            setState({ data: null, loading: false, error: err instanceof Error ? err.message : 'Error desconocido' })
        }
    }, [])

    const reset = useCallback(() => {
        setState({ data: initialData, loading: false, error: null })
    }, [initialData])

    return {
        ...state,
        execute,
        reset
    }
}
