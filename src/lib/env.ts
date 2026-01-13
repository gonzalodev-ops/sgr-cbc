import { z } from 'zod'

// Schema de validación para variables públicas (disponibles en cliente)
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY es requerida'),
})

// Schema completo con variables privadas (solo servidor)
const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY es requerida'),
})

// Tipos inferidos
export type PublicEnv = z.infer<typeof publicEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

// Helper para verificar si estamos en el servidor
export const isServer = typeof window === 'undefined'

// Validar y obtener variables públicas (seguro para cliente y servidor)
export function getPublicEnv(): PublicEnv {
  try {
    return publicEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)

      console.error('❌ Variables de entorno públicas inválidas o faltantes:')
      console.error(missingVars.join('\n'))

      throw new Error('Configuración de entorno inválida. Revisa los logs.')
    }
    throw error
  }
}

// Validar y obtener variables de servidor (solo para uso server-side)
export function getServerEnv(): ServerEnv {
  if (!isServer) {
    throw new Error('getServerEnv() solo puede ser llamado en el servidor')
  }

  try {
    return serverEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)

      console.error('❌ Variables de entorno del servidor inválidas o faltantes:')
      console.error(missingVars.join('\n'))
      console.error('\nAsegúrate de tener un archivo .env.local con todas las variables requeridas.')

      throw new Error('Configuración de entorno del servidor inválida.')
    }
    throw error
  }
}
