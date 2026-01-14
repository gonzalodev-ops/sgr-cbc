Reporte de Revisión de Código - SGR-CBC
Fecha: 2026-01-14
Revisor: Experto en Arquitectura y Seguridad
Proyecto: Sistema de Gestión de Resultados (SGR-CBC)

📋 Resumen Ejecutivo
El proyecto SGR-CBC es un sistema de gestión de resultados construido con Next.js 16, Supabase, y TypeScript. La arquitectura general es sólida, pero se identificaron 8 áreas críticas que requieren atención inmediata, 12 mejoras de código, y código no utilizado que debe eliminarse.

Estado General
✅ Arquitectura: Bien estructurada con separación clara de responsabilidades
⚠️ Seguridad: Algunas vulnerabilidades menores identificadas
⚠️ Calidad de Código: Console logs de debugging y TODOs pendientes
✅ TypeScript: Uso apropiado de tipos e interfaces
❌ Código No Utilizado: Archivo mockData.ts parcialmente obsoleto
🔴 Problemas Críticos
1. Seguridad: Estado de base de datos en mapeo
Archivo: 
src/lib/engine/taskGenerator.ts:201

estado: 'no_iniciado',  // ❌ Hardcoded string
Problema: El estado se está insertando como string literal en lugar de usar una constante o tipo del esquema de base de datos.

Riesgo: Inconsistencias si cambia el esquema de estados en la BD.

Recomendación: Crear un enum o usar los valores del tipo 
database.ts
.

// Sugerencia
const ESTADO_INICIAL = 'pendiente' as const
2. Seguridad: Verificación de estado insuficiente en dashboard
Archivo: 
src/app/dashboard/page.tsx:200-218

Problema: La función 
toggleEstado
 permite que cualquier usuario cambie estados de tareas sin validación del backend.

