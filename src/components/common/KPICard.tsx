'use client'

import { ReactNode } from 'react'
import { TrendIndicator } from './TrendIndicator'

export interface KPICardProps {
  /** Title of the KPI */
  title: string
  /** Main value to display */
  value: string | number
  /** Subtitle or description */
  subtitle?: string
  /** Trend information */
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label?: string
  }
  /** Icon to display */
  icon?: ReactNode
  /** Visual variant based on status */
  variant?: 'default' | 'success' | 'warning' | 'danger'
  /** Loading state */
  loading?: boolean
  /** Click handler for drill-down */
  onClick?: () => void
  /** Whether trend is inverted (lower is better) */
  trendInverted?: boolean
  /** Progress bar value (0-100) */
  progress?: number
  /** Show percentage symbol for value */
  valueIsPercent?: boolean
  /** Additional className */
  className?: string
}

// Variant configurations
const VARIANT_CONFIG = {
  default: {
    bgColor: 'bg-white',
    borderColor: 'border-slate-200',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    valueColor: 'text-slate-800',
    progressColor: 'bg-slate-600'
  },
  success: {
    bgColor: 'bg-white',
    borderColor: 'border-slate-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    valueColor: 'text-green-600',
    progressColor: 'bg-green-500'
  },
  warning: {
    bgColor: 'bg-white',
    borderColor: 'border-slate-200',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    valueColor: 'text-yellow-600',
    progressColor: 'bg-yellow-500'
  },
  danger: {
    bgColor: 'bg-white',
    borderColor: 'border-slate-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    valueColor: 'text-red-600',
    progressColor: 'bg-red-500'
  }
}

/**
 * KPICard component
 *
 * A reusable card for displaying Key Performance Indicators
 * with optional trend indicators, icons, and interactive features
 */
export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  loading = false,
  onClick,
  trendInverted = false,
  progress,
  valueIsPercent = false,
  className = ''
}: KPICardProps) {
  const config = VARIANT_CONFIG[variant]
  const isClickable = !!onClick

  // Loading skeleton
  if (loading) {
    return (
      <div
        className={`${config.bgColor} rounded-xl p-6 shadow-sm border ${config.borderColor} animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-slate-200 rounded w-24"></div>
          <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-8 bg-slate-300 rounded w-20 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-32"></div>
      </div>
    )
  }

  // Format value
  const displayValue = typeof value === 'number'
    ? value.toLocaleString('es-MX')
    : value

  return (
    <div
      className={`
        ${config.bgColor} rounded-xl p-6 shadow-sm border ${config.borderColor}
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-slate-300 transition-all' : ''}
        ${className}
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      {/* Header with title and icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <p className="text-slate-500 text-sm font-medium">{title}</p>
        </div>
        {icon && (
          <div className={`${config.iconBg} p-3 rounded-lg ${config.iconColor}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Value with trend */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className={`text-3xl font-bold ${config.valueColor}`}>
            {displayValue}
            {valueIsPercent && <span className="text-xl">%</span>}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        {trend && (
          <TrendIndicator
            value={trend.value}
            direction={trend.direction}
            label={trend.label}
            inverted={trendInverted}
            size="sm"
          />
        )}
      </div>

      {/* Optional progress bar */}
      {progress !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Progreso</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${config.progressColor} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * KPICardGrid component
 *
 * A responsive grid container for KPI cards
 */
export function KPICardGrid({
  children,
  columns = 4,
  className = ''
}: {
  children: ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}) {
  const gridCols = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5'
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols[columns]} gap-4 ${className}`}>
      {children}
    </div>
  )
}

export default KPICard
