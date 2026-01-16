'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Settings, Save, RotateCcw, Loader2, AlertTriangle } from 'lucide-react'

interface TallaRfcProcesoProps {
  contribuyenteId: string
  rfcNombre: string
}

interface Talla {
  talla_id: string
  ponderacion: number
}

interface Proceso {
  proceso_id: string
  nombre: string
  activo: boolean
}

interface ConfiguracionProceso {
  proceso_id: string
  talla_id: string | null
  tiene_config_especifica: boolean
}

interface ConfigData {
  proceso_id: string
  talla_id: string | null
}

const TALLAS_LABELS: Record<string, string> = {
  'EXTRA_CHICA': 'XS',
  'CHICA': 'S',
  'MEDIANA': 'M',
  'GRANDE': 'L',
  'EXTRA_GRANDE': 'XL'
}

export default function TallaRfcProceso({ contribuyenteId, rfcNombre }: TallaRfcProcesoProps) {
  const [procesos, setProcesos] = useState<Proceso[]>([])
  const [tallas, setTallas] = useState<Talla[]>([])
  const [configuraciones, setConfiguraciones] = useState<Record<string, ConfiguracionProceso>>({})
  const [tallaDefault, setTallaDefault] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cambiosPendientes, setCambiosPendientes] = useState(false)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener procesos activos
      const { data: procesosData, error: errorProcesos } = await supabase
        .from('proceso_operativo')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (errorProcesos) throw errorProcesos

      // Obtener tallas
      const { data: tallasData, error: errorTallas } = await supabase
        .from('talla')
        .select('*')
        .eq('activo', true)
        .order('ponderacion')

      if (errorTallas) throw errorTallas

      // Obtener talla default del contribuyente
      const { data: contribuyenteData, error: errorContribuyente } = await supabase
        .from('contribuyente')
        .select('team_id')
        .eq('contribuyente_id', contribuyenteId)
        .single()

      if (errorContribuyente) throw errorContribuyente

      // Obtener configuraciones existentes
      const { data: configData, error: errorConfig } = await supabase
        .from('contribuyente_proceso_talla')
        .select('proceso_id, talla_id')
        .eq('contribuyente_id', contribuyenteId)
        .is('vigencia_fin', null)

      if (errorConfig) throw errorConfig

      setProcesos(procesosData || [])
      setTallas(tallasData || [])

      // Construir mapa de configuraciones
      const configMap: Record<string, ConfiguracionProceso> = {}
      ;(procesosData || []).forEach((proceso: Proceso) => {
        const config = ((configData || []) as ConfigData[]).find((c) => c.proceso_id === proceso.proceso_id)
        configMap[proceso.proceso_id] = {
          proceso_id: proceso.proceso_id,
          talla_id: config?.talla_id || null,
          tiene_config_especifica: !!config
        }
      })

      setConfiguraciones(configMap)
      // Por ahora no tenemos talla default a nivel contribuyente, usar MEDIANA
      setTallaDefault('MEDIANA')
    } catch (err: unknown) {
      console.error('Error al cargar datos:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar la configuracion'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [supabase, contribuyenteId])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  function handleCambioTalla(procesoId: string, tallaId: string) {
    setConfiguraciones(prev => ({
      ...prev,
      [procesoId]: {
        proceso_id: procesoId,
        talla_id: tallaId === '' ? null : tallaId,
        tiene_config_especifica: tallaId !== ''
      }
    }))
    setCambiosPendientes(true)
  }

  async function guardarCambios() {
    try {
      setSaving(true)
      setError(null)

      // Para cada proceso, actualizar o eliminar configuración
      for (const [procesoId, config] of Object.entries(configuraciones)) {
        if (config.talla_id) {
          // Insertar o actualizar configuración específica
          const { error: upsertError } = await supabase
            .from('contribuyente_proceso_talla')
            .upsert({
              contribuyente_id: contribuyenteId,
              proceso_id: procesoId,
              talla_id: config.talla_id,
              vigencia_inicio: new Date().toISOString().split('T')[0],
              vigencia_fin: null
            }, {
              onConflict: 'contribuyente_id,proceso_id,vigencia_inicio'
            })

          if (upsertError) throw upsertError
        } else {
          // Eliminar configuración específica (volver a default)
          const { error: deleteError } = await supabase
            .from('contribuyente_proceso_talla')
            .delete()
            .eq('contribuyente_id', contribuyenteId)
            .eq('proceso_id', procesoId)
            .is('vigencia_fin', null)

          if (deleteError) throw deleteError
        }
      }

      setCambiosPendientes(false)
      await cargarDatos() // Recargar para reflejar cambios
    } catch (err: unknown) {
      console.error('Error al guardar:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar los cambios'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  function resetearCambios() {
    cargarDatos()
    setCambiosPendientes(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="animate-spin text-slate-600" size={20} />
          <p className="text-slate-700">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  if (error && !cambiosPendientes) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle size={20} />
          <p className="font-medium">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-slate-600" />
            <div>
              <h4 className="font-semibold text-slate-800">Talla por Proceso</h4>
              <p className="text-xs text-slate-600">
                Configuración específica para {rfcNombre}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-600">Talla Default</p>
            <span className="inline-block px-2 py-1 bg-slate-200 text-slate-700 rounded text-sm font-medium">
              {TALLAS_LABELS[tallaDefault || 'MEDIANA']}
            </span>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        {procesos.length === 0 ? (
          <div className="text-center py-6">
            <AlertTriangle className="mx-auto mb-2 text-amber-500" size={24} />
            <p className="text-sm text-slate-700">No hay procesos operativos activos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {procesos.map((proceso) => {
              const config = configuraciones[proceso.proceso_id]
              const tallaActual = config?.talla_id || tallaDefault || 'MEDIANA'
              const esEspecifica = config?.tiene_config_especifica || false

              return (
                <div
                  key={proceso.proceso_id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    esEspecifica
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{proceso.nombre}</p>
                    <p className="text-xs text-slate-600">
                      {esEspecifica ? (
                        <span className="text-blue-700 font-medium">Talla específica configurada</span>
                      ) : (
                        <span>Usando talla default del contribuyente</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Selector de talla */}
                    <select
                      value={config?.talla_id || ''}
                      onChange={(e) => handleCambioTalla(proceso.proceso_id, e.target.value)}
                      className={`px-3 py-2 border rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        esEspecifica
                          ? 'bg-white border-blue-300 text-blue-700'
                          : 'bg-white border-slate-300 text-slate-700'
                      }`}
                      disabled={saving}
                    >
                      <option value="">Default ({TALLAS_LABELS[tallaDefault || 'MEDIANA']})</option>
                      {tallas.map((talla) => (
                        <option key={talla.talla_id} value={talla.talla_id}>
                          {TALLAS_LABELS[talla.talla_id]} ({talla.ponderacion})
                        </option>
                      ))}
                    </select>

                    {/* Indicador visual de talla actual */}
                    <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
                      esEspecifica
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-300 text-slate-700'
                    }`}>
                      {TALLAS_LABELS[tallaActual]}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Mensaje de error si hay cambios pendientes */}
        {error && cambiosPendientes && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        {cambiosPendientes && (
          <div className="mt-4 flex gap-2 pt-4 border-t border-slate-200">
            <button
              onClick={resetearCambios}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
              disabled={saving}
            >
              <RotateCcw size={16} />
              Cancelar
            </button>
            <button
              onClick={guardarCambios}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
