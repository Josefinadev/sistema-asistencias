'use client'

import { useState, useEffect, useCallback } from 'react'
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
  gas: { icon: Flame, color: 'red', label: 'Fuga de Gas', bg: 'bg-red-50', border: 'border-red-200' },
  luz: { icon: Zap, color: 'yellow', label: 'Problema de Luz', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  agua: { icon: Droplet, color: 'blue', label: 'Problema de Agua', bg: 'bg-blue-50', border: 'border-blue-200' },
  ayuda: { icon: HelpCircle, color: 'purple', label: 'Necesita Ayuda', bg: 'bg-purple-50', border: 'border-purple-200' },
  otro: { icon: AlertTriangle, color: 'orange', label: 'Otra Emergencia', bg: 'bg-orange-50', border: 'border-orange-200' }
}

const colorMap = {
  red: 'text-red-600',
  yellow: 'text-yellow-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600'
}

export default function DashboardAlertas({ hermanoId }: DashboardAlertasProps) {
  const [alertasActivas, setAlertasActivas] = useState<Alerta[]>([])
  const [alertasHistoricas, setAlertasHistoricas] = useState<Alerta[]>([])
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  const cargarAlertas = useCallback(async () => {
    if (!hermanoId) return

    // Alertas activas
    const { data: activas, error: errorActivas } = await supabase
      .from('alertas')
      .select('*')
      .eq('usuario_id', hermanoId)
      .eq('estado', 'activa')
      .order('created_at', { ascending: false })
    
    if (errorActivas) {
      console.error('Error cargando alertas activas:', errorActivas)
    } else if (activas) {
      setAlertasActivas(activas)
    }

    // Alertas atendidas (últimas 10)
    const { data: historicas, error: errorHistoricas } = await supabase
      .from('alertas')
      .select('*')
      .eq('usuario_id', hermanoId)
      .eq('estado', 'atendida')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (errorHistoricas) {
      console.error('Error cargando alertas históricas:', errorHistoricas)
    } else if (historicas) {
      setAlertasHistoricas(historicas)
    }
  }, [hermanoId])

  const atenderAlerta = async (alertaId: number) => {
    const { error } = await supabase
      .from('alertas')
      .update({ estado: 'atendida', atendida_at: new Date().toISOString() })
      .eq('id', alertaId)

    if (!error) {
      toast.success('Alerta marcada como atendida')
      await cargarAlertas()
    } else {
      toast.error('Error al atender alerta')
    }
  }

  useEffect(() => {

    const subscription = supabase
      .channel('dashboard-alertas')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'alertas', filter: `usuario_id=eq.${hermanoId}` },
        () => cargarAlertas()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [hermanoId, cargarAlertas])

  const getIconConfig = (tipo: string) => {
    return iconosAlerta[tipo as keyof typeof iconosAlerta] || iconosAlerta.otro
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-90">Alertas activas</p>
            <p className="text-3xl font-bold">{alertasActivas.length}</p>
          </div>
          <Bell className="w-8 h-8 animate-pulse" />
        </div>
      </div>

      {/* Alertas activas */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Alertas activas
          </h3>
          <span className="text-xs text-gray-500">
            {alertasActivas.length} sin atender
          </span>
        </div>

        <div className="divide-y">
          {alertasActivas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BellOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay alertas activas</p>
              <p className="text-sm">Todo tranquilo por ahora</p>
            </div>
          ) : (
            alertasActivas.map(alerta => {
              const config = getIconConfig(alerta.tipo)
              const Icon = config.icon
              return (
                <div key={alerta.id} className={`p-4 ${config.bg}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-5 h-5 ${colorMap[config.color as keyof typeof colorMap]}`} />
                        <h4 className="font-bold text-gray-800">{config.label}</h4>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">
                          URGENTE
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{alerta.descripcion}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(alerta.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => atenderAlerta(alerta.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1"
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

      {/* Historial (opcional) */}
      <div>
        <button
          onClick={() => setMostrarHistorial(!mostrarHistorial)}
          className="w-full text-center text-sm text-gray-500 py-2 hover:text-gray-700 transition"
        >
          {mostrarHistorial ? '▼ Ocultar historial' : '▶ Ver historial de alertas'}
        </button>

        {mostrarHistorial && alertasHistoricas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm mt-2">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg">📜 Historial de alertas</h3>
            </div>
            <div className="divide-y">
              {alertasHistoricas.map(alerta => {
                const config = getIconConfig(alerta.tipo)
                const Icon = config.icon
                return (
                  <div key={alerta.id} className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <p className="font-medium text-gray-700">{config.label}</p>
                      <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                    </div>
                    <p className="text-sm text-gray-600">{alerta.descripcion}</p>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Creada: {new Date(alerta.created_at).toLocaleString()}</span>
                      <span>Atendida: {alerta.atendida_at ? new Date(alerta.atendida_at).toLocaleString() : '—'}</span>
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