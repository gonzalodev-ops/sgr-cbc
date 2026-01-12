/**
 * Sistema de logging centralizado
 *
 * Características:
 * - Diferentes niveles de log (debug, info, warn, error)
 * - Información contextual automática
 * - Preparado para integración con Sentry
 * - Deshabilitado en producción para logs de debug
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

const isDevelopment = process.env.NODE_ENV === 'development'
const isServer = typeof window === 'undefined'

/**
 * Clase Logger para logging estructurado
 */
class Logger {
  private context: LogContext = {}

  /**
   * Agregar contexto global al logger
   */
  setContext(context: LogContext) {
    this.context = { ...this.context, ...context }
  }

  /**
   * Limpiar contexto
   */
  clearContext() {
    this.context = {}
  }

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message: string, context?: LogContext) {
    if (!isDevelopment) return

    this.log('debug', message, context)
  }

  /**
   * Log informativo
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  /**
   * Log de advertencia
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  /**
   * Log de error
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
      ...(error instanceof Error
        ? {
            error: error.message,
            stack: error.stack,
            name: error.name,
          }
        : { error }),
    }

    this.log('error', message, errorContext)

    // TODO: Enviar a Sentry en producción
    // if (!isDevelopment && typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     tags: { environment: process.env.NODE_ENV },
    //     extra: { ...this.context, ...context },
    //   })
    // }
  }

  /**
   * Método interno de logging
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const fullContext = { ...this.context, ...context }

    const logData = {
      timestamp,
      level,
      message,
      environment: isServer ? 'server' : 'client',
      ...(Object.keys(fullContext).length > 0 && { context: fullContext }),
    }

    // En desarrollo, mostrar logs formateados
    if (isDevelopment) {
      const colorMap: Record<LogLevel, string> = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m', // Green
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
      }

      const reset = '\x1b[0m'
      const color = colorMap[level]

      console.log(
        `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`,
        Object.keys(fullContext).length > 0 ? fullContext : ''
      )

      return
    }

    // En producción, log estructurado en JSON
    switch (level) {
      case 'debug':
        // No logear debug en producción
        break
      case 'info':
        console.info(JSON.stringify(logData))
        break
      case 'warn':
        console.warn(JSON.stringify(logData))
        break
      case 'error':
        console.error(JSON.stringify(logData))
        break
    }
  }
}

// Exportar instancia singleton
export const logger = new Logger()

// Helpers rápidos para uso común
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context)
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context)
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context)
export const logError = (message: string, error?: Error | unknown, context?: LogContext) =>
  logger.error(message, error, context)
