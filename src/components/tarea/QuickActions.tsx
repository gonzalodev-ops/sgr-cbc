'use client'

import { useState, useRef } from 'react'
import {
  CheckCircle,
  Upload,
  Eye,
  Play,
  FileCheck,
  Send,
  MoreHorizontal,
  X,
  AlertCircle,
  Loader2
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
  const [uploading, setUploading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Manejar click en subir evidencia
  const handleUploadClick = () => {
    setUploadError(null)
    fileInputRef.current?.click()
  }

  // Manejar seleccion de archivo
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/xml',
      'text/xml'
    ]

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Tipo de archivo no permitido. Solo PDF, imagenes o XML.')
      return
    }

    // Validar tamano (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('El archivo excede el tamano maximo de 10MB.')
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Generar nombre unico para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${tareaId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      // Subir archivo al bucket de evidencias
      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Obtener URL publica
      const { data: urlData } = supabase.storage
        .from('evidencias')
        .getPublicUrl(fileName)

      // Registrar documento en la base de datos
      const { error: docError } = await supabase
        .from('tarea_documento')
        .insert({
          tarea_id: tareaId,
          tipo_documento: 'EVIDENCIA',
          nombre_archivo: file.name,
          url_archivo: urlData.publicUrl,
          tamano_bytes: file.size,
          mime_type: file.type,
          subido_por: user.id
        })

      if (docError) {
        console.warn('Error registrando documento:', docError)
      }

      // Registrar evento
      await supabase
        .from('tarea_evento')
        .insert({
          tarea_id: tareaId,
          tipo_evento: 'documento_subido',
          actor_usuario_id: user.id,
          metadata_json: {
            nombre_archivo: file.name,
            tipo: file.type,
            tamano: file.size
          },
          occurred_at: new Date().toISOString()
        })

      // Notificar al componente padre
      onUploadEvidence?.(tareaId)

    } catch (error) {
      console.error('Error subiendo archivo:', error)
      setUploadError('Error al subir el archivo. Intente de nuevo.')
    } finally {
      setUploading(false)
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
      {/* Input oculto para archivos */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.xml"
        onChange={handleFileChange}
      />

      {/* Boton de accion primaria */}
      {actionConfig.primaryAction && (
        <button
          onClick={actionConfig.primaryAction.action}
          disabled={isLoading || uploading}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${actionConfig.primaryAction.color}`}
          title={actionConfig.primaryAction.label}
        >
          <actionConfig.primaryAction.icon size={14} />
          <span className="hidden sm:inline">{actionConfig.primaryAction.label}</span>
        </button>
      )}

      {/* Boton de subir evidencia */}
      {actionConfig.showUpload && (
        <button
          onClick={handleUploadClick}
          disabled={isLoading || uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Subir evidencia"
        >
          {uploading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          <span className="hidden sm:inline">{uploading ? 'Subiendo...' : 'Evidencia'}</span>
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
                    handleUploadClick()
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Upload size={14} />
                  Subir evidencia
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Error de upload */}
      {uploadError && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 z-30">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 flex-1">{uploadError}</p>
          <button
            onClick={() => setUploadError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
