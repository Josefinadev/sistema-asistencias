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

export async function createAlert(data: {
  usuarioId: string
  tipo: string
  descripcion?: string
}) {
  if (!data.usuarioId || !data.tipo) {
    return { success: false, message: 'Faltan datos para enviar la alerta' }
  }

  const { error } = await supabaseAdmin.from('alertas').insert({
    usuario_id: data.usuarioId,
    tipo: data.tipo,
    descripcion: data.descripcion?.trim() || `Alerta de ${data.tipo}`,
    estado: 'activa',
  })

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
}

export async function getAlertsByUser(usuarioId: string) {
  if (!usuarioId) {
    return { success: false, message: 'Usuario no valido', active: [], history: [] }
  }

  const { data: active, error: activeError } = await supabaseAdmin
    .from('alertas')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('estado', 'activa')
    .order('created_at', { ascending: false })

  if (activeError) {
    return { success: false, message: activeError.message, active: [], history: [] }
  }

  const { data: history, error: historyError } = await supabaseAdmin
    .from('alertas')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('estado', 'atendida')
    .order('created_at', { ascending: false })
    .limit(10)

  if (historyError) {
    return { success: false, message: historyError.message, active: [], history: [] }
  }

  return { success: true, active: active || [], history: history || [] }
}

export async function attendAlert(alertaId: number) {
  if (!alertaId) {
    return { success: false, message: 'Alerta no valida' }
  }

  const { error } = await supabaseAdmin
    .from('alertas')
    .update({ estado: 'atendida', atendida_at: new Date().toISOString() })
    .eq('id', alertaId)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
}
