'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export async function resolveProfileAfterLogin(data: { userId: string; email: string }) {
  const email = normalizeEmail(data.email)

  const { data: byUserId, error: byUserIdError } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre, rol, tutor_id, email, user_id')
    .eq('user_id', data.userId)
    .maybeSingle()

  if (byUserId) {
    return { success: true, profile: byUserId }
  }

  const { data: byEmail, error: byEmailError } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre, rol, tutor_id, email, user_id')
    .ilike('email', email)
    .maybeSingle()

  if (!byEmail) {
    return {
      success: false,
      message:
        byEmailError?.message || byUserIdError?.message || 'No se encontró perfil de usuario en la base de datos',
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from('usuarios')
    .update({ user_id: data.userId })
    .eq('id', byEmail.id)

  if (updateError) {
    return { success: false, message: updateError.message }
  }

  return {
    success: true,
    profile: {
      ...byEmail,
      user_id: data.userId,
    },
  }
}
