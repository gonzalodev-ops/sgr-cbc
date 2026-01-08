import { NextRequest, NextResponse } from 'next/server'
import { generarTareas } from '@/lib/engine/taskGenerator'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { periodo, contribuyenteId } = body

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
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

        const resultado = await generarTareas(
            supabaseUrl,
            supabaseKey,
            periodo,
            contribuyenteId
        )

        return NextResponse.json({
            success: resultado.success,
            tareasGeneradas: resultado.tareasGeneradas,
            errores: resultado.errores,
            mensaje: resultado.success
                ? `Se generaron ${resultado.tareasGeneradas} tareas para el periodo ${periodo}`
                : `Proceso completado con ${resultado.errores.length} errores`
        })

    } catch (error) {
        console.error('Error en generación de tareas:', error)
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({
        endpoint: '/api/engine/generate-tasks',
        method: 'POST',
        body: {
            periodo: 'string (requerido, formato YYYY-MM)',
            contribuyenteId: 'string (opcional, UUID del contribuyente)'
        },
        ejemplo: {
            periodo: '2026-01'
        }
    })
}
