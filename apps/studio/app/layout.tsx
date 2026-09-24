import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { CustomCursor } from './components/custom-cursor'
import './globals.css'

export const metadata: Metadata = {
  title: 'Orvel Studio',
  description: 'Create, teach, evaluate, and deploy AI agents with Orvel.',
  icons: {
    icon: '/orvel-mark.png',
    apple: '/orvel-mark.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <CustomCursor />
      </body>
    </html>
  )
}
