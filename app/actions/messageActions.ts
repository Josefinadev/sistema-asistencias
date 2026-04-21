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

type ConversationParams = {
  userAId: string
  userBId: string
  viewerId?: string
  limit?: number
}

export async function getConversationMessages({
  userAId,
  userBId,
  viewerId,
  limit = 100,
}: ConversationParams) {
  const { data, error } = await supabaseAdmin
    .from('mensajes')
    .select('*')
    .or(`and(de_usuario_id.eq.${userAId},para_usuario_id.eq.${userBId}),and(de_usuario_id.eq.${userBId},para_usuario_id.eq.${userAId})`)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    return { success: false, message: error.message, messages: [] }
  }

  if (viewerId) {
    const unreadIds =
      data
        ?.filter((message) => message.para_usuario_id === viewerId && !message.leido)
        .map((message) => message.id) || []

    if (unreadIds.length > 0) {
      await supabaseAdmin.from('mensajes').update({ leido: true }).in('id', unreadIds)
    }
  }

  return { success: true, messages: data || [] }
}

export async function sendConversationMessage(data: {
  fromUserId: string
  toUserId: string
  mensaje: string
}) {
  const message = data.mensaje.trim()

  if (!data.fromUserId || !data.toUserId || !message) {
    return { success: false, message: 'Faltan datos para enviar el mensaje' }
  }

  const { error } = await supabaseAdmin.from('mensajes').insert({
    de_usuario_id: data.fromUserId,
    para_usuario_id: data.toUserId,
    mensaje: message,
    leido: false,
  })

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
}

export async function updateConversationMessage(data: {
  messageId: number
  fromUserId: string
  mensaje: string
}) {
  const message = data.mensaje.trim()

  if (!data.messageId || !data.fromUserId || !message) {
    return { success: false, message: 'Faltan datos para editar el mensaje' }
  }

  const { error } = await supabaseAdmin
    .from('mensajes')
    .update({ mensaje: message })
    .eq('id', data.messageId)
    .eq('de_usuario_id', data.fromUserId)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
}

export async function deleteConversationMessage(data: {
  messageId: number
  fromUserId: string
}) {
  if (!data.messageId || !data.fromUserId) {
    return { success: false, message: 'Faltan datos para eliminar el mensaje' }
  }

  const { error } = await supabaseAdmin
    .from('mensajes')
    .delete()
    .eq('id', data.messageId)
    .eq('de_usuario_id', data.fromUserId)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
}
