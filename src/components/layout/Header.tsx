'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import {
  Bell,
  Search,
  User,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  FileText,
  ChevronRight,
  Check,
  LogOut
} from 'lucide-react'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { formatearFechaRelativa } from '@/lib/utils/dateCalculations'

interface HeaderProps {
  title?: string
}

interface Notification {
  notificacion_id: string
  tipo: 'tarea' | 'validacion' | 'reasignacion' | 'seguimiento' | 'alerta' | 'sistema'
  titulo: string
  mensaje: string
  leida: boolean
  created_at: string
  link?: string
  metadata?: Record<string, any>
}

// Notification type config
const NOTIFICATION_CONFIG: Record<string, { icon: any; bgColor: string; textColor: string }> = {
  tarea: { icon: FileText, bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
  validacion: { icon: CheckCircle, bgColor: 'bg-green-100', textColor: 'text-green-600' },
  reasignacion: { icon: ArrowRightLeft, bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
  seguimiento: { icon: Clock, bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
  alerta: { icon: AlertTriangle, bgColor: 'bg-red-100', textColor: 'text-red-600' },
  sistema: { icon: Bell, bgColor: 'bg-slate-100', textColor: 'text-slate-600' }
}

export function Header({ title = 'SGR CBC' }: HeaderProps) {
  const { userName, userId, rol, isLoading } = useUserRole()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])

  // Fetch notifications
  useEffect(() => {
    if (!supabase || !userId) {
      setLoadingNotifications(false)
      return
    }

    async function fetchNotifications() {
      if (!supabase || !userId) return

      try {
        // Try to fetch from notificaciones table
        // If table doesn't exist, we'll use mock data for now
        const { data, error } = await supabase
          .from('notificaciones')
          .select('*')
          .eq('usuario_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) {
          // Table might not exist - generate mock notifications based on events
          console.log('Notifications table not found, generating from events')
          const mockNotifications = await generateNotificationsFromEvents(supabase, userId)
          setNotifications(mockNotifications)
        } else {
          setNotifications(data || [])
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
        setNotifications([])
      } finally {
        setLoadingNotifications(false)
      }
    }

    fetchNotifications()

    // Poll for new notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [supabase, userId])

  // Generate notifications from tarea_evento if notificaciones table doesn't exist
  async function generateNotificationsFromEvents(supabase: any, userId: string): Promise<Notification[]> {
    const { data: events } = await supabase
      .from('tarea_evento')
      .select(`
        evento_id,
        tipo_evento,
        occurred_at,
        metadata_json,
        tarea:tarea_id (
          cliente:cliente_id(nombre_comercial),
          obligacion:id_obligacion(nombre_corto)
        )
      `)
      .in('tipo_evento', ['reasignacion', 'validacion', 'cambio_estado'])
      .order('occurred_at', { ascending: false })
      .limit(10)

    if (!events) return []

    return events.map((event: any, index: number) => {
      const tarea = Array.isArray(event.tarea) ? event.tarea[0] : event.tarea
      const cliente = tarea?.cliente?.nombre_comercial || 'Cliente'
      const obligacion = tarea?.obligacion?.nombre_corto || 'Tarea'

      let titulo = ''
      let tipo: Notification['tipo'] = 'sistema'

      switch (event.tipo_evento) {
        case 'reasignacion':
          titulo = 'Tarea reasignada'
          tipo = 'reasignacion'
          break
        case 'validacion':
          titulo = 'Validacion completada'
          tipo = 'validacion'
          break
        case 'cambio_estado':
          titulo = 'Estado actualizado'
          tipo = 'tarea'
          break
        default:
          titulo = 'Notificacion del sistema'
      }

      return {
        notificacion_id: event.evento_id,
        tipo,
        titulo,
        mensaje: `${cliente} - ${obligacion}`,
        leida: index > 2, // First 3 are unread for demo
        created_at: event.occurred_at,
        metadata: event.metadata_json
      }
    })
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Count unread notifications
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.leida).length
  }, [notifications])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!supabase) return

    // Update local state immediately
    setNotifications(prev => prev.map(n =>
      n.notificacion_id === notificationId ? { ...n, leida: true } : n
    ))

    // Try to update in database
    try {
      await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('notificacion_id', notificationId)
    } catch (error) {
      // Ignore errors if table doesn't exist
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    if (!supabase || !userId) return

    // Update local state immediately
    setNotifications(prev => prev.map(n => ({ ...n, leida: true })))

    // Try to update in database
    try {
      await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('usuario_id', userId)
    } catch (error) {
      // Ignore errors if table doesn't exist
    }
  }

  // Get user initials
  const userInitials = useMemo(() => {
    if (!userName) return 'U'
    const parts = userName.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return userName.substring(0, 2).toUpperCase()
  }, [userName])

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
      {/* Left: Title */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all w-64"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`relative p-2 rounded-lg transition-colors ${
              showDropdown ? 'bg-slate-200' : 'hover:bg-slate-100'
            }`}
            aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
          >
            <Bell size={20} className="text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Notificaciones</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[#34588C] hover:text-[#264066] font-medium flex items-center gap-1"
                  >
                    <Check size={14} />
                    Marcar todas como leidas
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="p-8 text-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-slate-500 mt-2">Cargando...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={32} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No hay notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map(notification => {
                      const config = NOTIFICATION_CONFIG[notification.tipo] || NOTIFICATION_CONFIG.sistema
                      const NotificationIcon = config.icon

                      return (
                        <div
                          key={notification.notificacion_id}
                          className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                            !notification.leida ? 'bg-blue-50/50' : ''
                          }`}
                          onClick={() => markAsRead(notification.notificacion_id)}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0`}>
                              <NotificationIcon size={16} className={config.textColor} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm ${!notification.leida ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                                  {notification.titulo}
                                </p>
                                {!notification.leida && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">
                                {notification.mensaje}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {formatearFechaRelativa(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-slate-200 bg-slate-50">
                <Link
                  href="/dashboard/notificaciones"
                  className="flex items-center justify-center gap-1 text-sm text-[#34588C] hover:text-[#264066] font-medium"
                  onClick={() => setShowDropdown(false)}
                >
                  Ver todas las notificaciones
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
          <div className="w-8 h-8 bg-gradient-to-br from-[#F19F53] to-[#34588C] rounded-full flex items-center justify-center text-white font-medium text-sm">
            {isLoading ? '...' : userInitials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-700">
              {isLoading ? 'Cargando...' : userName || 'Usuario'}
            </p>
            {rol && (
              <p className="text-xs text-slate-500">{rol}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
