'use client';
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { AlertTriangle, Heart, Zap, Thermometer, Droplets, Shield, Send } from 'lucide-react'

interface KioscoAlertasProps {
  usuarioId: string | null
  tutorId: string | null
  onClose: () => void
}

const tiposAlerta = [
  {
    id: 'salud',
    label: 'Salud',
    helper: 'Me siento mal o necesito ayuda médica',
    icon: Heart,
    iconClass: 'bg-red-100 text-red-600',
    activeClass: 'border-red-500 bg-red-50 text-red-700',
  },
  {
    id: 'electricidad',
    label: 'Electricidad',
    helper: 'Problemas con la luz o enchufes',
    icon: Zap,
    iconClass: 'bg-yellow-100 text-yellow-600',
    activeClass: 'border-yellow-500 bg-yellow-50 text-yellow-700',
  },
  {
    id: 'temperatura',
    label: 'Temperatura',
    helper: 'Hace mucho frío o calor',
    icon: Thermometer,
    iconClass: 'bg-blue-100 text-blue-600',
    activeClass: 'border-blue-500 bg-blue-50 text-blue-700',
  },
  {
    id: 'agua',
    label: 'Agua',
    helper: 'Problemas con el agua o tuberías',
    icon: Droplets,
    iconClass: 'bg-cyan-100 text-cyan-600',
    activeClass: 'border-cyan-500 bg-cyan-50 text-cyan-700',
  },
  {
    id: 'seguridad',
    label: 'Seguridad',
    helper: 'Me siento inseguro o hay peligro',
    icon: Shield,
    iconClass: 'bg-purple-100 text-purple-600',
    activeClass: 'border-purple-500 bg-purple-50 text-purple-700',
  },
  {
    id: 'otro',
    label: 'Otro',
    helper: 'Otro tipo de emergencia',
    icon: AlertTriangle,
    iconClass: 'bg-gray-100 text-gray-600',
    activeClass: 'border-gray-500 bg-gray-50 text-gray-700',
  },
]

export default function KioscoAlertas({ usuarioId, tutorId, onClose }: KioscoAlertasProps) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(null)
  const [descripcion, setDescripcion] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviarAlerta = async () => {
    if (!tipoSeleccionado || !usuarioId || !tutorId) {
      toast.error('Falta información para enviar la alerta')
      return
    }

    setEnviando(true)
    const { error } = await supabase
      .from('alertas')
      .insert({
        tipo: tipoSeleccionado,
        descripcion: descripcion.trim() || `Alerta de ${tipoSeleccionado}`,
        usuario_id: usuarioId,
        para_usuario_id: tutorId,
        estado: 'activa'
      })

    if (!error) {
      toast.success('Alerta enviada a tu tutor')
      setTipoSeleccionado(null)
      setDescripcion('')
      setTimeout(() => onClose(), 1500)
    } else {
      console.error('Error al enviar alerta:', error)
      toast.error('Error al enviar alerta')
    }
    setEnviando(false)
  }

  if (!usuarioId) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enviar Alerta</h2>
        <p className="text-gray-600">Tu tutor la recibirá al instante</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-center text-sm leading-6 text-gray-600 mb-6">
          ¿Qué está pasando? Selecciona el tipo de emergencia y agrega un detalle si quieres.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6">
          {tiposAlerta.map((tipo) => (
            <button
              key={tipo.id}
              onClick={() => setTipoSeleccionado(tipo.id)}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${
                tipoSeleccionado === tipo.id
                  ? `${tipo.activeClass} shadow-lg`
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${tipo.iconClass}`}>
                <tipo.icon className="h-6 w-6" />
              </div>
              <p className="text-base font-bold">{tipo.label}</p>
              <p className="mt-1 text-sm opacity-80">{tipo.helper}</p>
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Descripción opcional
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: El tanque de gas hace ruido o no hay luz en toda la casa."
            className="w-full resize-none rounded-2xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
            rows={4}
          />
        </div>

        <button
          onClick={enviarAlerta}
          disabled={enviando || !tipoSeleccionado}
          className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-orange-600 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {enviando ? 'Enviando...' : (
            <>
              <Send className="w-5 h-5 inline mr-2" />
              Enviar Alerta
            </>
          )}
        </button>
      </div>
    </div>
  )
}