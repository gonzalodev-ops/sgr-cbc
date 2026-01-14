import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generarTareas } from '@/lib/engine/taskGenerator'

/**
 * Endpoint CRON para generación automática de tareas
 *
 * Este endpoint debe ser llamado por un cron job (Vercel Cron, GitHub Actions, etc.)
 * cada día a las 6:00 AM para verificar si es el día configurado para generar tareas.
 *
 * Configuración en vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-tasks",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 *
 * O usar Supabase Edge Functions / pg_cron para invocar este endpoint.
 */

export async function GET(request: NextRequest) {
    try {
        // Verificar token de autorización para cron
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        // En producción, verificar el secret del cron
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, adminKey)

        // Obtener configuración de auto-generación
        const { data: configData, error: configError } = await supabase
            .from('config_sistema')
            .select('valor')
            .eq('clave', 'auto_gen_tareas')
            .single()

        if (configError && configError.code !== 'PGRST116') {
            return NextResponse.json({ error: configError.message }, { status: 500 })
        }

        const config = configData?.valor || { habilitado: false }

        // Verificar si está habilitado
        if (!config.habilitado) {
            return NextResponse.json({
                success: true,
                ejecutado: false,
                mensaje: 'Generación automática deshabilitada'
            })
        }

        // Verificar si hoy es el día configurado
        const hoy = new Date()
        const diaActual = hoy.getDate()
        const diaConfigurado = config.dia_ejecucion || 1

        if (diaActual !== diaConfigurado) {
            return NextResponse.json({
                success: true,
                ejecutado: false,
                mensaje: `Hoy es día ${diaActual}, la generación está programada para el día ${diaConfigurado}`
            })
        }

        // Calcular el período actual (mes actual)
        const año = hoy.getFullYear()
        const mes = String(hoy.getMonth() + 1).padStart(2, '0')
        const periodoActual = `${año}-${mes}`

        // Verificar si ya se generó este período
        if (config.ultimo_periodo_generado === periodoActual) {
            return NextResponse.json({
                success: true,
                ejecutado: false,
                mensaje: `El período ${periodoActual} ya fue generado automáticamente`
            })
        }

        // Ejecutar generación de tareas
        const resultado = await generarTareas(
            supabaseUrl,
            adminKey,
            periodoActual
        )

        // Actualizar último período generado
        if (resultado.tareasGeneradas > 0 || resultado.errores.length === 0) {
            await supabase
                .from('config_sistema')
                .update({
                    valor: {
                        ...config,
                        ultimo_periodo_generado: periodoActual
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('clave', 'auto_gen_tareas')
        }

        // Registrar en log de sistema (opcional)
        await supabase
            .from('system_log')
            .insert({
                tipo: 'CRON_TAREAS',
                mensaje: resultado.success
                    ? `Generación automática completada: ${resultado.tareasGeneradas} tareas para ${periodoActual}`
                    : `Generación automática con errores: ${resultado.errores.length} errores`,
                metadata: {
                    periodo: periodoActual,
                    tareas_generadas: resultado.tareasGeneradas,
                    errores: resultado.errores.slice(0, 10) // Limitar errores en log
                }
            })
            .single()

        return NextResponse.json({
            success: resultado.success,
            ejecutado: true,
            periodo: periodoActual,
            tareasGeneradas: resultado.tareasGeneradas,
            errores: resultado.errores,
            mensaje: resultado.success
                ? `Generación automática completada: ${resultado.tareasGeneradas} tareas para ${periodoActual}`
                : `Proceso completado con ${resultado.errores.length} errores`
        })

    } catch (error) {
        console.error('Error en cron de generación:', error)
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        )
    }
}

// POST también permitido para testing manual
export async function POST(request: NextRequest) {
    return GET(request)
}
