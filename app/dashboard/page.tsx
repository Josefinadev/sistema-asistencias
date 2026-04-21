'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { resolveProfileAfterLogin } from '@/app/actions/authProfileActions'
import { getAssignedUsersForTutor } from '@/app/actions/userActions'
import { getRoleLabel } from '@/lib/roles'
import DashboardAsistencia from '@/lib/components/DashboardAsistencia'
import DashboardMensajes from '@/lib/components/DashboardMensajes'
import DashboardAlertas from '@/lib/components/DashboardAlertas'
import { Home, MessageCircle, AlertTriangle, LogOut, User, Shield, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminUsuarios from '@/lib/components/AdminUsuarios'

type UserProfile = {
  id?: string
  rol?: string
  nombre?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'asistencias' | 'mensajes' | 'alertas' | 'usuarios'>('asistencias')
  const [hermanos, setHermanos] = useState<UserProfile[]>([])
  const [hermanoSeleccionado, setHermanoSeleccionado] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('1. Verificando usuario...')
        
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError || !userData.user) {
          router.replace('/login')
          return
        }

        console.log('2. Usuario encontrado:', userData.user.email)

        const result = await resolveProfileAfterLogin({
          userId: userData.user.id,
          email: userData.user.email || '',
        })

        if (!result.success || !result.profile) {
          console.error('Perfil no encontrado, redirigiendo a login')
          router.replace('/login')
          return
        }

        const profile = result.profile

        console.log('3. Perfil encontrado:', profile)
        setUserId(profile.id)
        setUserData(profile)

        if (profile?.rol !== 'tutor') {
          router.replace('/kiosco')
          return
        }

        console.log('4. Buscando personas monitoreadas del tutor...')
        const assignedResult = await getAssignedUsersForTutor(profile.id)

        if (!assignedResult.success) {
          console.error('Error buscando personas monitoreadas:', assignedResult.message)
          toast.error('Error al cargar personas monitoreadas')
        } else {
          console.log('5. Personas monitoreadas encontradas:', assignedResult.users)
          setHermanos(assignedResult.users || [])
          if (assignedResult.users && assignedResult.users.length > 0) {
            setHermanoSeleccionado(assignedResult.users[0].id ?? null)
            console.log('6. Usuario seleccionado:', assignedResult.users[0].id)
          } else {
            console.warn('6. No hay personas monitoreadas asignadas a este tutor')
          }
        }

        setLoading(false)
        
      } catch (error) {
        console.error('Error inesperado:', error)
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Sesión cerrada correctamente')
      router.push('/login')
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
                <p className="text-sm text-gray-500">Bienvenido, {userData?.nombre || 'Tutor'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-linear-to-r from-blue-50 to-purple-50 rounded-xl">
                <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{userData?.nombre || 'Tutor'}</p>
                  <p className="text-xs text-gray-500">{getRoleLabel(userData?.rol)}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs y selector de usuario monitoreado */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        {/* Selector de usuario monitoreado (si hay más de uno) */}
        {hermanos.length > 1 && (
          <div className="mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-xl">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Seleccionar persona monitoreada:
            </label>
            <div className="flex gap-2 flex-wrap">
              {hermanos.map((hermano, index) => (
                <button
                  key={hermano.id ?? index}
                  onClick={() => setHermanoSeleccionado(hermano.id ?? null)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    hermanoSeleccionado === hermano.id
                      ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {hermano.nombre} {hermano.rol ? `· ${getRoleLabel(hermano.rol)}` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white/50 backdrop-blur-sm rounded-xl p-1">
          <button
            onClick={() => setActiveTab('asistencias')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'asistencias'
                ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Home className="w-5 h-5" />
            Asistencias
          </button>
          <button
            onClick={() => setActiveTab('mensajes')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'mensajes'
                ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            Mensajes
          </button>
          <button
            onClick={() => setActiveTab('alertas')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'alertas'
                ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            Alertas
          </button>
        
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'usuarios'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" />
            Usuarios
          </button>

        </div> 

        {/* Contenido */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50">
          {activeTab === 'usuarios' ? (
            <AdminUsuarios currentTutorId={userId} currentUserRole={userData?.rol ?? null} />
          ) : hermanos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay personas monitoreadas asignadas a tu cuenta</p>
              <p className="text-sm text-gray-400 mt-2">Crea o asigna un hermano desde la pestaña de usuarios</p>
            </div>
          ) : !hermanoSeleccionado ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Selecciona una persona para ver su información</p>
            </div>
          ) : (
            <>
              {activeTab === 'asistencias' && (
                <DashboardAsistencia hermanoId={hermanoSeleccionado} />
              )}
              {activeTab === 'mensajes' && userId && (
                <DashboardMensajes tutorId={userId} hermanoId={hermanoSeleccionado} />
              )}
              {activeTab === 'alertas' && (
                <DashboardAlertas hermanoId={hermanoSeleccionado} />
              )}
            </>
          )} 
        </div>
      </div>
    </div>
  )
}
