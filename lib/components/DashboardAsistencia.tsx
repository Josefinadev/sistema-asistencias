'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatSimpleTime } from '@/lib/formatTime'
import { supabase } from '@/lib/supabaseClient'
import { Calendar, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

interface Asistencia {
  id: number
  tipo: string
  fecha: string
  hora: string
  timestamp_registro: string
}

interface DashboardAsistenciaProps {
  hermanoId: string
}

export default function DashboardAsistencia({ hermanoId }: DashboardAsistenciaProps) {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    ultimaSemana: 0,
    promedioHora: ''
  })

  const cargarAsistencias = useCallback(async () => {
    const { data } = await supabase
      .from('asistencias')
      .select('*')
      .eq('usuario_id', hermanoId)
      .order('timestamp_registro', { ascending: false })
      .limit(20)
    
    if (data) {
      setAsistencias(data)
      
      // Calcular estadísticas
      const ultimaSemana = data.filter(a => {
        const fecha = new Date(a.timestamp_registro)
        const semanaAtras = new Date()
        semanaAtras.setDate(semanaAtras.getDate() - 7)
        return fecha > semanaAtras
      }).length

      setEstadisticas({
        total: data.length,
        ultimaSemana,
        promedioHora: data[0]?.timestamp_registro
          ? formatSimpleTime(data[0].timestamp_registro)
          : '--:--'
      })
    }
  }, [hermanoId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarAsistencias()

    const channel = supabase
      .channel('dashboard-asistencias')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'asistencias', filter: `usuario_id=eq.${hermanoId}` },
        () => cargarAsistencias()
      )
    
    channel.subscribe()

    return () => void channel.unsubscribe()
  }, [hermanoId, cargarAsistencias])

  return (
    <div className="space-y-6">
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-3xl bg-linear-to-br from-blue-500 via-blue-600 to-indigo-600 p-5 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total asistencias</p>
              <p className="mt-3 text-3xl font-bold sm:text-4xl">{estadisticas.total}</p>
              <p className="text-blue-100 text-xs mt-2">registradas</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-linear-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Esta semana</p>
              <p className="mt-3 text-3xl font-bold sm:text-4xl">{estadisticas.ultimaSemana}</p>
              <p className="text-emerald-100 text-xs mt-2">últimos 7 días</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-linear-to-br from-purple-500 to-fuchsia-600 p-5 text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 text-sm font-medium">Hora más común</p>
              <p className="mt-3 text-3xl font-bold sm:text-4xl">{estadisticas.promedioHora}</p>
              <p className="text-purple-100 text-xs mt-2">de registro</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de asistencias */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-lg shadow-slate-200/60">
        <div className="border-b border-slate-200 bg-linear-to-r from-slate-50 via-blue-50/50 to-purple-50/60 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-lg text-slate-800">Historial de asistencias</h3>
            <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 sm:ml-auto">
              {asistencias.length} registros
            </span>
          </div>
        </div>
        <div className="divide-y divide-slate-200">
          {asistencias.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-block p-3 bg-slate-100 rounded-full mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No hay asistencias registradas</p>
              <p className="text-slate-400 text-sm mt-1">Las asistencias aparecerán aquí</p>
            </div>
          ) : (
            asistencias.map((asistencia, idx) => (
              <div 
                key={asistencia.id} 
                className="group p-4 transition-all duration-200 hover:bg-blue-50/60 sm:p-5"
                style={{ animation: `slideIn 0.3s ease-out ${idx * 0.05}s both` }}
              >
                <style>{`
                  @keyframes slideIn {
                    from {
                      opacity: 0;
                      transform: translateX(-20px);
                    }
                    to {
                      opacity: 1;
                      transform: translateX(0);
                    }
                  }
                `}</style>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      asistencia.tipo === 'llegada' 
                        ? 'bg-green-100' 
                        : 'bg-red-100'
                    }`}>
                      {asistencia.tipo === 'llegada' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {asistencia.tipo === 'llegada' ? '✓ Llegó a casa' : '✗ Salió de casa'}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {formatSimpleTime(asistencia.timestamp_registro)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-left sm:text-right">
                    <p className="text-2xl font-bold text-blue-600 sm:text-3xl">
                      {formatSimpleTime(asistencia.timestamp_registro)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">hora</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
