import { NextRequest, NextResponse } from 'next/server'
import { reasignarTareasDeColaborador } from '@/lib/engine/autoReassign'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { colaboradorId, suplenteId } = body

    if (!colaboradorId) {
      return NextResponse.json(
        { error: 'El colaboradorId es requerido' },
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

    // Verificar que el usuario tiene permisos (ADMIN o LIDER)
    const supabaseAdmin = createClient(supabaseUrl, adminKey)
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('rol_global')
      .eq('user_id', currentUser.id)
      .single()

    if (dbError || !dbUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 403 })
    }

    if (!['ADMIN', 'LIDER', 'SOCIO'].includes(dbUser.rol_global)) {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Se requiere rol ADMIN, SOCIO o LIDER.' },
        { status: 403 }
      )
    }

    // Ejecutar reasignación
    const resultado = await reasignarTareasDeColaborador(
      supabaseUrl,
      adminKey,
      colaboradorId,
      suplenteId
    )

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          reasignadas: resultado.reasignadas,
          errores: resultado.errores,
          mensaje: `Se reasignaron ${resultado.reasignadas} tareas con ${resultado.errores.length} errores`
        },
        { status: 207 } // Multi-Status
      )
    }

    return NextResponse.json({
      success: true,
      reasignadas: resultado.reasignadas,
      detalles: resultado.detalles,
      mensaje: `Se reasignaron exitosamente ${resultado.reasignadas} tareas`
    })

  } catch (error) {
    console.error('Error en reasignación automática:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/engine/auto-reassign',
    method: 'POST',
    description: 'Reasigna automáticamente las tareas de un colaborador ausente',
    body: {
      colaboradorId: 'string (requerido, UUID del colaborador ausente)',
      suplenteId: 'string (opcional, UUID del suplente)'
    },
    ejemplo: {
      colaboradorId: '550e8400-e29b-41d4-a716-446655440000',
      suplenteId: '550e8400-e29b-41d4-a716-446655440001'
    },
    notas: [
      'Si se proporciona suplenteId, las tareas se reasignan a ese colaborador',
      'Si no se proporciona suplenteId, las tareas se reasignan al líder del equipo',
      'Solo se reasignan tareas en estados activos (pendiente, en_curso, etc.)',
      'Requiere permisos de ADMIN, SOCIO o LIDER'
    ]
  })
}
