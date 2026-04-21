'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { resolveProfileAfterLogin } from '@/app/actions/authProfileActions'
import { isMonitoredRole } from '@/lib/roles'
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const normalizeEmail = (value: string) => value.trim().toLowerCase()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const sanitizedUsername = username.trim()
      const sanitizedPassword = password.trim()
      const emailToUse = sanitizedUsername.includes('@')
        ? normalizeEmail(sanitizedUsername)
        : `${sanitizedUsername.toLowerCase()}@app.local`

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: sanitizedPassword,
      })

      if (error) {
        setError('Usuario o contraseña incorrectos')
        setLoading(false)
        return
      }

      if (data.user) {
        const result = await resolveProfileAfterLogin({
          userId: data.user.id,
          email: data.user.email || emailToUse,
        })

        if (!result.success || !result.profile) {
          setError(result.message || 'Tu usuario existe, pero no tiene rol o perfil configurado en la base de datos.')
          await supabase.auth.signOut()
          return
        }

        const profile = result.profile

        toast.success(`¡Bienvenido ${profile.nombre || profile.rol}!`)

        const redirectTo = searchParams.get('redirectTo')
        const defaultDestination = isMonitoredRole(profile.rol) ? '/kiosco' : '/dashboard'
        const safeRedirectTo =
          redirectTo &&
            redirectTo.startsWith('/') &&
            ((isMonitoredRole(profile.rol) && redirectTo.startsWith('/kiosco')) ||
              (!isMonitoredRole(profile.rol) && redirectTo.startsWith('/dashboard')))
            ? redirectTo
            : defaultDestination

        router.push(safeRedirectTo)
      }
    } catch {
      setError('Error al iniciar sesión. Contacta al administrador.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Asistencia</h1>
          <p className="text-gray-600">Control familiar seguro y confiable</p>
        </div>

        {/* Formulario */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usuario
              </label>
              <input
                type="text"
                placeholder="Ej: ejemplo@gmail.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Ingresar
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Sistema seguro con autenticación de dos factores
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
              <Shield className="w-10 h-10 text-white animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cargando...</h1>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
