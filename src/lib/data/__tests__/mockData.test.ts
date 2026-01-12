import { calcularPuntos, type Entregable } from '../mockData'

describe('calcularPuntos', () => {
  const baseEntregable: Entregable = {
    id: '1',
    rfc: 'TEST123456ABC',
    cliente: 'Cliente Test',
    entregable: 'Test Entregable',
    talla: 'M',
    puntosBase: 100,
    responsable: 'Test User',
    rol: 'Aux A',
    tribu: 'Test Tribu',
    estado: 'terminado',
    evidencia: true,
    voboLider: true,
    auditoria: 'aprobado',
  }

  it('debe calcular puntos correctamente para entregable completo con talla M', () => {
    const puntos = calcularPuntos(baseEntregable)
    expect(puntos).toBe(100) // 100 * 1.0 (factor M)
  })

  it('debe calcular puntos correctamente para diferentes tallas', () => {
    expect(calcularPuntos({ ...baseEntregable, talla: 'XS', puntosBase: 100 })).toBe(50) // 100 * 0.5
    expect(calcularPuntos({ ...baseEntregable, talla: 'S', puntosBase: 100 })).toBe(75) // 100 * 0.75
    expect(calcularPuntos({ ...baseEntregable, talla: 'M', puntosBase: 100 })).toBe(100) // 100 * 1.0
    expect(calcularPuntos({ ...baseEntregable, talla: 'L', puntosBase: 100 })).toBe(150) // 100 * 1.5
    expect(calcularPuntos({ ...baseEntregable, talla: 'XL', puntosBase: 100 })).toBe(200) // 100 * 2.0
  })

  it('debe retornar 0 si el estado no es terminado', () => {
    const puntos = calcularPuntos({ ...baseEntregable, estado: 'en_curso' })
    expect(puntos).toBe(0)
  })

  it('debe retornar 0 si no hay evidencia', () => {
    const puntos = calcularPuntos({ ...baseEntregable, evidencia: false })
    expect(puntos).toBe(0)
  })

  it('debe retornar 0 si no hay vobo de líder', () => {
    const puntos = calcularPuntos({ ...baseEntregable, voboLider: false })
    expect(puntos).toBe(0)
  })

  it('debe retornar 0 si la auditoría no está aprobada', () => {
    expect(calcularPuntos({ ...baseEntregable, auditoria: 'pendiente' })).toBe(0)
    expect(calcularPuntos({ ...baseEntregable, auditoria: 'rechazado' })).toBe(0)
    expect(calcularPuntos({ ...baseEntregable, auditoria: 'no_auditado' })).toBe(0)
  })

  it('debe retornar 0 si falta cualquier requisito', () => {
    expect(calcularPuntos({ ...baseEntregable, estado: 'no_iniciado', evidencia: false })).toBe(0)
    expect(calcularPuntos({ ...baseEntregable, voboLider: false, auditoria: 'pendiente' })).toBe(0)
  })

  it('debe redondear correctamente los decimales', () => {
    // Con puntosBase que generan decimales
    const puntos = calcularPuntos({ ...baseEntregable, puntosBase: 33, talla: 'S' })
    expect(puntos).toBe(25) // Math.round(33 * 0.75) = 25
  })
})
