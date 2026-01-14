import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

interface AutoGenConfig {
    habilitado: boolean
    dia_ejecucion: number
    hora_ejecucion: string
    ultimo_periodo_generado?: string | null
}

// GET - Obtener configuración actual
export async function GET(request: NextRequest) {
    try {
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

        const { data, error } = await supabaseAdmin
            .from('config_sistema')
            .select('*')
            .eq('clave', 'auto_gen_tareas')
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Valores por defecto si no existe
        const config: AutoGenConfig = data?.valor || {
            habilitado: false,
            dia_ejecucion: 1,
            hora_ejecucion: '06:00',
            ultimo_periodo_generado: null
        }

        return NextResponse.json({
            success: true,
            config,
            updated_at: data?.updated_at || null
        })

    } catch (error) {
        console.error('Error obteniendo config:', error)
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        )
    }
}

// POST - Guardar configuración
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { habilitado, dia_ejecucion, hora_ejecucion } = body as AutoGenConfig

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

        // Verificar rol ADMIN
        const supabaseAdmin = createClient(supabaseUrl, adminKey)
        const { data: dbUser, error: dbError } = await supabaseAdmin
            .from('users')
            .select('rol_global')
            .eq('user_id', currentUser.id)
            .single()

        if (dbError || !dbUser || dbUser.rol_global !== 'ADMIN') {
            return NextResponse.json({ error: 'Permisos insuficientes. Se requiere rol ADMIN.' }, { status: 403 })
        }

        // Obtener configuración actual para preservar ultimo_periodo_generado
        const { data: currentConfig } = await supabaseAdmin
            .from('config_sistema')
            .select('valor')
            .eq('clave', 'auto_gen_tareas')
            .single()

        const newConfig: AutoGenConfig = {
            habilitado: habilitado ?? false,
            dia_ejecucion: dia_ejecucion ?? 1,
            hora_ejecucion: hora_ejecucion ?? '06:00',
            ultimo_periodo_generado: currentConfig?.valor?.ultimo_periodo_generado || null
        }

        // Upsert configuración
        const { error: upsertError } = await supabaseAdmin
            .from('config_sistema')
            .upsert({
                clave: 'auto_gen_tareas',
                valor: newConfig,
                descripcion: 'Configuración de generación automática de tareas',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'clave'
            })

        if (upsertError) {
            return NextResponse.json(
                { error: `Error guardando configuración: ${upsertError.message}` },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            mensaje: 'Configuración guardada correctamente',
            config: newConfig
        })

    } catch (error) {
        console.error('Error guardando config:', error)
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        )
    }
}
