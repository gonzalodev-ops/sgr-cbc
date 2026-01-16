'use client'

import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Pause,
  Play,
  FileCheck,
  CreditCard,
  Archive,
  Ban,
  type LucideIcon
} from 'lucide-react'
import {
  EstadoTarea,
  ESTADO_TAREA_CONFIG,
  NivelRiesgo,
  NIVEL_RIESGO_CONFIG,
  Prioridad,
  PRIORIDAD_CONFIG
} from '@/lib/constants/enums'

type StatusType = 'estado' | 'riesgo' | 'prioridad' | 'custom'

export interface StatusBadgeProps {
  /** The status value */
  status: EstadoTarea | NivelRiesgo | Prioridad | string
  /** Type of status to determine styling */
  type?: StatusType
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg'
  /** Show icon */
  showIcon?: boolean
  /** Custom label override */
  label?: string
  /** Custom variant for non-standard statuses */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  /** Pill style (fully rounded) */
  pill?: boolean
  /** Optional onClick handler */
  onClick?: () => void
}

// Icon mapping for EstadoTarea
const ESTADO_ICONS: Record<EstadoTarea, LucideIcon> = {
  [EstadoTarea.PENDIENTE]: Clock,
  [EstadoTarea.EN_CURSO]: Play,
  [EstadoTarea.PENDIENTE_EVIDENCIA]: FileCheck,
  [EstadoTarea.EN_VALIDACION]: CheckCircle,
  [EstadoTarea.BLOQUEADO_CLIENTE]: Pause,
  [EstadoTarea.PRESENTADO]: CheckCircle,
  [EstadoTarea.PAGADO]: CreditCard,
  [EstadoTarea.CERRADO]: Archive,
  [EstadoTarea.RECHAZADO]: Ban
}

// Icon mapping for NivelRiesgo
const RIESGO_ICONS: Record<NivelRiesgo, LucideIcon> = {
  [NivelRiesgo.ALTO]: AlertTriangle,
  [NivelRiesgo.MEDIO]: AlertTriangle,
  [NivelRiesgo.BAJO]: CheckCircle
}

// Icon mapping for Prioridad
const PRIORIDAD_ICONS: Record<Prioridad, LucideIcon> = {
  [Prioridad.ALTA]: AlertTriangle,
  [Prioridad.MEDIA]: Clock,
  [Prioridad.BAJA]: CheckCircle
}

// Custom variant configurations
const VARIANT_CONFIG: Record<string, { bgColor: string; textColor: string; borderColor: string }> = {
  default: { bgColor: 'bg-slate-100', textColor: 'text-slate-700', borderColor: 'border-slate-200' },
  success: { bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-200' },
  warning: { bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
  danger: { bgColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-200' },
  info: { bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  neutral: { bgColor: 'bg-slate-50', textColor: 'text-slate-500', borderColor: 'border-slate-200' }
}

/**
 * StatusBadge component
 *
 * A reusable badge component for displaying status information
 * Works with EstadoTarea, NivelRiesgo, Prioridad enums, or custom statuses
 */
export function StatusBadge({
  status,
  type = 'estado',
  size = 'md',
  showIcon = true,
  label,
  variant,
  pill = false,
  onClick
}: StatusBadgeProps) {
  // Size configurations
  const sizeConfig = {
    sm: {
      iconSize: 12,
      textClass: 'text-xs',
      paddingClass: 'px-2 py-0.5',
      gapClass: 'gap-1'
    },
    md: {
      iconSize: 14,
      textClass: 'text-sm',
      paddingClass: 'px-2.5 py-1',
      gapClass: 'gap-1.5'
    },
    lg: {
      iconSize: 16,
      textClass: 'text-base',
      paddingClass: 'px-3 py-1.5',
      gapClass: 'gap-2'
    }
  }

  const config = sizeConfig[size]
  const roundedClass = pill ? 'rounded-full' : 'rounded-md'

  // Get styling based on type and status
  const getConfig = () => {
    if (variant) {
      return VARIANT_CONFIG[variant]
    }

    switch (type) {
      case 'estado':
        return ESTADO_TAREA_CONFIG[status as EstadoTarea] || VARIANT_CONFIG.default
      case 'riesgo':
        return NIVEL_RIESGO_CONFIG[status as NivelRiesgo] || VARIANT_CONFIG.default
      case 'prioridad':
        return PRIORIDAD_CONFIG[status as Prioridad] || VARIANT_CONFIG.default
      default:
        return VARIANT_CONFIG.default
    }
  }

  // Get icon based on type and status
  const getIcon = (): LucideIcon | null => {
    switch (type) {
      case 'estado':
        return ESTADO_ICONS[status as EstadoTarea] || null
      case 'riesgo':
        return RIESGO_ICONS[status as NivelRiesgo] || null
      case 'prioridad':
        return PRIORIDAD_ICONS[status as Prioridad] || null
      default:
        return null
    }
  }

  // Get label
  const getLabel = () => {
    if (label) return label

    switch (type) {
      case 'estado':
        return ESTADO_TAREA_CONFIG[status as EstadoTarea]?.label || status
      case 'riesgo':
        return NIVEL_RIESGO_CONFIG[status as NivelRiesgo]?.label || status
      case 'prioridad':
        return PRIORIDAD_CONFIG[status as Prioridad]?.label || status
      default:
        return status
    }
  }

  const styleConfig = getConfig()
  const Icon = getIcon()
  const displayLabel = getLabel()

  const baseClasses = `inline-flex items-center ${config.gapClass} ${config.paddingClass} ${roundedClass} border font-medium ${config.textClass}`
  const colorClasses = `${styleConfig.bgColor} ${styleConfig.textColor} ${'borderColor' in styleConfig ? styleConfig.borderColor : 'border-slate-200'}`
  const interactiveClasses = onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''

  return (
    <span
      className={`${baseClasses} ${colorClasses} ${interactiveClasses}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {showIcon && Icon && <Icon size={config.iconSize} />}
      <span>{displayLabel}</span>
    </span>
  )
}

export default StatusBadge
