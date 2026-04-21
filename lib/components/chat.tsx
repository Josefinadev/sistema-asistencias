'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import KioscoAsistencia from '@/lib/components/KioscoAsistencia'
import KioscoMensajes from '@/lib/components/KioscoMensajes'
import KioscoAlertas from '@/lib/components/KioscoAlertas'

export default function KioscoPage() {
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [tutorId, setTutorId] = useState<string | null>(null)
  const [mostrarChat, setMostrarChat] = useState(false)
  const [mostrarAlertas, setMostrarAlertas] = useState(false)

  useEffect(() => {
    const obtenerUsuarios = async () => {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, rol')
      
      const hermano = usuarios?.find(u => u.rol === 'hermano')
      const tutor = usuarios?.find(u => u.rol === 'tutor')
      
      if (hermano) setUsuarioId(hermano.id)
      if (tutor) setTutorId(tutor.id)
    }
    
    obtenerUsuarios()
  }, [])

  if (!usuarioId || !tutorId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <KioscoAsistencia 
        usuarioId={usuarioId} 
        onOpenChat={() => setMostrarChat(true)}
        onOpenAlertas={() => setMostrarAlertas(true)}
        onLogout={() => {}}
      />
      
      {mostrarChat && (
        <KioscoMensajes 
          usuarioId={usuarioId}
          tutorId={tutorId}
        />
      )}
      
      {mostrarAlertas && (
        <KioscoAlertas 
          usuarioId={usuarioId}
          onClose={() => setMostrarAlertas(false)}
        />
      )}
    </>
  )
}
