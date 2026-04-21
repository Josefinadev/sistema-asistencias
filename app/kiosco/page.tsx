'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { resolveProfileAfterLogin } from '@/app/actions/authProfileActions'
import { getRoleLabel, isMonitoredRole } from '@/lib/roles'
import KioscoAsistencia from '@/lib/components/KioscoAsistencia'
import KioscoMensajes from '@/lib/components/KioscoMensajes'
import KioscoAlertas from '@/lib/components/KioscoAlertas'
import { LogOut, User, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function KioscoPage() {
  const router = useRouter()
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [tutorId, setTutorId] = useState<string | null>(null)
  const [userNombre, setUserNombre] = useState<string>('')
  const [userRol, setUserRol] = useState<string>('')
  const [mostrarChat, setMostrarChat] = useState(false)
  const [mostrarAlertas, setMostrarAlertas] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.replace('/login')
          return
        }

        const result = await resolveProfileAfterLogin({
          userId: user.id,
          email: user.email || '',
        })

        if (!result.success || !result.profile) {
          console.error('Error obteniendo perfil:', result.message)
          router.replace('/login')
          return
        }

        const perfil = result.profile

        if (!isMonitoredRole(perfil.rol)) {
          toast.error('Esta página es solo para usuarios monitoreados')
          router.push('/dashboard')
          return
        }

        setUsuarioId(perfil.id)
        setUserNombre(perfil.nombre || 'Hermano')
        setUserRol(perfil.rol || '')
        
        // Usar el tutor asignado directamente desde el perfil.
        if (perfil.tutor_id) {
          setTutorId(perfil.tutor_id)
        } else {
          // Buscar un tutor por defecto si no tiene asignado
          const { data: tutorDefault } = await supabase
            .from('usuarios')
            .select('id')
            .eq('rol', 'tutor')
            .limit(1)
            .single()
          
          if (tutorDefault) {
            setTutorId(tutorDefault.id)
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        setLoading(false)
      }
    }
    
    obtenerUsuarios()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!usuarioId || !tutorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error de configuración</h2>
          <p className="text-gray-600">No se encontró tu información de usuario o tutor asignado.</p>
          <p className="text-gray-500 text-sm mt-2">Contacta al administrador.</p>
          <button
            onClick={handleLogout}
            className="mt-6 px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kiosco Familiar</h1>
                <p className="text-sm text-gray-500">Bienvenido, {userNombre}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{userNombre}</p>
                  <p className="text-xs text-gray-500">{getRoleLabel(userRol)}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {!mostrarChat && !mostrarAlertas ? (
          <KioscoAsistencia 
            usuarioId={usuarioId} 
            onOpenChat={() => setMostrarChat(true)}
            onOpenAlertas={() => setMostrarAlertas(true)}
            onLogout={handleLogout}
          />
        ) : mostrarChat ? (
          <div className="relative">
            <button
              onClick={() => setMostrarChat(false)}
              className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              ← Volver
            </button>
            <KioscoMensajes 
              usuarioId={usuarioId}
              tutorId={tutorId}
            />
          </div>
        ) : mostrarAlertas ? (
          <div className="relative">
            <button
              onClick={() => setMostrarAlertas(false)}
              className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              ← Volver
            </button>
            <KioscoAlertas 
              usuarioId={usuarioId}
              onClose={() => setMostrarAlertas(false)}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
