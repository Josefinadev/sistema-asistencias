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

export async function getAssignedUsersForTutor(tutorId: string) {
  if (!tutorId) {
    return { success: false, message: 'Tutor no válido', users: [] }
  }

  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre, rol, email, tutor_id')
    .eq('tutor_id', tutorId)
    .eq('rol', 'hermano')
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, message: error.message, users: [] }
  }

  return { success: true, users: data || [] }
}

export async function getScopedUsers(data: {
  currentTutorId?: string | null
  currentUserRole?: string | null
}) {
  let query = supabaseAdmin
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false })

  if (data.currentUserRole === 'tutor' && data.currentTutorId) {
    query = query.or(`id.eq.${data.currentTutorId},tutor_id.eq.${data.currentTutorId}`)
  }

  const { data: users, error } = await query

  if (error) {
    return { success: false, message: error.message, users: [] }
  }

  return { success: true, users: users || [] }
}

export async function getTutorOptions(data: {
  currentTutorId?: string | null
  currentUserRole?: string | null
}) {
  let query = supabaseAdmin.from('usuarios').select('id, nombre').eq('rol', 'tutor')

  if (data.currentUserRole === 'tutor' && data.currentTutorId) {
    query = query.eq('id', data.currentTutorId)
  }

  const { data: tutors, error } = await query

  if (error) {
    return { success: false, message: error.message, tutors: [] }
  }

  return { success: true, tutors: tutors || [] }
}
