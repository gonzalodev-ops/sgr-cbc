/**
 * Logger condicional - solo loguea en desarrollo
 * En producción, los errores se silencian para no exponer información sensible
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
    error: (message: string, error?: unknown) => {
        if (isDev) {
            console.error(`[ERROR] ${message}`, error || '')
        }
        // En producción podríamos enviar a un servicio de monitoreo como Sentry
    },

    warn: (message: string, data?: unknown) => {
        if (isDev) {
            console.warn(`[WARN] ${message}`, data || '')
        }
    },

    info: (message: string, data?: unknown) => {
        if (isDev) {
            console.info(`[INFO] ${message}`, data || '')
        }
    },

    debug: (message: string, data?: unknown) => {
        if (isDev) {
            console.debug(`[DEBUG] ${message}`, data || '')
        }
    }
}

export default logger
