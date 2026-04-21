'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatSimpleTime } from '@/lib/formatTime'
import { attendAlert, getAlertsByUser } from '@/app/actions/alertActions'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { AlertTriangle, Flame, Zap, Droplet, HelpCircle, CheckCircle, Bell, BellOff } from 'lucide-react'

interface Alerta {
  id: number
  tipo: string
  descripcion: string
  estado: 'activa' | 'atendida'
  created_at: string
  atendida_at: string | null
}

interface DashboardAlertasProps {
  hermanoId: string
}

const iconosAlerta = {
  gas: { icon: Flame, color: 'red', label: 'Fuga de Gas', bg: 'bg-red-50' },
  luz: { icon: Zap, color: 'yellow', label: 'Problema de Luz', bg: 'bg-yellow-50' },
  agua: { icon: Droplet, color: 'blue', label: 'Problema de Agua', bg: 'bg-blue-50' },
  ayuda: { icon: HelpCircle, color: 'purple', label: 'Necesita Ayuda', bg: 'bg-purple-50' },
  otro: { icon: AlertTriangle, color: 'orange', label: 'Otra Emergencia', bg: 'bg-orange-50' },
}

export default function DashboardAlertas({ hermanoId }: DashboardAlertasProps) {
  const [alertasActivas, setAlertasActivas] = useState<Alerta[]>([])
  const [alertasHistoricas, setAlertasHistoricas] = useState<Alerta[]>([])
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  const cargarAlertas = useCallback(async () => {
    const result = await getAlertsByUser(hermanoId)

    if (result.success) {
      setAlertasActivas(result.active as Alerta[])
      setAlertasHistoricas(result.history as Alerta[])
    }
  }, [hermanoId])

  const atenderAlerta = async (alertaId: number) => {
    const result = await attendAlert(alertaId)

    if (result.success) {
      toast.success('Alerta marcada como atendida')
      await cargarAlertas()
    } else {
      toast.error(result.message || 'Error al atender alerta')
    }
  }

  useEffect(() => {
    if (!hermanoId) return

    queueMicrotask(() => {
      void cargarAlertas()
    })

    const interval = setInterval(() => {
      void cargarAlertas()
    }, 3000)

    const channel = supabase
      .channel(`dashboard-alertas-${hermanoId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas' }, () => {
        void cargarAlertas()
      })

    channel.subscribe()

    return () => {
      clearInterval(interval)
      channel.unsubscribe()
    }
  }, [hermanoId, cargarAlertas])

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-red-500 via-orange-500 to-orange-600 p-5 text-white shadow-lg shadow-red-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-red-100 text-sm font-medium">Alertas activas</p>
            <p className="mt-2 text-4xl font-bold sm:text-5xl">{alertasActivas.length}</p>
            <p className="text-red-100 text-sm mt-2">sin atender</p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl animate-pulse">
            <Bell className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-lg shadow-slate-200/60">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-red-50/50 to-orange-50/60 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-lg text-slate-800">Alertas activas</h3>
            </div>
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
              {alertasActivas.length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {alertasActivas.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-block p-3 bg-slate-100 rounded-full mb-4">
                <BellOff className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No hay alertas activas</p>
              <p className="text-slate-400 text-sm mt-1">Todo tranquilo por ahora</p>
            </div>
          ) : (
            alertasActivas.map((alerta) => {
              const config = iconosAlerta[alerta.tipo as keyof typeof iconosAlerta] || iconosAlerta.otro
              const Icon = config.icon
              return (
                <div
                  key={alerta.id}
                  className={`${config.bg} group border-l-4 p-4 transition-all duration-200 hover:shadow-md sm:p-5 ${
                    alerta.tipo === 'gas'
                      ? 'border-red-500'
                      : alerta.tipo === 'luz'
                        ? 'border-yellow-500'
                        : alerta.tipo === 'agua'
                          ? 'border-blue-500'
                          : alerta.tipo === 'ayuda'
                            ? 'border-purple-500'
                            : 'border-orange-500'
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="flex-shrink-0">
                      <div className="p-3 rounded-lg bg-white/50">
                        <Icon className={`w-6 h-6 text-${config.color}-600`} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-slate-800">{config.label}</h4>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold animate-pulse">
                          URGENTE
                        </span>
                      </div>
                      <p className="text-slate-700 mb-3">{alerta.descripcion}</p>
                      <p className="text-xs text-slate-500">{formatSimpleTime(alerta.created_at)}</p>
                    </div>
                    <button
                      onClick={() => void atenderAlerta(alerta.id)}
                      className="flex h-fit flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-green-700 lg:self-start"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Atender
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div>
        <button
          onClick={() => setMostrarHistorial(!mostrarHistorial)}
          className="w-full rounded-2xl bg-blue-50 py-3 text-center text-sm font-semibold text-blue-600 transition hover:bg-blue-100 hover:text-blue-700"
        >
          {mostrarHistorial ? 'Ocultar historial' : 'Ver historial de alertas'}
        </button>

        {mostrarHistorial && alertasHistoricas.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-lg shadow-slate-200/60">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50/40 to-purple-50/40 px-4 py-4 sm:px-6">
              <h3 className="text-lg font-bold text-slate-800">Historial de alertas</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {alertasHistoricas.map((alerta) => {
                const config = iconosAlerta[alerta.tipo as keyof typeof iconosAlerta] || iconosAlerta.otro
                const Icon = config.icon
                return (
                  <div key={alerta.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="mb-2 flex items-start gap-3">
                      <Icon className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{config.label}</p>
                        <p className="text-sm text-slate-600 mt-1">{alerta.descripcion}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    </div>
                    <div className="ml-8 flex flex-col gap-1 text-xs text-slate-400 sm:flex-row sm:justify-between">
                      <span>Creada: {formatSimpleTime(alerta.created_at)}</span>
                      <span>Atendida: {alerta.atendida_at ? formatSimpleTime(alerta.atendida_at) : '--:--'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
