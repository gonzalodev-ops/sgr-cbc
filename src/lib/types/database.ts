// Database types for SGR CBC
// Auto-generated types will go here after connecting to Supabase

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// Enums
export type TipoPersona = 'PF' | 'PM' | 'AMBOS'
export type NivelObligacion = 'FEDERAL' | 'ESTATAL' | 'SEGURIDAD_SOCIAL'
export type Periodicidad = 'MENSUAL' | 'ANUAL' | 'EVENTUAL' | 'POR_OPERACION' | 'PERMANENTE'
export type TipoColaborador = 'A' | 'B' | 'C'
export type DominioTalla = 'FISCAL' | 'NOMINA' | 'IMSS'
export type TallaId = 'EXTRA_CHICA' | 'CHICA' | 'MEDIANA' | 'GRANDE' | 'EXTRA_GRANDE'
export type RolGlobal = 'ADMIN' | 'SOCIO' | 'LIDER' | 'COLABORADOR'
export type RolEnEquipo = 'LIDER' | 'AUXILIAR_A' | 'AUXILIAR_B' | 'AUXILIAR_C'

export type EstadoTarea =
    | 'pendiente'
    | 'en_curso'
    | 'pendiente_evidencia'
    | 'en_validacion'
    | 'bloqueado_cliente'
    | 'presentado'
    | 'pagado'
    | 'cerrado'
    | 'rechazado'

// Table types
export interface RegimenFiscal {
    c_regimen: string
    descripcion: string
    tipo_persona: TipoPersona
    vigencia_inicio?: string
    vigencia_fin?: string
    activo: boolean
}

export interface ObligacionFiscal {
    id_obligacion: string
    nombre_corto: string
    descripcion: string
    nivel: NivelObligacion
    impuesto: string
    periodicidad: Periodicidad
    es_informativa: boolean
    vigencia_desde?: string
    vigencia_hasta?: string
    activo: boolean
}

export interface Cliente {
    cliente_id: string
    nombre_comercial: string
    razon_social_principal?: string
    segmento?: string
    estado: 'ACTIVO' | 'INACTIVO'
    created_at: string
    updated_at: string
}

export interface Contribuyente {
    contribuyente_id: string
    rfc: string
    tipo_persona: TipoPersona
    razon_social: string
    nombre_comercial?: string
    estado_fiscal?: string
    team_id?: string
    activo: boolean
    created_at: string
    updated_at: string
}

export interface Entregable {
    entregable_id: string
    nombre: string
    descripcion?: string
    tipo: 'OBLIGACION' | 'OPERATIVO' | 'OTRO'
    activo: boolean
}

export interface Talla {
    talla_id: TallaId
    ponderacion: 50 | 75 | 100 | 150 | 200
    activo: boolean
}

export interface ProcesoOperativo {
    proceso_id: string
    nombre: string
    categoria_default: 'RECURRENTE' | 'EXTRAORDINARIO'
    activo: boolean
}

export interface ProcesoPaso {
    proceso_id: string
    paso_id: string
    nombre: string
    orden: number
    peso_pct: number
    tipo_colaborador?: TipoColaborador
    grupo_concurrencia?: number
    evidencia_requerida: boolean
    tipo_evidencia_sugerida?: string
    activo: boolean
}

export interface Tarea {
    tarea_id: string
    cliente_id: string
    contribuyente_id: string
    id_obligacion: string
    ejercicio: number
    periodo_fiscal: string
    fecha_limite_oficial: string
    fecha_limite_interna?: string
    estado: EstadoTarea
    riesgo: 'ALTO' | 'MEDIO' | 'BAJO'
    prioridad: number
    responsable_usuario_id?: string
    revisor_usuario_id?: string
    comentarios?: string
    created_at: string
    updated_at: string
}

export interface TareaStep {
    tarea_step_id: string
    tarea_id: string
    proceso_paso_id?: string
    orden: number
    titulo: string
    peso_pct?: number
    tipo_colaborador?: TipoColaborador
    completado: boolean
    completado_por?: string
    completado_at?: string
    comentarios?: string
}


export interface TareaEvento {
    tarea_evento_id: string
    tarea_id: string
    tipo_evento: string
    estado_anterior?: EstadoTarea
    estado_nuevo?: EstadoTarea
    actor_usuario_id?: string
    occurred_at: string
    metadata_json?: Json
}

export interface User {
    user_id: string
    email: string
    nombre: string
    rol_global: RolGlobal
    activo: boolean
    created_at: string
}

export interface Team {
    team_id: string
    nombre: string
    activo: boolean
}

export interface TeamMember {
    team_id: string
    user_id: string
    rol_en_equipo: RolEnEquipo
    es_suplente: boolean
    suplente_de?: string
    activo: boolean
}

export interface Servicio {
    servicio_id: string
    nombre: string
    descripcion?: string
    activo: boolean
}

export interface ClienteServicio {
    cliente_id: string
    servicio_id: string
    talla_id?: TallaId
    vigencia_desde?: string
    vigencia_hasta?: string
    activo: boolean
    notas_comerciales?: string
}

export interface ContribuyenteRegimen {
    contribuyente_id: string
    c_regimen: string
    vigencia_desde?: string
    vigencia_hasta?: string
    activo: boolean
}

export interface SlaConfig {
    sla_config_id: string
    estado: EstadoTarea
    descripcion: string
    sla_activo: boolean
    sla_pausado: boolean
    dias_sla_default?: number
    orden_flujo: number
    es_estado_final: boolean
    color_ui?: string
    icono_ui?: string
    activo: boolean
    created_at: string
}

export interface ObligacionProceso {
    id_obligacion: string
    proceso_id: string
    activo: boolean
    created_at: string
}

export interface ObligacionCalendario {
    id_obligacion: string
    calendario_regla_id: string
    activo: boolean
    created_at: string
}
