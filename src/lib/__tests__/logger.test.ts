import { logger, logDebug, logInfo, logWarn, logError } from '../logger'

// Mock console methods
const originalEnv = process.env.NODE_ENV

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleInfoSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    logger.clearContext()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleInfoSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = originalEnv
  })

  describe('logInfo', () => {
    it('debe llamar logger.info con el mensaje', () => {
      logInfo('Test info message')
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('debe loguear con contexto adicional', () => {
      logInfo('Test message', { userId: '123' })
      expect(consoleInfoSpy).toHaveBeenCalled()
    })
  })

  describe('logWarn', () => {
    it('debe llamar logger.warn con el mensaje', () => {
      logWarn('Test warning')
      expect(consoleWarnSpy).toHaveBeenCalled()
    })
  })

  describe('logError', () => {
    it('debe loguear errores correctamente', () => {
      const error = new Error('Test error')
      logError('An error occurred', error)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('debe manejar errores sin objeto Error', () => {
      logError('An error occurred', 'string error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('Context management', () => {
    it('debe permitir establecer y limpiar contexto global', () => {
      logger.setContext({ requestId: 'abc123' })
      logInfo('Test with context')

      logger.clearContext()
      logInfo('Test without context')

      expect(consoleInfoSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('debug logging', () => {
    it('no debe loguear en test environment', () => {
      // En test environment, isDevelopment es false, por lo que debug no loguea
      logDebug('Debug message')
      expect(consoleLogSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('no debe loguear en producción', () => {
      process.env.NODE_ENV = 'production'
      logDebug('Debug message')
      // En producción, debug no debería loguear
      expect(consoleLogSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })
  })
})
