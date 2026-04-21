'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { formatSimpleTime } from '@/lib/formatTime'
import { supabase } from '@/lib/supabaseClient'
import {
  deleteConversationMessage,
  getConversationMessages,
  sendConversationMessage,
  updateConversationMessage,
} from '@/app/actions/messageActions'
import toast from 'react-hot-toast'
import { Send, MessageCircle, CheckCheck, Pencil, Trash2 } from 'lucide-react'

interface Mensaje {
  id: number
  de_usuario_id: string
  para_usuario_id: string
  mensaje: string
  leido: boolean
  created_at: string
}

interface KioscoMensajesProps {
  usuarioId: string | null
  tutorId: string | null
}

export default function KioscoMensajes({ usuarioId, tutorId }: KioscoMensajesProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [editandoMensaje, setEditandoMensaje] = useState<Mensaje | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const cargarMensajes = useCallback(async () => {
    if (!usuarioId || !tutorId) return

    const result = await getConversationMessages({
      userAId: usuarioId,
      userBId: tutorId,
      viewerId: usuarioId,
      limit: 50,
    })

    if (result.success) {
      setMensajes(result.messages as Mensaje[])
    }
  }, [usuarioId, tutorId])

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !usuarioId || !tutorId) return

    setEnviando(true)
    const result = await sendConversationMessage({
      fromUserId: usuarioId,
      toUserId: tutorId,
      mensaje: nuevoMensaje,
    })

    if (result.success) {
      setNuevoMensaje('')
      toast.success('Mensaje enviado')
      await cargarMensajes()
    } else {
      toast.error(result.message || 'Error al enviar mensaje')
    }
    setEnviando(false)
  }

  const editarMensaje = async () => {
    if (!editandoMensaje || !nuevoMensaje.trim() || !usuarioId) return

    setEnviando(true)
    const result = await updateConversationMessage({
      messageId: editandoMensaje.id,
      fromUserId: usuarioId,
      mensaje: nuevoMensaje,
    })

    if (result.success) {
      setEditandoMensaje(null)
      setNuevoMensaje('')
      toast.success('Mensaje editado')
      await cargarMensajes()
    } else {
      toast.error(result.message || 'Error al editar mensaje')
    }
    setEnviando(false)
  }

  const iniciarEdicion = (mensaje: Mensaje) => {
    setEditandoMensaje(mensaje)
    setNuevoMensaje(mensaje.mensaje)
  }

  const cancelarEdicion = () => {
    setEditandoMensaje(null)
    setNuevoMensaje('')
  }

  const eliminarMensaje = async (mensaje: Mensaje) => {
    if (!window.confirm('Quieres eliminar este mensaje?') || !usuarioId) return

    const result = await deleteConversationMessage({
      messageId: mensaje.id,
      fromUserId: usuarioId,
    })

    if (result.success) {
      if (editandoMensaje?.id === mensaje.id) {
        cancelarEdicion()
      }
      toast.success('Mensaje eliminado')
      await cargarMensajes()
    } else {
      toast.error(result.message || 'Error al eliminar mensaje')
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void cargarMensajes()
    })

    const interval = setInterval(() => {
      void cargarMensajes()
    }, 3000)

    const channel = supabase
      .channel('mensajes-kiosco')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes' }, () => {
        void cargarMensajes()
      })

    channel.subscribe()

    return () => {
      clearInterval(interval)
      channel.unsubscribe()
    }
  }, [cargarMensajes])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  if (!usuarioId || !tutorId) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mensajes con Tutor</h2>
        <p className="text-gray-600">Comunicate con tu tutor asignado</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {mensajes.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay mensajes aun</p>
              <p className="text-sm text-gray-400">Escribe tu primer mensaje</p>
            </div>
          ) : (
            mensajes.map((mensaje) => (
              <div
                key={mensaje.id}
                className={`flex ${mensaje.de_usuario_id === usuarioId ? 'justify-end' : 'justify-start'}`}
              >
                <div className="group relative max-w-xs">
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      mensaje.de_usuario_id === usuarioId
                        ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{mensaje.mensaje}</p>
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs ${
                        mensaje.de_usuario_id === usuarioId ? 'text-green-100' : 'text-gray-500'
                      }`}
                    >
                      <span>{formatSimpleTime(mensaje.created_at)}</span>
                      {mensaje.de_usuario_id === usuarioId && (
                        mensaje.leido ? (
                          <CheckCheck className="w-3 h-3" />
                        ) : (
                          <CheckCheck className="w-3 h-3 opacity-50" />
                        )
                      )}
                    </div>
                  </div>

                  {mensaje.de_usuario_id === usuarioId && (
                    <div className="absolute -top-2 -left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => iniciarEdicion(mensaje)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full shadow-sm"
                        title="Editar mensaje"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => eliminarMensaje(mensaje)}
                        className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-sm"
                        title="Eliminar mensaje"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4 bg-white">
          {editandoMensaje ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Pencil className="w-4 h-4" />
                Editando mensaje...
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void editarMensaje()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                  placeholder="Edita tu mensaje..."
                />
                <button
                  onClick={() => void editarMensaje()}
                  disabled={enviando || !nuevoMensaje.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviando ? '...' : 'Guardar'}
                </button>
                <button
                  onClick={cancelarEdicion}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void enviarMensaje()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                placeholder="Escribe tu mensaje..."
              />
              <button
                onClick={() => void enviarMensaje()}
                disabled={enviando || !nuevoMensaje.trim()}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviando ? '...' : <Send className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
