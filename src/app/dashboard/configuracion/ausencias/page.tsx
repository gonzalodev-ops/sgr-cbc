'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Plus,
  Calendar,
  User,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRightLeft,
  Trash2
} from 'lucide-react'
import AusenciaForm from '@/components/config/AusenciaForm'

interface Ausencia {
  ausencia_id: string
  colaborador_id: string
  fecha_inicio: string
  fecha_fin: string
  tipo: 'VACACIONES' | 'INCAPACIDAD' | 'PERMISO' | 'OTRO'
  suplente_id: string | null
  motivo: string | null
  activo: boolean
  created_at: string
  colaborador: {
    nombre: string
    email: string
  }
  suplente?: {
    nombre: string
  }
}

interface Colaborador {
  user_id: string
  nombre: string
  email: string
  activo: boolean
}

type FiltroTipo = 'TODAS' | 'VACACIONES' | 'INCAPACIDAD' | 'PERMISO' | 'OTRO'
type FiltroEstado = 'TODAS' | 'ACTIVAS' | 'FUTURAS' | 'PASADAS'

export default function AusenciasPage() {
  const [ausencias, setAusencias] = useState<Ausencia[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAusencia, setEditingAusencia] = useState<Ausencia | null>(null)
  const [procesandoReasignacion, setProcesandoReasignacion] = useState<string | null>(null)

  // Filtros
  const [filtroColaborador, setFiltroColaborador] = useState<string>('')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('TODAS')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODAS')

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Cargar colaboradores
      const { data: colabData } = await supabase
        .from('users')
        .select('user_id, nombre, email, activo')
        .eq('activo', true)
        .order('nombre')

      setColaboradores(colabData || [])

      // Cargar ausencias
      const { data: ausenciasData } = await supabase
        .from('ausencia')
        .select(`
          *,
          colaborador:colaborador_id (
            nombre,
            email
          ),
          suplente:suplente_id (
            nombre
          )
        `)
        .order('fecha_inicio', { ascending: false })

      setAusencias(ausenciasData || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function guardarAusencia(data: Omit<Ausencia, 'ausencia_id' | 'created_at' | 'created_by' | 'activo' | 'colaborador' | 'suplente'>) {
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()

      if (editingAusencia) {
        // Actualizar ausencia existente
        const { error } = await supabase
          .from('ausencia')
          .update({
            fecha_inicio: data.fecha_inicio,
            fecha_fin: data.fecha_fin,
            tipo: data.tipo,
            suplente_id: data.suplente_id || null,
            motivo: data.motivo
          })
          .eq('ausencia_id', editingAusencia.ausencia_id)

        if (error) throw error
      } else {
        // Crear nueva ausencia
        const { error } = await supabase
          .from('ausencia')
          .insert({
            colaborador_id: data.colaborador_id,
            fecha_inicio: data.fecha_inicio,
            fecha_fin: data.fecha_fin,
            tipo: data.tipo,
            suplente_id: data.suplente_id || null,
            motivo: data.motivo,
            activo: true,
            created_by: user?.id
          })

        if (error) throw error

        // Disparar reasignación automática si la ausencia es actual o futura
        const hoy = new Date().toISOString().split('T')[0]
        if (data.fecha_fin >= hoy) {
          await reasignarTareas(data.colaborador_id, data.suplente_id || undefined)
        }
      }

      setShowForm(false)
      setEditingAusencia(null)
      loadData()
    } catch (error) {
      console.error('Error guardando ausencia:', error)
      alert('Error al guardar la ausencia: ' + (error as Error).message)
      throw error
    }
  }

  async function reasignarTareas(colaboradorId: string, suplenteId?: string) {
    setProcesandoReasignacion(colaboradorId)
    try {
      const response = await fetch('/api/engine/auto-reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colaboradorId, suplenteId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error en la reasignación')
      }

      interface DetalleReasignacion {
        obligacionNombre: string
        clienteNombre: string
      }
      alert(result.mensaje + (result.detalles ? `\n\nDetalles:\n${(result.detalles as DetalleReasignacion[]).map((d) => `- ${d.obligacionNombre} (${d.clienteNombre})`).join('\n')}` : ''))
    } catch (error) {
      console.error('Error reasignando tareas:', error)
      alert('Error al reasignar tareas: ' + (error as Error).message)
    } finally {
      setProcesandoReasignacion(null)
    }
  }

  async function eliminarAusencia(id: string) {
    if (!confirm('¿Desactivar esta ausencia?')) return

    try {
      const { error } = await supabase
        .from('ausencia')
        .update({ activo: false })
        .eq('ausencia_id', id)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error eliminando ausencia:', error)
      alert('Error al eliminar la ausencia')
    }
  }

  function getEstadoAusencia(fechaInicio: string, fechaFin: string): 'activa' | 'futura' | 'pasada' {
    const hoy = new Date().toISOString().split('T')[0]
    if (fechaInicio > hoy) return 'futura'
    if (fechaFin < hoy) return 'pasada'
    return 'activa'
  }

  // Aplicar filtros
  const ausenciasFiltradas = ausencias.filter(ausencia => {
    if (!ausencia.activo) return false
    if (filtroColaborador && ausencia.colaborador_id !== filtroColaborador) return false
    if (filtroTipo !== 'TODAS' && ausencia.tipo !== filtroTipo) return false

    const estado = getEstadoAusencia(ausencia.fecha_inicio, ausencia.fecha_fin)
    if (filtroEstado === 'ACTIVAS' && estado !== 'activa') return false
    if (filtroEstado === 'FUTURAS' && estado !== 'futura') return false
    if (filtroEstado === 'PASADAS' && estado !== 'pasada') return false

    return true
  })

  const getTipoColor = (tipo: string) => {
    const colores: Record<string, string> = {
      VACACIONES: 'bg-blue-100 text-blue-700',
      INCAPACIDAD: 'bg-red-100 text-red-700',
      PERMISO: 'bg-amber-100 text-amber-700',
      OTRO: 'bg-slate-100 text-slate-700'
    }
    return colores[tipo] || 'bg-slate-100 text-slate-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-700">Cargando ausencias...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Ausencias</h1>
            <p className="text-slate-700 mt-1">
              Registro de ausencias y reasignación automática de tareas
            </p>
          </div>
          <button
            onClick={() => {
              setEditingAusencia(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            <Plus size={18} />
            Nueva Ausencia
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-600" />
          <h2 className="font-semibold text-slate-800">Filtros</h2>
          {(filtroColaborador || filtroTipo !== 'TODAS' || filtroEstado !== 'TODAS') && (
            <button
              onClick={() => {
                setFiltroColaborador('')
                setFiltroTipo('TODAS')
                setFiltroEstado('TODAS')
              }}
              className="ml-auto text-sm text-slate-600 hover:text-slate-800"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-600 font-medium mb-1">
              Colaborador
            </label>
            <select
              value={filtroColaborador}
              onChange={(e) => setFiltroColaborador(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">Todos</option>
              {colaboradores.map(c => (
                <option key={c.user_id} value={c.user_id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 font-medium mb-1">
              Tipo
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="TODAS">Todas</option>
              <option value="VACACIONES">Vacaciones</option>
              <option value="INCAPACIDAD">Incapacidad</option>
              <option value="PERMISO">Permiso</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 font-medium mb-1">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="TODAS">Todas</option>
              <option value="ACTIVAS">Activas</option>
              <option value="FUTURAS">Futuras</option>
              <option value="PASADAS">Pasadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Calendar size={20} className="text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{ausencias.filter(a => a.activo).length}</p>
              <p className="text-xs text-slate-600">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {ausencias.filter(a => a.activo && getEstadoAusencia(a.fecha_inicio, a.fecha_fin) === 'activa').length}
              </p>
              <p className="text-xs text-slate-600">Activas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {ausencias.filter(a => a.activo && getEstadoAusencia(a.fecha_inicio, a.fecha_fin) === 'futura').length}
              </p>
              <p className="text-xs text-slate-600">Futuras</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <XCircle size={20} className="text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-600">
                {ausencias.filter(a => a.activo && getEstadoAusencia(a.fecha_inicio, a.fecha_fin) === 'pasada').length}
              </p>
              <p className="text-xs text-slate-600">Pasadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de ausencias */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Colaborador
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Fecha Inicio
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Fecha Fin
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Suplente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ausenciasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No hay ausencias registradas
                  </td>
                </tr>
              ) : (
                ausenciasFiltradas.map((ausencia) => {
                  const estado = getEstadoAusencia(ausencia.fecha_inicio, ausencia.fecha_fin)
                  return (
                    <tr key={ausencia.ausencia_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-800">
                              {ausencia.colaborador.nombre}
                            </p>
                            <p className="text-xs text-slate-500">
                              {ausencia.colaborador.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getTipoColor(ausencia.tipo)}`}>
                          {ausencia.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {new Date(ausencia.fecha_inicio).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {new Date(ausencia.fecha_fin).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {ausencia.suplente?.nombre || (
                          <span className="text-slate-400 italic">Líder del equipo</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {estado === 'activa' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                            <CheckCircle size={12} />
                            Activa
                          </span>
                        )}
                        {estado === 'futura' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                            <Clock size={12} />
                            Futura
                          </span>
                        )}
                        {estado === 'pasada' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                            <XCircle size={12} />
                            Finalizada
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {estado !== 'pasada' && (
                            <button
                              onClick={() => reasignarTareas(ausencia.colaborador_id, ausencia.suplente_id || undefined)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Reasignar tareas"
                              disabled={procesandoReasignacion === ausencia.colaborador_id}
                            >
                              {procesandoReasignacion === ausencia.colaborador_id ? (
                                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <ArrowRightLeft size={16} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => eliminarAusencia(ausencia.ausencia_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulario modal */}
      {showForm && (
        <AusenciaForm
          colaboradores={colaboradores}
          ausenciaInicial={editingAusencia || undefined}
          onGuardar={guardarAusencia}
          onCancelar={() => {
            setShowForm(false)
            setEditingAusencia(null)
          }}
        />
      )}
    </div>
  )
}
