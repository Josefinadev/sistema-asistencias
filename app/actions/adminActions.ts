// app/actions/adminActions.ts
'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

type UsuarioPayload = {
  user_id?: string
  nombre: string
  email: string
  rol: string
  tutor_id?: string | null
}

const VALID_ROLES = new Set(['tutor', 'hermano'])

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Ocurrio un error inesperado'

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export async function crearUsuario(data: {
  nombre: string
  email: string
  password: string
  rol: string
  tutor_id: string | null
}) {
  try {
    const normalizedEmail = normalizeEmail(data.email)

    console.log('Creando usuario:', {
      nombre: data.nombre,
      email: normalizedEmail,
      rol: data.rol,
    })

    if (!data.password || data.password.length < 6) {
      return { success: false, message: 'La contrasena debe tener al menos 6 caracteres' }
    }

    if (!VALID_ROLES.has(data.rol)) {
      return { success: false, message: 'Rol invalido para la base actual' }
    }

    if (data.rol === 'hermano' && (!data.tutor_id || data.tutor_id === 'null')) {
      return { success: false, message: 'El hermano debe estar asignado a un tutor' }
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: { nombre: data.nombre },
    })

    if (authError) {
      console.error('Error en auth:', authError)
      return { success: false, message: authError.message }
    }

    const insertData: UsuarioPayload = {
      user_id: authData.user.id,
      nombre: data.nombre,
      email: normalizedEmail,
      rol: data.rol,
    }

    if (data.tutor_id && data.tutor_id !== '' && data.tutor_id !== 'null') {
      insertData.tutor_id = data.tutor_id
    }

    const { error: insertError } = await supabaseAdmin.from('usuarios').insert(insertData)

    if (insertError) {
      console.error('Error al insertar:', insertError)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { success: false, message: insertError.message }
    }

    revalidatePath('/dashboard')
    return {
      success: true,
      message: `Usuario ${data.nombre} creado exitosamente. Puede iniciar sesion con ${normalizedEmail}`,
    }
  } catch (error) {
    console.error('Error en crearUsuario:', error)
    return { success: false, message: getErrorMessage(error) }
  }
}

export async function actualizarUsuario(data: {
  id: string
  nombre: string
  email: string
  rol: string
  tutor_id: string | null
}) {
  try {
    const normalizedEmail = normalizeEmail(data.email)

    console.log('Actualizando usuario:', { id: data.id, nombre: data.nombre, rol: data.rol })

    if (!VALID_ROLES.has(data.rol)) {
      return { success: false, message: 'Rol invalido para la base actual' }
    }

    if (data.rol === 'hermano' && (!data.tutor_id || data.tutor_id === 'null')) {
      return { success: false, message: 'El hermano debe estar asignado a un tutor' }
    }

    const { data: usuarioActual, error: getError } = await supabaseAdmin
      .from('usuarios')
      .select('user_id')
      .eq('id', data.id)
      .single()

    if (getError) {
      console.error('Error al obtener usuario:', getError)
      return { success: false, message: getError.message }
    }

    if (usuarioActual?.user_id) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        usuarioActual.user_id,
        {
          email: normalizedEmail,
          user_metadata: { nombre: data.nombre },
        }
      )

      if (authUpdateError) {
        console.error('Error al actualizar auth:', authUpdateError)
        return { success: false, message: authUpdateError.message }
      }
    }

    const updateData: UsuarioPayload = {
      nombre: data.nombre,
      email: normalizedEmail,
      rol: data.rol,
    }

    if (data.tutor_id && data.tutor_id !== '' && data.tutor_id !== 'null') {
      updateData.tutor_id = data.tutor_id
    } else if (data.rol === 'tutor') {
      updateData.tutor_id = null
    }

    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update(updateData)
      .eq('id', data.id)

    if (updateError) {
      console.error('Error al actualizar:', updateError)
      return { success: false, message: updateError.message }
    }

    revalidatePath('/dashboard')
    return { success: true, message: 'Usuario actualizado exitosamente' }
  } catch (error) {
    console.error('Error en actualizarUsuario:', error)
    return { success: false, message: getErrorMessage(error) }
  }
}

export async function eliminarUsuario(id: string) {
  try {
    console.log('Eliminando usuario:', id)

    const { data: usuario, error: getError } = await supabaseAdmin
      .from('usuarios')
      .select('user_id')
      .eq('id', id)
      .single()

    if (getError) {
      console.error('Error al obtener usuario:', getError)
      return { success: false, message: getError.message }
    }

    if (usuario?.user_id) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(usuario.user_id)
      if (authError) {
        console.error('Error deleting auth user:', authError)
      }
    }

    const { error: deleteError } = await supabaseAdmin.from('usuarios').delete().eq('id', id)

    if (deleteError) {
      console.error('Error al eliminar de tabla:', deleteError)
      return { success: false, message: deleteError.message }
    }

    revalidatePath('/dashboard')
    return { success: true, message: 'Usuario eliminado exitosamente' }
  } catch (error) {
    console.error('Error en eliminarUsuario:', error)
    return { success: false, message: getErrorMessage(error) }
  }
}
