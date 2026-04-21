'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getConversationMessages,
  sendConversationMessage,
} from '@/app/actions/messageActions'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { Send, MessageCircle, CheckCheck, Clock, Reply } from 'lucide-react'

interface Mensaje {
  id: number
  de_usuario_id: string
  para_usuario_id: string
  mensaje: string
  leido: boolean
  created_at: string
}

interface DashboardMensajesProps {
  tutorId: string
  hermanoId: string
}

export default function DashboardMensajes({ tutorId, hermanoId }: DashboardMensajesProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [respondiendoA, setRespondiendoA] = useState<Mensaje | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const cargarMensajes = useCallback(async () => {
    const result = await getConversationMessages({
      userAId: hermanoId,
      userBId: tutorId,
      viewerId: tutorId,
      limit: 100,
    })

    if (result.success) {
      setMensajes(result.messages as Mensaje[])
    }
  }, [hermanoId, tutorId])

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || enviando) return

    setEnviando(true)
    const result = await sendConversationMessage({
      fromUserId: tutorId,
      toUserId: hermanoId,
      mensaje: nuevoMensaje,
    })

    if (result.success) {
      setNuevoMensaje('')
      setRespondiendoA(null)
      toast.success('Mensaje enviado')
      await cargarMensajes()
    } else {
      toast.error(result.message || 'Error al enviar mensaje')
    }
    setEnviando(false)
  }

  useEffect(() => {
    queueMicrotask(() => {
      void cargarMensajes()
    })

    const interval = setInterval(() => {
      void cargarMensajes()
    }, 3000)

    const channel = supabase
      .channel('dashboard-mensajes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes' }, () => {
        void cargarMensajes()
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      channel.unsubscribe()
    }
  }, [cargarMensajes])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  return (
    <div className="bg-white rounded-xl shadow-sm flex flex-col h-150">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Conversacion con tu hermano
        </h3>
        <p className="text-sm text-gray-500">Los mensajes se actualizan en tiempo real</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensajes.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay mensajes aun</p>
            <p className="text-sm">Envia un saludo para comenzar</p>
          </div>
        ) : (
          mensajes.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.de_usuario_id === tutorId ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${msg.de_usuario_id === tutorId ? 'order-2' : 'order-1'}`}>
                <div
                  className={`p-3 rounded-2xl ${
                    msg.de_usuario_id === tutorId
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm break-words">{msg.mensaje}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs opacity-70">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {msg.de_usuario_id === tutorId && (
                      msg.leido ? (
                        <CheckCheck className="w-3 h-3 opacity-70" />
                      ) : (
                        <Clock className="w-3 h-3 opacity-70" />
                      )
                    )}
                    {msg.de_usuario_id === hermanoId && (
                      <button
                        onClick={() => {
                          setRespondiendoA(msg)
                          setNuevoMensaje(`> ${msg.mensaje.substring(0, 50)}${msg.mensaje.length > 50 ? '...' : ''}\n\n`)
                        }}
                        className="text-xs opacity-70 hover:opacity-100 flex items-center gap-1"
                      >
                        <Reply className="w-3 h-3" />
                        Responder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        {respondiendoA && (
          <div className="mb-2 p-2 bg-blue-50 rounded-lg text-sm flex justify-between items-center">
            <span>Respondiendo a: {respondiendoA.mensaje.substring(0, 50)}</span>
            <button onClick={() => setRespondiendoA(null)} className="text-red-500 text-xs">
              Cancelar
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void enviarMensaje()
              }
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1 p-2 border rounded-xl resize-none text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <button
            onClick={() => void enviarMensaje()}
            disabled={!nuevoMensaje.trim() || enviando}
            className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
