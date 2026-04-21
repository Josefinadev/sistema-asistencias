'use client'

import { useState, useEffect, useCallback } from 'react'
import { crearUsuario, actualizarUsuario, eliminarUsuario } from '@/app/actions/adminActions'
import { getScopedUsers, getTutorOptions } from '@/app/actions/userActions'
import { getRoleLabel } from '@/lib/roles'
import toast from 'react-hot-toast'
import { UserPlus, Trash2, Edit2, Shield, RefreshCw, X } from 'lucide-react'

interface Usuario {
  id: string
  user_id: string
  nombre: string
  email: string
  rol: 'tutor' | 'hermano'
  tutor_id: string | null
  created_at: string
}

type UsuarioFormData = {
  nombre: string
  email: string
  password: string
  rol: Usuario['rol']
  tutor_id: string
}

type AdminUsuariosProps = {
  currentTutorId?: string | null
  currentUserRole?: string | null
}

export default function AdminUsuarios({ currentTutorId = null, currentUserRole = null }: AdminUsuariosProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [enviando, setEnviando] = useState(false)
  
  const [formData, setFormData] = useState<UsuarioFormData>({
    nombre: '',
    email: '',
    password: '',
    rol: 'hermano' as const,
    tutor_id: ''
  })

  const [tutores, setTutores] = useState<{id: string, nombre: string}[]>([])

  const cargarUsuarios = useCallback(async () => {
    setLoading(true)
    const result = await getScopedUsers({ currentTutorId, currentUserRole })

    if (!result.success) {
      toast.error(result.message || 'Error al cargar usuarios')
    } else {
      setUsuarios(result.users as Usuario[])
    }
    setLoading(false)
  }, [currentTutorId, currentUserRole])

  const cargarTutores = useCallback(async () => {
    const result = await getTutorOptions({ currentTutorId, currentUserRole })

    if (result.success) {
      setTutores(result.tutors as { id: string; nombre: string }[])
    }
  }, [currentTutorId, currentUserRole])

  useEffect(() => {
    cargarUsuarios()
    cargarTutores()
  }, [cargarTutores, cargarUsuarios])

  useEffect(() => {
    if (!editando && currentUserRole === 'tutor' && currentTutorId) {
      setFormData((prev) => {
        if (prev.rol === 'tutor' || prev.tutor_id === currentTutorId) {
          return prev
        }

        return {
          ...prev,
          tutor_id: currentTutorId
        }
      })
    }
  }, [currentTutorId, currentUserRole, editando])

  const guardarUsuario = async () => {
    if (!formData.nombre || !formData.email) {
      toast.error('Nombre y email son requeridos')
      return
    }

    if (formData.rol !== 'tutor' && !formData.tutor_id) {
      toast.error('Debes asignar un tutor al usuario monitoreado')
      return
    }

    if (!editando && !formData.password) {
      toast.error('Contraseña es requerida para nuevo usuario')
      return
    }

    setEnviando(true)

    try {
      let result
      
      if (!editando) {
        result = await crearUsuario({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          rol: formData.rol,
          tutor_id: formData.rol !== 'tutor' ? formData.tutor_id : null
        })
      } else {
        result = await actualizarUsuario({
          id: editando.id,
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol,
          tutor_id: formData.rol !== 'tutor' ? formData.tutor_id : null
        })
      }

      if (result.success) {
        toast.success(result.message)
        setMostrarModal(false)
        setEditando(null)
        setFormData({ nombre: '', email: '', password: '', rol: 'hermano', tutor_id: '' })
        cargarUsuarios()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar usuario')
    } finally {
      setEnviando(false)
    }
  }

  const handleEliminar = async (usuario: Usuario) => {
    if (!confirm(`¿Eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`)) return

    setEnviando(true)
    const result = await eliminarUsuario(usuario.id)
    
    if (result.success) {
      toast.success(result.message)
      cargarUsuarios()
    } else {
      toast.error(result.message)
    }
    setEnviando(false)
  }

  const abrirEditar = (usuario: Usuario) => {
    setEditando(usuario)
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
      tutor_id: usuario.tutor_id || ''
    })
    setMostrarModal(true)
  }

  const getRolBadge = (rol: string) => {
    const colores = {
      tutor: 'bg-purple-100 text-purple-800',
      hermano: 'bg-blue-100 text-blue-800',
    }
    return colores[rol as keyof typeof colores] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-600">Crea responsables y personas monitoreadas</p>
        </div>
        <button
          onClick={() => {
            setEditando(null)
            setFormData({
              nombre: '',
              email: '',
              password: '',
              rol: 'hermano',
              tutor_id: currentUserRole === 'tutor' && currentTutorId ? currentTutorId : ''
            })
            setMostrarModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutor Asignado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{usuario.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{usuario.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRolBadge(usuario.rol)}`}>
                        {getRoleLabel(usuario.rol)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {usuario.tutor_id 
                        ? tutores.find(t => t.id === usuario.tutor_id)?.nombre || usuario.tutor_id
                        : usuario.rol === 'tutor' ? '—' : 'Sin asignar'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirEditar(usuario)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          disabled={enviando}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(usuario)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          disabled={enviando}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="Ej: José Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              {!editando && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="********"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={formData.rol}
                  onChange={(e) => {
                    const nextRol = e.target.value as Usuario['rol']
                    setFormData({
                      ...formData,
                      rol: nextRol,
                      tutor_id:
                        nextRol === 'tutor'
                          ? ''
                          : formData.tutor_id || (currentUserRole === 'tutor' && currentTutorId ? currentTutorId : '')
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="tutor">Tutor / Apoderado</option>
                  <option value="hermano">Hermano/Hermana</option>
                </select>
              </div>

              {formData.rol !== 'tutor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a Tutor / Apoderado</label>
                  <select
                    value={formData.tutor_id}
                    onChange={(e) => setFormData({...formData, tutor_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    disabled={currentUserRole === 'tutor' && !!currentTutorId}
                  >
                    <option value="">Seleccionar tutor</option>
                    {tutores.map(tutor => (
                      <option key={tutor.id} value={tutor.id}>{tutor.nombre}</option>
                    ))}
                  </select>
                  {currentUserRole === 'tutor' && currentTutorId && (
                    <p className="mt-1 text-xs text-gray-500">
                      Este usuario quedara asignado automaticamente a tu cuenta.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={guardarUsuario}
                disabled={enviando}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {enviando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}
              </button>
              <button
                onClick={() => setMostrarModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
