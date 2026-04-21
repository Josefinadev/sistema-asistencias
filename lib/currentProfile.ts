import { supabase } from '@/lib/supabaseClient'

export type CurrentProfile = {
  id: string
  nombre: string
  rol: string
  tutor_id?: string | null
  email?: string
}

const normalizeEmail = (email?: string | null) => email?.trim().toLowerCase() || ''

export async function getCurrentProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { user: null, profile: null, error: userError || new Error('No hay sesión activa') }
  }

  const authEmail = normalizeEmail(user.email)

  const { data: byUserId, error: byUserIdError } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, tutor_id, email')
    .eq('user_id', user.id)
    .maybeSingle()

  if (byUserId) {
    return { user, profile: byUserId as CurrentProfile, error: null }
  }

  if (!authEmail) {
    return {
      user,
      profile: null,
      error: byUserIdError || new Error('No se pudo determinar el correo del usuario'),
    }
  }

  const { data: byEmail, error: byEmailError } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, tutor_id, email')
    .ilike('email', authEmail)
    .maybeSingle()

  if (byEmail) {
    return { user, profile: byEmail as CurrentProfile, error: null }
  }

  return {
    user,
    profile: null,
    error: byEmailError || byUserIdError || new Error('No se encontró perfil de usuario'),
  }
}
