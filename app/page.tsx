'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirigir según el rol (por ahora a dashboard)
    router.push('/dashboard')
  }, [router])
  
  return null
}