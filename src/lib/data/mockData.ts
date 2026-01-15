// Datos mock para el TMR - serán reemplazados por datos reales de Supabase

export type EstadoEntregable =
    | 'no_iniciado'
    | 'en_curso'
    | 'revision'
    | 'terminado'
    | 'bloqueado_cliente'
    | 'rechazado'

export type ResultadoAuditoria = 'pendiente' | 'aprobado' | 'rechazado' | 'no_auditado'

export interface Entregable {
    id: string
    rfc: string
    cliente: string
    entregable: string
    talla: 'XS' | 'S' | 'M' | 'L' | 'XL'
    puntosBase: number
    responsable: string
    rol: string
    tribu: string
    estado: EstadoEntregable
    evidencia: boolean
    evidencia_url?: string
    voboLider: boolean
    auditoria: ResultadoAuditoria
}

export const ESTADO_CONFIG: Record<EstadoEntregable, { label: string; color: string; bgColor: string }> = {
    no_iniciado: { label: 'No Iniciado', color: 'text-slate-700', bgColor: 'bg-slate-100 border-slate-200' },
    en_curso: { label: 'En Curso', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
    revision: { label: 'Revisión', color: 'text-yellow-700', bgColor: 'bg-yellow-100 border-yellow-200' },
    terminado: { label: 'Terminado', color: 'text-green-700', bgColor: 'bg-green-100 border-green-300' },
    bloqueado_cliente: { label: 'Bloqueado', color: 'text-red-600', bgColor: 'bg-red-100 border-red-200' },
    rechazado: { label: 'Rechazado', color: 'text-red-800', bgColor: 'bg-red-200 border-red-300' },
}

export const TALLA_FACTOR: Record<string, number> = {
    XS: 0.5,
    S: 0.75,
    M: 1,
    L: 1.5,
    XL: 2,
}

// Calcular puntos: solo si terminado + evidencia + vobo + auditoria aprobada
export function calcularPuntos(entregable: Entregable): number {
    if (
        entregable.estado === 'terminado' &&
        entregable.evidencia &&
        entregable.voboLider &&
        entregable.auditoria === 'aprobado'
    ) {
        return Math.round(entregable.puntosBase * TALLA_FACTOR[entregable.talla])
    }
    return 0
}

// Estados para ciclar
export const ESTADOS_CICLO: EstadoEntregable[] = [
    'no_iniciado',
    'en_curso',
    'revision',
    'terminado',
]
