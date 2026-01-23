'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface TrendIndicatorProps {
  /** The trend value (e.g., +12, -5) */
  value: number
  /** Direction of the trend (auto-detected if not provided) */
  direction?: 'up' | 'down' | 'neutral'
  /** Optional label (e.g., "vs last month") */
  label?: string
  /** Whether the trend is inverted (e.g., for metrics where lower is better) */
  inverted?: boolean
  /** Size of the indicator */
  size?: 'sm' | 'md' | 'lg'
  /** Show percentage symbol */
  showPercent?: boolean
  /** Show plus sign for positive values */
  showPlusSign?: boolean
}

/**
 * TrendIndicator component
 *
 * Shows trend direction with color-coded indicators
 * Useful for KPI cards and metrics displays
 */
export function TrendIndicator({
  value,
  direction,
  label,
  inverted = false,
  size = 'md',
  showPercent = true,
  showPlusSign = true
}: TrendIndicatorProps) {
  // Auto-detect direction if not provided
  const effectiveDirection = direction || (value > 0 ? 'up' : value < 0 ? 'down' : 'neutral')

  // Determine if this is a positive or negative trend (considering inversion)
  const isPositive = inverted
    ? effectiveDirection === 'down'
    : effectiveDirection === 'up'

  const isNegative = inverted
    ? effectiveDirection === 'up'
    : effectiveDirection === 'down'

  const isNeutral = effectiveDirection === 'neutral'

  // Size configurations
  const sizeConfig = {
    sm: {
      iconSize: 12,
      textClass: 'text-xs',
      paddingClass: 'px-1.5 py-0.5',
      gapClass: 'gap-0.5'
    },
    md: {
      iconSize: 14,
      textClass: 'text-sm',
      paddingClass: 'px-2 py-0.5',
      gapClass: 'gap-1'
    },
    lg: {
      iconSize: 16,
      textClass: 'text-base',
      paddingClass: 'px-2.5 py-1',
      gapClass: 'gap-1.5'
    }
  }

  const config = sizeConfig[size]

  // Color configurations
  const colorConfig = isPositive
    ? {
        bgClass: 'bg-green-50',
        textClass: 'text-green-700',
        borderClass: 'border-green-200'
      }
    : isNegative
    ? {
        bgClass: 'bg-red-50',
        textClass: 'text-red-700',
        borderClass: 'border-red-200'
      }
    : {
        bgClass: 'bg-slate-50',
        textClass: 'text-slate-500',
        borderClass: 'border-slate-200'
      }

  // Icon component
  const Icon = effectiveDirection === 'up'
    ? TrendingUp
    : effectiveDirection === 'down'
    ? TrendingDown
    : Minus

  // Format value
  const formattedValue = () => {
    const absValue = Math.abs(value)
    const prefix = value > 0 && showPlusSign ? '+' : value < 0 ? '-' : ''
    const suffix = showPercent ? '%' : ''
    return `${prefix}${absValue}${suffix}`
  }

  if (isNeutral && value === 0) {
    return (
      <span
        className={`inline-flex items-center ${config.gapClass} ${config.paddingClass} rounded-md border ${colorConfig.bgClass} ${colorConfig.textClass} ${colorConfig.borderClass} font-medium ${config.textClass}`}
      >
        <Minus size={config.iconSize} />
        <span>{label || 'Sin cambios'}</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center ${config.gapClass} ${config.paddingClass} rounded-md border ${colorConfig.bgClass} ${colorConfig.textClass} ${colorConfig.borderClass} font-medium ${config.textClass}`}
    >
      <Icon size={config.iconSize} />
      <span>{formattedValue()}</span>
      {label && <span className="opacity-75">{label}</span>}
    </span>
  )
}

export default TrendIndicator
