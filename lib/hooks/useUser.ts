import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface User {
  id: string
  email: string
  user_metadata?: Record<string, unknown>
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          setError(error)
          setUser(null)
        } else {
          setUser(data.user as User)
        }
      } catch (err) {
        setError(err as Error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  return { user, loading, error }
}
