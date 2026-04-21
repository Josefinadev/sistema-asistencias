export interface Usuario {
  id: string
  nombre: string
  rol: 'tutor' | 'hermano'
}

export interface Asistencia {
  id: number
  usuario_id: string
  tipo: 'llegada' | 'salida'
  fecha: string
  hora: string
  timestamp_registro: string
}

export interface Mensaje {
  id: number
  de_usuario_id: string
  para_usuario_id: string
  mensaje: string
  leido: boolean
  created_at: string
}

export interface Alerta {
  id: number
  usuario_id: string
  tipo: 'gas' | 'luz' | 'agua' | 'ayuda' | 'otro'
  descripcion: string
  estado: 'activa' | 'atendida'
  created_at: string
}
