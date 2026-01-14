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

export const MOCK_TRIBUS = ['Isidora', 'Noelia', 'Vianey', 'Querétaro']

export const MOCK_ENTREGABLES: Entregable[] = [
    { id: '1', rfc: 'XAXX010101ABC', cliente: 'Abarrotes Lupita', entregable: 'Nómina Quincenal', talla: 'M', puntosBase: 50, responsable: 'Diego García', rol: 'Aux C', tribu: 'Isidora', estado: 'terminado', evidencia: true, voboLider: true, auditoria: 'aprobado' },
    { id: '2', rfc: 'XAXX010101ABC', cliente: 'Abarrotes Lupita', entregable: 'Impuestos Mensuales', talla: 'L', puntosBase: 100, responsable: 'Diego García', rol: 'Aux C', tribu: 'Isidora', estado: 'revision', evidencia: true, voboLider: false, auditoria: 'no_auditado' },
    { id: '3', rfc: 'XAXX010101ABC', cliente: 'Abarrotes Lupita', entregable: 'DIOT', talla: 'S', puntosBase: 30, responsable: 'Ulises Romo', rol: 'Aux B', tribu: 'Isidora', estado: 'en_curso', evidencia: false, voboLider: false, auditoria: 'no_auditado' },
    { id: '4', rfc: 'XEF020202DEF', cliente: 'Ferretería El Tornillo', entregable: 'Contabilidad Electrónica', talla: 'M', puntosBase: 50, responsable: 'Ulises Romo', rol: 'Aux B', tribu: 'Isidora', estado: 'terminado', evidencia: true, voboLider: true, auditoria: 'rechazado' },
    { id: '5', rfc: 'XEF020202DEF', cliente: 'Ferretería El Tornillo', entregable: 'Rescate 2023 (Backlog)', talla: 'XL', puntosBase: 200, responsable: 'Diego García', rol: 'Aux C', tribu: 'Isidora', estado: 'no_iniciado', evidencia: false, voboLider: false, auditoria: 'no_auditado' },
    { id: '6', rfc: 'CDR030303GHI', cliente: 'Consultorio Dr. Simi', entregable: 'Declaración Anual', talla: 'L', puntosBase: 100, responsable: 'Hannia López', rol: 'Aux A', tribu: 'Noelia', estado: 'bloqueado_cliente', evidencia: false, voboLider: false, auditoria: 'no_auditado' },
    { id: '7', rfc: 'CDR030303GHI', cliente: 'Consultorio Dr. Simi', entregable: 'Nómina Quincenal', talla: 'S', puntosBase: 30, responsable: 'Hannia López', rol: 'Aux A', tribu: 'Noelia', estado: 'terminado', evidencia: true, voboLider: true, auditoria: 'aprobado' },
    { id: '8', rfc: 'TLE040404JKL', cliente: 'Tienda La Esquina', entregable: 'Nómina Quincenal', talla: 'S', puntosBase: 30, responsable: 'Karla Mendez', rol: 'Aux C', tribu: 'Vianey', estado: 'no_iniciado', evidencia: false, voboLider: false, auditoria: 'no_auditado' },
    { id: '9', rfc: 'TLE040404JKL', cliente: 'Tienda La Esquina', entregable: 'IMSS Mensual', talla: 'M', puntosBase: 50, responsable: 'Roberto Sánchez', rol: 'Aux B', tribu: 'Vianey', estado: 'en_curso', evidencia: false, voboLider: false, auditoria: 'no_auditado' },
    { id: '10', rfc: 'IND050505MNO', cliente: 'Industrias Querétaro', entregable: 'Nómina Semanal', talla: 'XL', puntosBase: 150, responsable: 'Ana Torres', rol: 'Aux A', tribu: 'Querétaro', estado: 'revision', evidencia: true, voboLider: false, auditoria: 'no_auditado' },
    { id: '11', rfc: 'IND050505MNO', cliente: 'Industrias Querétaro', entregable: 'IMSS Mensual', talla: 'L', puntosBase: 80, responsable: 'Pedro Ramírez', rol: 'Aux B', tribu: 'Querétaro', estado: 'terminado', evidencia: true, voboLider: true, auditoria: 'pendiente' },
    { id: '12', rfc: 'IND050505MNO', cliente: 'Industrias Querétaro', entregable: 'Impuestos Mensuales', talla: 'XL', puntosBase: 150, responsable: 'Ana Torres', rol: 'Aux A', tribu: 'Querétaro', estado: 'en_curso', evidencia: false, voboLider: false, auditoria: 'no_auditado' },
]

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
