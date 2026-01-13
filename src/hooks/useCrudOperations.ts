import { useCallback } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'

export interface CrudConfig<T> {
    supabase: SupabaseClient
    tableName: string
    idField?: string
    onSuccess?: () => void
    onError?: (error: string) => void
}

export interface UseCrudOperationsReturn<T> {
    create: (data: Partial<T>) => Promise<void>
    update: (id: string, data: Partial<T>) => Promise<void>
    remove: (id: string, confirmMessage?: string) => Promise<void>
    softDelete: (id: string, confirmMessage?: string) => Promise<void>
}

export function useCrudOperations<T = any>(config: CrudConfig<T>): UseCrudOperationsReturn<T> {
    const { supabase, tableName, idField = 'id', onSuccess, onError } = config

    const create = useCallback(async (data: Partial<T>) => {
        try {
            const { error } = await supabase.from(tableName).insert(data as any)
            if (error) throw error
            onSuccess?.()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al crear'
            onError?.(message)
            throw err
        }
    }, [supabase, tableName, onSuccess, onError])

    const update = useCallback(async (id: string, data: Partial<T>) => {
        try {
            const { error } = await supabase
                .from(tableName)
                .update(data as any)
                .eq(idField, id)
            if (error) throw error
            onSuccess?.()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al actualizar'
            onError?.(message)
            throw err
        }
    }, [supabase, tableName, idField, onSuccess, onError])

    const remove = useCallback(async (id: string, confirmMessage = '¿Eliminar este registro?') => {
        if (!confirm(confirmMessage)) return
        try {
            const { error } = await supabase.from(tableName).delete().eq(idField, id)
            if (error) throw error
            onSuccess?.()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al eliminar'
            onError?.(message)
            throw err
        }
    }, [supabase, tableName, idField, onSuccess, onError])

    const softDelete = useCallback(async (id: string, confirmMessage = '¿Desactivar este registro?') => {
        if (!confirm(confirmMessage)) return
        try {
            const { error } = await supabase
                .from(tableName)
                .update({ activo: false } as any)
                .eq(idField, id)
            if (error) throw error
            onSuccess?.()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al desactivar'
            onError?.(message)
            throw err
        }
    }, [supabase, tableName, idField, onSuccess, onError])

    return {
        create,
        update,
        remove,
        softDelete
    }
}
