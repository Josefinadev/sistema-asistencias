/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js')
const fs = require('node:fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan variables de entorno de Supabase para ejecutar el script')
}

const supabase = createClient(supabaseUrl, supabaseKey)
const sqlContent = fs.readFileSync('./reset_asistencia_diaria.sql', 'utf8')

async function executeSQL() {
  try {
    console.log('Ejecutando funciones SQL para reinicio diario de asistencia...')

    const functions = sqlContent.split(';').filter((stmt) => stmt.trim().length > 0)

    for (const sqlFunction of functions) {
      if (!sqlFunction.trim()) continue

      console.log('Ejecutando:', `${sqlFunction.substring(0, 50)}...`)
      const { error } = await supabase.rpc('exec_sql', { sql: `${sqlFunction};` })

      if (error) {
        console.error('Error ejecutando funcion:', error)
      } else {
        console.log('Funcion ejecutada correctamente')
      }
    }

    console.log('Todas las funciones han sido procesadas')
  } catch (error) {
    console.error('Error general:', error)
  }
}

void executeSQL()
