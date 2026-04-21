'use client'

import { useState } from 'react'
import { createAlert } from '@/app/actions/alertActions'
import toast from 'react-hot-toast'
import { AlertTriangle, Flame, Zap, Droplet, HelpCircle, X, Send } from 'lucide-react'

interface KioscoAlertasProps {
  usuarioId: string | null
  onClose: () => void
}

const tiposAlerta = [
  {
    id: 'gas',
    label: 'Fuga de Gas',
    icon: Flame,
    helper: 'Gas o tanque',
    activeClass: 'border-red-500 bg-red-50 text-red-700 shadow-red-200/70',
    iconClass: 'bg-red-100 text-red-600'
  },
  {
    id: 'luz',
    label: 'Problema de Luz',
    icon: Zap,
    helper: 'Corte o chispa',
    activeClass: 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-yellow-200/70',
    iconClass: 'bg-yellow-100 text-yellow-600'
  },
  {
    id: 'agua',
    label: 'Problema de Agua',
    icon: Droplet,
    helper: 'Fuga o corte',
    activeClass: 'border-blue-500 bg-blue-50 text-blue-700 shadow-blue-200/70',
    iconClass: 'bg-blue-100 text-blue-600'
  },
  {
    id: 'ayuda',
    label: 'Necesito Ayuda',
    icon: HelpCircle,
    helper: 'Asistencia personal',
    activeClass: 'border-purple-500 bg-purple-50 text-purple-700 shadow-purple-200/70',
    iconClass: 'bg-purple-100 text-purple-600'
  },
  {
    id: 'otro',
    label: 'Otra Emergencia',
    icon: AlertTriangle,
    helper: 'Situacion urgente',
    activeClass: 'border-orange-500 bg-orange-50 text-orange-700 shadow-orange-200/70',
    iconClass: 'bg-orange-100 text-orange-600'
  }
]

export default function KioscoAlertas({ usuarioId, onClose }: KioscoAlertasProps) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('')
  const [descripcion, setDescripcion] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviarAlerta = async () => {
    // ✅ VALIDACIÓN CLAVE (soluciona tu error)
    if (!tipoSeleccionado || !usuarioId) {
      toast.error('Falta información para enviar la alerta')
      return
    }

    try {
      setEnviando(true)

      const result = await createAlert({
        usuarioId, // ✅ ahora TypeScript sabe que es string
        tipo: tipoSeleccionado,
        descripcion: descripcion.trim() || `Alerta de ${tipoSeleccionado}`,
      })

      if (result?.success) {
        toast.success('Alerta enviada. Tu tutor será notificado')
        setTipoSeleccionado('')
        setDescripcion('')
        setTimeout(() => onClose(), 1500)
      } else {
        toast.error(result?.message || 'Error al enviar alerta')
      }

    } catch (error) {
      console.error('Error inesperado:', error)
      toast.error('Ocurrió un error inesperado')
    } finally {
      setEnviando(false)
    }
  }

  // ✅ evita render si no hay usuario
  if (!usuarioId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[30px] border border-white/40 bg-white shadow-[0_35px_90px_-35px_rgba(15,23,42,0.75)]">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-red-50 via-white to-orange-50 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Enviar Alerta</h2>
              <p className="text-sm text-slate-500">Tu tutor la recibirá al instante.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 transition hover:bg-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-4 sm:p-5">
          <p className="text-center text-sm leading-6 text-slate-600 sm:text-base">
            ¿Qué está pasando? Selecciona el tipo de emergencia y agrega un detalle si quieres.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {tiposAlerta.map((tipo) => (
              <button
                key={tipo.id}
                onClick={() => setTipoSeleccionado(tipo.id)}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  tipoSeleccionado === tipo.id
                    ? `${tipo.activeClass} shadow-lg`
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
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

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Descripción opcional
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: El tanque de gas hace ruido o no hay luz en toda la casa."
              className="w-full resize-none rounded-2xl border border-slate-300 p-3 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
            />
          </div>

          <button
            onClick={enviarAlerta}
            disabled={!tipoSeleccionado || enviando}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 py-4 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? (
              'Enviando...'
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar Alerta
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-500">
            Tu tutor recibirá una notificación inmediata
          </p>
        </div>
      </div>
    </div>
  )
}