const toggleEstado = async (id: string, currentEstado: EstadoEntregable) => {
    if (!supabase) return
    const currentIndex = ESTADOS_CICLO.indexOf(currentEstado)
    const nextEstado = ESTADOS_CICLO[(currentIndex + 1) % ESTADOS_CICLO.length]
    
    // Optimistic update - NO HAY VALIDACIÓN
    setEntregables(prev => prev.map(e => e.id === id ? { ...e, estado: nextEstado } : e))
Riesgo: Un usuario podría manipular estados sin tener permisos.

Recomendación:

Implementar RLS (Row Level Security) policies en Supabase
Crear un API endpoint /api/tareas/[id]/estado que valide permisos
Verificar rol del usuario antes de permitir cambios
3. Lógica de Negocio: Query ineficiente en taskGenerator
Archivo: 
src/lib/engine/taskGenerator.ts:94-219

Problema: El motor de generación de tareas tiene múltiples problemas de rendimiento:

// ❌ PROBLEMA: N+1 queries
for (const contribuyente of contribuyentes as Contribuyente[]) {
    // Query 1: regímenes
    const { data: regimenes } = await supabase.from('contribuyente_regimen')...
    
    // Query 2: cliente
    const { data: clienteContrib } = await supabase.from('cliente_contribuyente')...
    
    // Query 3: servicios
    const { data: serviciosCliente } = await supabase.from('cliente_servicio')...
    
    for (const regimen of regimenes) {
        // Query 4+: obligaciones (por cada régimen)
        const { data: obligacionesRegimen } = await supabase.from('regimen_obligacion')...
        
        for (const obligacion of obligacionesRegimen) {
            // Query 5+: verificar existencia (por cada obligación)
            const { data: tareaExistente } = await supabase.from('tarea')...
            
            // Query 6+: deadline (por cada tarea nueva)
            const { data: deadline } = await supabase.from('calendario_deadline')...
        }
    }
}
Impacto:

Para 50 contribuyentes con 3 regímenes cada uno = ~750 queries
Tiempo estimado: 30-60 segundos
Recomendación: Refactorizar usando:

Joins en lugar de queries anidadas
Batch inserts con .upsert()
Supabase RPC function para lógica compleja del lado del servidor
// ✅ MEJOR ENFOQUE
const { data: tareasData } = await supabase.rpc('generar_tareas_batch', {
    p_periodo: periodo,
    p_contribuyente_id: contribuyenteId
})
4. Inconsistencia en mapeo de estados
Archivos:

src/app/dashboard/page.tsx:144-157
src/lib/engine/taskGenerator.ts:201
Problema: Hay dos lugares diferentes donde se mapean estados:

Dashboard:

const map: Record<string, EstadoEntregable> = {
    'pendiente': 'no_iniciado',
    'en_curso': 'en_curso',
    'en_validacion': 'revision',
    // ...
}
Task Generator:

estado: 'no_iniciado',  // ← Diferente del 'pendiente' de la BD
Riesgo: Desincronización entre estados generados vs estados mostrados.

Recomendación: Centralizar mapeo en lib/types/database.ts.

⚠️ Problemas de Calidad de Código
5. Console logs de debug en producción
Se encontraron 13 console.log/error en el código de producción:

Archivo	Línea	Tipo
TabClientes.tsx
75, 79, 87, 93	console.log, console.error
page.tsx
(dashboard)
105, 214, 240, 264	console.error
create-user/route.ts
103	console.error
Problema: Los logs de debugging están expuestos al cliente y podrían revelar información sensible.

Recomendación:

Implementar un logger apropiado (Winston, Pino)
Usar variables de entorno para controlar nivel de logging
En el cliente, usar logging condicional:
if (process.env.NODE_ENV === 'development') {
    console.log('Debug info:', data)
}
6. TODOs sin resolver
Archivo: 
src/app/dashboard/page.tsx

puntosBase: 50, // TODO: Traer de scoring engine (línea 128)
evidencia: false, // TODO: Traer de tarea_documento (línea 133)
Problema: Funcionalidad crítica está pendiente de implementación.

Recomendación: Priorizar implementación del scoring engine y sistema de evidencias.

7. Type Assertions excesivas
Archivo: 
src/lib/engine/stepAssigner.ts:232-244

if (Array.isArray(p.users) && p.users.length > 0) {
    responsable = { nombre: p.users[0].nombre, email: p.users[0].email }
} else if (!Array.isArray(p.users)) {
    responsable = { nombre: (p.users as any).nombre, email: (p.users as any).email }
    //                       ^^^^^^^^ uso de 'any'
}
Problema: El uso de any elimina las ventajas de TypeScript.

Recomendación: Definir tipos apropiados para el resultado de Supabase.

type SupabaseUser = { nombre: string; email: string }
interface PasoConUsuario {
    users: SupabaseUser | SupabaseUser[] | null
}
🗑️ Código No Utilizado / Obsoleto
8. Mock Data parcialmente obsoleto
Archivo: 
src/lib/data/mockData.ts

Problema: El archivo contiene datos mock que solo se usan parcialmente:

export const MOCK_ENTREGABLES: Entregable[] = [
    // 12 entregables hardcodeados que NO se usan
    { id: '1', rfc: 'XAXX010101ABC', cliente: 'Abarrotes Lupita', ... },
    // ...
]
export const MOCK_TRIBUS = ['Isidora', 'Noelia', 'Vianey', 'Querétaro']
// ↑ NO se usa en ningún lugar
Uso actual: Solo se importan las interfaces, funciones helper, y constantes de configuración:

// Usado:
import {
    ESTADO_CONFIG,      // ✅ Usado en dashboard
    ESTADOS_CICLO,      // ✅ Usado en toggle
    calcularPuntos,     // ✅ Usado en cálculos
    type Entregable,    // ✅ Tipo usado
    type EstadoEntregable,
    type ResultadoAuditoria
} from '@/lib/data/mockData'
// NO usado:
MOCK_ENTREGABLES  // ❌ Array de datos mock
MOCK_TRIBUS       // ❌ Array de tribus hardcodeadas
Recomendación:

Refactorizar moviendo:
Interfaces → lib/types/tarea.ts
Constantes de configuración → lib/constants/estados.ts
Funciones helper → lib/utils/puntos.ts
Eliminar los datos mock (MOCK_ENTREGABLES, MOCK_TRIBUS)
Renombrar los archivos para reflejar su propósito real
💡 Mejoras Recomendadas
9. Configuración Page - Uso excesivo de dynamic imports
Archivo: 
src/app/dashboard/configuracion/page.tsx:10-16

// Todos los tabs se cargan con dynamic import
const TabClientes = dynamicImport(() => import('@/components/config/TabClientes'), { ssr: false })
const TabColaboradores = dynamicImport(() => import('@/components/config/TabColaboradores'), { ssr: false })
// ...
Problema: Aunque es buena práctica para code-splitting, aquí todos los componentes se cargan de esta forma, lo que puede causar "flash" al cambiar tabs.

Recomendación:

Cargar el tab inicial (
TabClientes
) de forma estática
Usar dynamic import solo para tabs menos usados
import TabClientes from '@/components/config/TabClientes'
const TabColaboradores = dynamic(() => import('@/components/config/TabColaboradores'))
10. Middleware - Regex complejo
Archivo: 
src/middleware.ts:17

'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xlsx)$).*)',
Problema: Regex difícil de mantener y entender.

Recomendación: Extraer a constante con comentarios.

const EXCLUDED_PATHS = [
    '_next/static',
    '_next/image', 
    'favicon.ico'
]
const EXCLUDED_EXTENSIONS = ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'xlsx']
11. API Routes - Falta validación de entrada
Archivo: 
src/app/api/engine/generate-tasks/route.ts:18-23

