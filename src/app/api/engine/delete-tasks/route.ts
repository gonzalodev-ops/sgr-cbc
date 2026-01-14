import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const periodo = searchParams.get('periodo')

        if (!periodo) {
            return NextResponse.json(
                { error: 'El periodo es requerido (formato: YYYY-MM)' },
                { status: 400 }
            )
        }

        // Validar formato de periodo
        if (!/^\d{4}-\d{2}$/.test(periodo)) {
            return NextResponse.json(
                { error: 'Formato de periodo inválido. Use YYYY-MM (ej: 2026-01)' },
                { status: 400 }
            )
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        // VERIFICACIÓN DE SEGURIDAD
        const supabaseAuth = createServerClient(
            supabaseUrl,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => request.cookies.getAll() } }
        )

        const { data: { user: currentUser }, error: authError } = await supabaseAuth.auth.getUser()

        if (authError || !currentUser) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Verificar rol ADMIN usando service role para consultar la tabla de usuarios
        const supabaseAdmin = createClient(supabaseUrl, adminKey)
        const { data: dbUser, error: dbError } = await supabaseAdmin
            .from('users')
            .select('rol_global')
            .eq('user_id', currentUser.id)
            .single()

        if (dbError || !dbUser || dbUser.rol_global !== 'ADMIN') {
            return NextResponse.json({ error: 'Permisos insuficientes. Se requiere rol ADMIN.' }, { status: 403 })
        }

        // Contar tareas antes de eliminar
        const { count: tareasCount, error: countError } = await supabaseAdmin
            .from('tarea')
            .select('*', { count: 'exact', head: true })
            .eq('periodo_fiscal', periodo)

        if (countError) {
            return NextResponse.json(
                { error: `Error contando tareas: ${countError.message}` },
                { status: 500 }
            )
        }

        if (!tareasCount || tareasCount === 0) {
            return NextResponse.json({
                success: true,
                tareasEliminadas: 0,
                mensaje: `No hay tareas para el periodo ${periodo}`
            })
        }

        // Eliminar tareas del periodo (CASCADE eliminará steps, eventos, documentos)
        const { error: deleteError } = await supabaseAdmin
            .from('tarea')
            .delete()
            .eq('periodo_fiscal', periodo)

        if (deleteError) {
            return NextResponse.json(
                { error: `Error eliminando tareas: ${deleteError.message}` },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            tareasEliminadas: tareasCount,
            mensaje: `Se eliminaron ${tareasCount} tareas del periodo ${periodo}`
        })

    } catch (error) {
        console.error('Error eliminando tareas:', error)
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        )
    }
}

// Endpoint para obtener conteo de tareas por periodo (preview antes de eliminar)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const periodo = searchParams.get('periodo')

        if (!periodo) {
            return NextResponse.json({
                endpoint: '/api/engine/delete-tasks',
                method: 'DELETE',
                params: {
                    periodo: 'string (requerido, formato YYYY-MM)'
                },
                ejemplo: '/api/engine/delete-tasks?periodo=2026-01'
            })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        // VERIFICACIÓN DE SEGURIDAD
        const supabaseAuth = createServerClient(
            supabaseUrl,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => request.cookies.getAll() } }
        )

        const { data: { user: currentUser }, error: authError } = await supabaseAuth.auth.getUser()

        if (authError || !currentUser) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const supabaseAdmin = createClient(supabaseUrl, adminKey)

        // Contar tareas del periodo
        const { count: tareasCount, error: countError } = await supabaseAdmin
            .from('tarea')
            .select('*', { count: 'exact', head: true })
            .eq('periodo_fiscal', periodo)

        if (countError) {
            return NextResponse.json(
                { error: `Error contando tareas: ${countError.message}` },
                { status: 500 }
            )
        }

        // Contar pasos asociados
        const { data: tareaIds } = await supabaseAdmin
            .from('tarea')
            .select('tarea_id')
            .eq('periodo_fiscal', periodo)

        let stepsCount = 0
        if (tareaIds && tareaIds.length > 0) {
            const { count } = await supabaseAdmin
                .from('tarea_step')
                .select('*', { count: 'exact', head: true })
                .in('tarea_id', tareaIds.map(t => t.tarea_id))
            stepsCount = count || 0
        }

        return NextResponse.json({
            periodo,
            tareas: tareasCount || 0,
            pasos: stepsCount,
            mensaje: tareasCount
                ? `El periodo ${periodo} tiene ${tareasCount} tareas con ${stepsCount} pasos que serán eliminados`
                : `No hay tareas para el periodo ${periodo}`
        })

    } catch (error) {
        console.error('Error obteniendo preview:', error)
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        )
    }
}
