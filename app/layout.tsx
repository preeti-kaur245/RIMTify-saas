import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rimtify | University Management System',
  description: 'Professional University Management System for Students, Teachers, and Admins.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