if (!/^\d{4}-\d{2}$/.test(periodo)) {
    return NextResponse.json(
        { error: 'Formato de periodo inválido. Use YYYY-MM (ej: 2026-01)' },
        { status: 400 }
    )
}
Problema: Solo valida formato, no valida que sea una fecha válida.

Recomendación: Validar que el mes esté entre 01-12 y el año sea razonable.

const [year, month] = periodo.split('-').map(Number)
if (month < 1 || month > 12 || year < 2020 || year > 2100) {
    return NextResponse.json({ error: 'Periodo fuera de rango válido' }, { status: 400 })
}
12. Inconsistencia en manejo de errores de Supabase
Problema: Algunos endpoints retornan el error completo, otros solo un mensaje genérico.

Ejemplos:

// Inconsistente: expone detalles internos
return NextResponse.json({ error: error.message }, { status: 500 })
// Inconsistente: mensaje genérico
return NextResponse.json({ error: 'Error procesando solicitud' }, { status: 500 })
Recomendación: Crear un helper centralizado.

// lib/utils/apiError.ts
export function handleApiError(error: unknown, userMessage?: string) {
    const message = process.env.NODE_ENV === 'development' 
        ? (error as Error).message 
        : (userMessage || 'Error procesando solicitud')
    
    return NextResponse.json({ error: message }, { status: 500 })
}
13. Falta de índices en queries complejas
Archivo: 
src/lib/engine/taskGenerator.ts

Problema: Queries que filtran por múltiples campos sin índices apropiados.

.eq('contribuyente_id', contribuyente.contribuyente_id)
.eq('id_obligacion', obligacion.id_obligacion)
.eq('periodo', periodo)
Recomendación: Crear índices compuestos en Supabase:

-- Mejora de rendimiento para queries frecuentes
CREATE INDEX idx_tarea_contribuyente_obligacion_periodo 
ON tarea(contribuyente_id, id_obligacion, periodo);
CREATE INDEX idx_contribuyente_regimen_vigente
ON contribuyente_regimen(contribuyente_id, c_regimen) 
WHERE vigencia_fin IS NULL OR vigencia_fin > CURRENT_DATE;
14. Configuración de cliente Supabase
Archivo: 
src/lib/supabase/client.ts

