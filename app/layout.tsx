import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Providers } from '@/lib/components/Providers'

export const metadata: Metadata = {
  title: 'Asistencia Familiar',
  description: 'Comunicación familiar simple',
  icons: {
    icon: '/logo4.png',
    apple: '/logo4.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}