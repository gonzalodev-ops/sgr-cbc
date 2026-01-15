import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { nombre, email, rol_global, equipo_id, rol_en_equipo } = await req.json()

        if (!email || !nombre) {
            return NextResponse.json({ success: false, error: 'Email y nombre requeridos' }, { status: 400 })
        }


        // Usar service role para crear usuarios
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // VERIFICACIÓN DE SEGURIDAD: Solo ADMIN puede crear usuarios
        // Obtenemos el usuario que hace la petición a través del header de autorización o cookie
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => req.cookies.getAll() } }
        )

        const { data: { user: currentUser }, error: authCheckError } = await supabaseAuth.auth.getUser()

        if (authCheckError || !currentUser) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
        }

        // Consultar rol del usuario actual
        const { data: dbUser, error: dbError } = await supabaseAdmin
            .from('users')
            .select('rol_global')
            .eq('user_id', currentUser.id)
            .single()

        if (dbError || !dbUser || dbUser.rol_global !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Permisos insuficientes. Se requiere rol ADMIN.' }, { status: 403 })
        }


        // Crear usuario en Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { nombre }
        })

        if (authError) {
            return NextResponse.json({ success: false, error: authError.message }, { status: 400 })
        }

        if (!authData.user) {
            return NextResponse.json({ success: false, error: 'No se pudo crear el usuario' }, { status: 500 })
        }

        // Insertar en tabla users (upsert para manejar trigger automático)
        const { error: userError } = await supabaseAdmin
            .from('users')
            .upsert({
                user_id: authData.user.id,
                email,
                nombre,
                rol_global: rol_global || 'COLABORADOR',
                activo: true
            }, {
                onConflict: 'user_id'
            })

        if (userError) {
            // Rollback: eliminar usuario de auth
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            return NextResponse.json({ success: false, error: userError.message }, { status: 400 })
        }

        // Asignar a equipo si se especificó
        if (equipo_id) {
            await supabaseAdmin.from('team_members').insert({
                team_id: equipo_id,
                user_id: authData.user.id,
                rol_en_equipo: rol_en_equipo || 'AUXILIAR_C',
                activo: true
            })
        }

        // Enviar email de invitación
        await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email,
            options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback` }
        })

        return NextResponse.json({
            success: true,
            user_id: authData.user.id,
            mensaje: `Usuario ${nombre} creado. Se envió invitación a ${email}`
        })

    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
    }
}