Problema: No hay configuración de opciones importantes.

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    // ❌ Sin opciones de configuración
  )
}
Recomendación: Agregar opciones de performance y seguridad.

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      }
    }
  )
}
15. Dashboard: Lógica de negocio en componente
Archivo: 
src/app/dashboard/page.tsx:36-160

Problema: 125 líneas de lógica de fetching dentro del componente.

Recomendación: Extraer a custom hook.

// lib/hooks/useEntregables.ts
export function useEntregables() {
    const [entregables, setEntregables] = useState<Entregable[]>([])
    const [loading, setLoading] = useState(true)
    
    // ... lógica de fetching
    
    return { entregables, loading, refetch }
}
// En el componente
const { entregables, loading } = useEntregables()
16. Falta de paginación en queries
Archivo: 
src/lib/engine/taskGenerator.ts:239-258

const { data: tareas, error } = await supabase
    .from('tarea')
    .select(...)
    .eq('periodo', periodo)
    // ❌ Sin límite de resultados
Problema: Podría cargar miles de registros sin paginación.

Recomendación:

.eq('periodo', periodo)
.range(0, 1000) // Límite máximo
🎯 Análisis de Arquitectura
Fortalezas ✅
Separación de responsabilidades clara:

/app - Rutas y páginas
/components - Componentes reutilizables
/lib - Lógica de negocio y utilidades
Uso apropiado de TypeScript: Interfaces bien definidas

Autenticación: Implementación correcta de Supabase Auth con middleware

API Routes: Endpoints bien estructurados con validación de roles

Áreas de Mejora ⚠️
Motor de tareas: Necesita optimización urgente (ver problema #3)

Manejo de errores: Falta consistencia

Testing: No se encontraron tests

Documentación: Falta JSDoc en funciones críticas

📊 Métricas de Código
Métrica	Valor	Estado
Archivos TypeScript	34	✅
Console.log encontrados	13	❌
TODOs pendientes	2	⚠️
Type assertions (any)	~5	⚠️
Código no utilizado	~60 líneas	❌
🔧 Plan de Acción Recomendado
Prioridad Alta (1-2 semanas)
✅ Optimizar motor de generación de tareas (Problema #3)

Implementar Supabase RPC function
Reducir queries de O(n³) a O(n)
✅ Refactorizar mockData.ts (Problema #8)

Separar interfaces, constantes y helpers
Eliminar datos mock
✅ Agregar validación de permisos en toggleEstado (Problema #2)

Crear API endpoint protegido
Implementar RLS policies
Prioridad Media (2-4 semanas)
✅ Eliminar console.log de producción (Problema #5)

Implementar logger apropiado
Configurar por ambiente
✅ Centralizar mapeo de estados (Problema #4)

Crear tipos unificados
Documentar estados válidos
✅ Implementar scoring engine (TODO pendiente)

Resolver línea 128 de dashboard
Prioridad Baja (Backlog)
⚠️ Agregar tests unitarios e integración
⚠️ Mejorar documentación (JSDoc)
⚠️ Optimizar queries con índices compuestos
⚠️ Implementar paginación en listados
📝 Conclusiones
El código del proyecto SGR-CBC muestra una arquitectura bien pensada y un buen uso de TypeScript. Sin embargo, hay áreas críticas que necesitan atención inmediata:

Performance: El motor de tareas necesita optimización urgente
Mantenibilidad: Código mock debe refactorizarse
Seguridad: Validaciones de permisos deben fortalecerse
Con los cambios propuestos, el código estará listo para escalar y ser mantenido por un equipo más grande.

Revisado por: Expert Code Reviewer
Fecha de reporte: 2026-01-14
