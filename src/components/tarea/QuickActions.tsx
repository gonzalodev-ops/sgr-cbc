'use client'

import { useState } from 'react'
import {
  Link2,
  Eye,
  Play,
  FileCheck,
  Send,
  MoreHorizontal,
  X,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

export interface QuickActionsProps {
  tareaId: string
  estadoActual: string
  onComplete?: (tareaId: string) => void
  onUploadEvidence?: (tareaId: string) => void
  onViewDetail?: (tareaId: string) => void
  isLoading?: boolean
}

/**
 * QuickActions - Componente de acciones rapidas para tareas
 *
 * Muestra botones de accion contextual basados en el estado actual de la tarea.
 * Permite completar tareas, subir evidencia y ver detalles sin navegar.
 */
export default function QuickActions({
  tareaId,
  estadoActual,
  onComplete,
  onUploadEvidence,
  onViewDetail,
  isLoading = false
}: QuickActionsProps) {
  const [saving, setSaving] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [urlSuccess, setUrlSuccess] = useState(false)

  // Configuracion de acciones por estado
  const getActionConfig = () => {
    switch (estadoActual) {
      case 'pendiente':
        return {
          primaryAction: {
            label: 'Iniciar',
            icon: Play,
            color: 'bg-blue-600 hover:bg-blue-700',
            action: () => onComplete?.(tareaId)
          },
          showUpload: false
        }
      case 'en_curso':
        return {
          primaryAction: {
            label: 'Completar',
            icon: FileCheck,
            color: 'bg-purple-600 hover:bg-purple-700',
            action: () => onComplete?.(tareaId)
          },
          showUpload: true
        }
      case 'pendiente_evidencia':
        return {
          primaryAction: {
            label: 'Validar',
            icon: Send,
            color: 'bg-green-600 hover:bg-green-700',
            action: () => onComplete?.(tareaId)
          },
          showUpload: true
        }
      case 'rechazado':
        return {
          primaryAction: {
            label: 'Reenviar',
            icon: Send,
            color: 'bg-orange-600 hover:bg-orange-700',
            action: () => onComplete?.(tareaId)
          },
          showUpload: true
        }
      case 'en_validacion':
        return {
          primaryAction: null,
          showUpload: false
        }
      case 'bloqueado_cliente':
        return {
          primaryAction: null,
          showUpload: false
        }
      default:
        return {
          primaryAction: null,
          showUpload: false
        }
    }
  }

  const actionConfig = getActionConfig()

  // Validar que sea una URL valida (http:// o https://)
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  // Abrir modal para agregar URL de evidencia
  const handleAddEvidenceClick = () => {
    setUrlError(null)
    setUrlSuccess(false)
    setUrlInput('')
    setShowUrlModal(true)
  }

  // Guardar URL de evidencia
  const handleSaveUrl = async () => {
    const trimmedUrl = urlInput.trim()

    // Validar que no este vacia
    if (!trimmedUrl) {
      setUrlError('Por favor ingresa una URL.')
      return
    }

    // Validar formato de URL
    if (!isValidUrl(trimmedUrl)) {
      setUrlError('URL invalida. Debe comenzar con http:// o https://')
      return
    }

    setSaving(true)
    setUrlError(null)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Extraer nombre del archivo de la URL (o usar un nombre generico)
      const urlObj = new URL(trimmedUrl)
      const pathParts = urlObj.pathname.split('/')
      const nombreArchivo = pathParts[pathParts.length - 1] || 'Evidencia SharePoint/OneDrive'

      // Registrar documento en la base de datos (solo URL, sin subida de archivo)
      const { error: docError } = await supabase
        .from('tarea_documento')
        .insert({
          tarea_id: tareaId,
          tipo_documento: 'EVIDENCIA',
          nombre_archivo: nombreArchivo,
          url_archivo: trimmedUrl,
          tamano_bytes: 0,
          mime_type: 'application/link',
          subido_por: user.id
        })

      if (docError) {
        console.error('Error registrando documento:', docError)
        throw new Error('Error al guardar la URL')
      }

      // Registrar evento
      await supabase
        .from('tarea_evento')
        .insert({
          tarea_id: tareaId,
          tipo_evento: 'documento_subido',
          actor_usuario_id: user.id,
          metadata_json: {
            nombre_archivo: nombreArchivo,
            tipo: 'link',
            url: trimmedUrl
          },
          occurred_at: new Date().toISOString()
        })

      // Mostrar exito y cerrar modal
      setUrlSuccess(true)
      setTimeout(() => {
        setShowUrlModal(false)
        setUrlInput('')
        setUrlSuccess(false)
        // Notificar al componente padre
        onUploadEvidence?.(tareaId)
      }, 1500)

    } catch (error) {
      console.error('Error guardando URL:', error)
      setUrlError('Error al guardar la URL. Intente de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // Spinner de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-24 h-10">
        <Loader2 size={20} className="text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Modal para agregar URL de evidencia */}
      {showUrlModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => !saving && setShowUrlModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-50 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Agregar Evidencia</h3>
              <button
                onClick={() => !saving && setShowUrlModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={saving}
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {urlSuccess ? (
              <div className="flex flex-col items-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check size={32} className="text-green-600" />
                </div>
                <p className="text-green-600 font-medium">URL guardada correctamente</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    URL de SharePoint/OneDrive
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value)
                      setUrlError(null)
                    }}
                    placeholder="Pega aqui la URL de SharePoint/OneDrive"
                    className={`w-full px-4 py-3 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      urlError ? 'border-red-300 bg-red-50' : 'border-slate-300'
                    }`}
                    disabled={saving}
                    autoFocus
                  />
                  {urlError && (
                    <div className="flex items-center gap-2 mt-2 text-red-600">
                      <AlertCircle size={14} />
                      <p className="text-sm">{urlError}</p>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    Copia y pega el enlace del archivo desde SharePoint o OneDrive
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowUrlModal(false)}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveUrl}
                    disabled={saving || !urlInput.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        Guardar URL
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Boton de accion primaria */}
      {actionConfig.primaryAction && (
        <button
          onClick={actionConfig.primaryAction.action}
          disabled={isLoading || saving}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${actionConfig.primaryAction.color}`}
          title={actionConfig.primaryAction.label}
        >
          <actionConfig.primaryAction.icon size={14} />
          <span className="hidden sm:inline">{actionConfig.primaryAction.label}</span>
        </button>
      )}

      {/* Boton de agregar evidencia (URL) */}
      {actionConfig.showUpload && (
        <button
          onClick={handleAddEvidenceClick}
          disabled={isLoading || saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Agregar URL de evidencia"
        >
          <Link2 size={14} />
          <span className="hidden sm:inline">Evidencia</span>
        </button>
      )}

      {/* Boton de ver detalle */}
      <button
        onClick={() => onViewDetail?.(tareaId)}
        disabled={isLoading}
        className="flex items-center justify-center w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Ver detalle"
      >
        <Eye size={16} />
      </button>

      {/* Menu de mas opciones (futuro) */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={isLoading}
          className="flex items-center justify-center w-8 h-8 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors disabled:opacity-50"
          title="Mas opciones"
        >
          <MoreHorizontal size={16} />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
              <button
                onClick={() => {
                  onViewDetail?.(tareaId)
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Eye size={14} />
                Ver detalle completo
              </button>
              {actionConfig.showUpload && (
                <button
                  onClick={() => {
                    handleAddEvidenceClick()
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Link2 size={14} />
                  Agregar URL evidencia
                </button>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  )
}
