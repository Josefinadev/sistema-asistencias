'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAttendanceCycleStart, getNextAttendanceReset, isAttendanceInCurrentCycle } from '@/lib/asistencia'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { CheckCircle, Clock, AlertTriangle, MessageCircle } from 'lucide-react'

interface KioscoAsistenciaProps {
  usuarioId: string | null
  onOpenChat: () => void
  onOpenAlertas: () => void
  onLogout: () => void
}

interface AsistenciaRegistro {
  id: number
  fecha: string
  hora: string
  timestamp_registro: string
  tipo: string
}

export default function KioscoAsistencia({
  usuarioId,
  onOpenChat,
  onOpenAlertas,
}: KioscoAsistenciaProps) {
  const [ultimaAsistencia, setUltimaAsistencia] = useState<AsistenciaRegistro | null>(null)
  const [puedeMarcar, setPuedeMarcar] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [horaActual, setHoraActual] = useState('')
  const [siguienteReinicio, setSiguienteReinicio] = useState('')

  useEffect(() => {
    const updateClock = () => {
      const ahora = new Date()
      setHoraActual(
        ahora.toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
      setSiguienteReinicio(
        getNextAttendanceReset(ahora).toLocaleString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        })
      )
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  const verificarEstado = useCallback(async () => {
    if (!usuarioId) return

    try {
      const { data: asistencias, error } = await supabase
        .from('asistencias')
        .select('id, fecha, hora, timestamp_registro, tipo')
        .eq('usuario_id', usuarioId)
        .eq('tipo', 'llegada')
        .order('timestamp_registro', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error al verificar estado:', error)
        return
      }

      const ultima = asistencias?.[0] ?? null
      setUltimaAsistencia(ultima)
      setPuedeMarcar(!isAttendanceInCurrentCycle(ultima?.timestamp_registro))
    } catch (error) {
      console.error('Error en verificarEstado:', error)
    }
  }, [usuarioId])

  const marcarAsistencia = async () => {
    if (!usuarioId) return

    setCargando(true)

    try {
      const inicioCiclo = getAttendanceCycleStart()
      const { data: asistenciaActual, error: errorVerif } = await supabase
        .from('asistencias')
        .select('id, timestamp_registro')
        .eq('usuario_id', usuarioId)
        .eq('tipo', 'llegada')
        .gte('timestamp_registro', inicioCiclo.toISOString())
        .limit(1)

      if (errorVerif) {
        toast.error('Error al verificar asistencia')
        setCargando(false)
        return
      }

      if (asistenciaActual && asistenciaActual.length > 0) {
        toast.error('Ya marcaste asistencia en este turno. Se reinicia a las 11:00 a. m.')
        setPuedeMarcar(false)
        setCargando(false)
        return
      }

      const ahora = new Date()
      const { error: errorInsert } = await supabase.from('asistencias').insert({
        usuario_id: usuarioId,
        tipo: 'llegada',
        fecha: ahora.toISOString().slice(0, 10),
        hora: ahora.toTimeString().slice(0, 8),
        timestamp_registro: ahora.toISOString(),
      })

      if (errorInsert) {
        console.error('Error insert:', errorInsert)
        toast.error('Error al marcar asistencia')
      } else {
        toast.success(`Asistencia marcada a las ${ahora.toLocaleTimeString('es-PE')}`)
        await verificarEstado()
      }
    } catch (error) {
      console.error('Error en marcarAsistencia:', error)
      toast.error('Error al marcar asistencia')
    }

    setCargando(false)
  }

  useEffect(() => {
    if (!usuarioId) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    verificarEstado()
    const interval = setInterval(verificarEstado, 60000)

    return () => clearInterval(interval)
  }, [usuarioId, verificarEstado])

  if (!usuarioId) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error: No se encontró tu información de usuario</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Marcar Asistencia</h2>
        <p className="text-gray-600">Registra tu llegada desde el colegio, salida o kiosco</p>
        <div className="mt-2 text-3xl font-mono font-bold text-blue-600">{horaActual}</div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center mb-6">
          {puedeMarcar ? (
            <div className="text-green-600">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8" />
              </div>
              <p className="text-lg font-bold text-gray-900">Puedes marcar tu llegada</p>
              <p className="mt-2 text-sm text-gray-500">Presiona el botón cuando llegues y quieras avisar al tutor.</p>
            </div>
          ) : (
            <div className="text-amber-600">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-8 w-8" />
              </div>
              <p className="text-lg font-semibold text-gray-700">Ya marcaste asistencia en este turno</p>
              <p className="mt-2 text-sm text-gray-500">
                {ultimaAsistencia && `Última marca: ${new Date(ultimaAsistencia.timestamp_registro).toLocaleString('es-PE')}`}
              </p>
              <p className="mt-1 text-sm text-gray-500">Se habilita nuevamente a las 11:00 a. m.</p>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Próximo reinicio automático: {siguienteReinicio || getNextAttendanceReset().toLocaleString('es-PE')}
        </div>

        <button
          onClick={marcarAsistencia}
          disabled={!puedeMarcar || cargando}
          className={`w-full rounded-xl px-6 py-4 text-lg font-bold transition-all ${
            puedeMarcar && !cargando
              ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg hover:shadow-xl active:scale-[0.98]'
              : 'cursor-not-allowed bg-gray-200 text-gray-500'
          }`}
        >
          {cargando ? 'Procesando...' : 'Ya llegué'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          onClick={onOpenChat}
          className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">Chat</p>
            <p className="text-sm text-gray-600">Habla con tu tutor en tiempo real</p>
          </div>
        </button>

        <button
          onClick={onOpenAlertas}
          className="flex items-center gap-4 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">Alertas</p>
            <p className="text-sm text-gray-600">Envía una emergencia al tutor o asesor</p>
          </div>
        </button>
      </div>
    </div>
  )
}
