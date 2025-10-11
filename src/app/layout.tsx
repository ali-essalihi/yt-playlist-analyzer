import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { SWRConfig } from 'swr'

export const metadata: Metadata = {
  title: 'Youtube Playlist Analyzer',
  description:
    "Get detailed insights and breakdowns of YouTube playlists. Perfect planning tool to understand what you're getting into before you start watching",
}

const inter = Inter({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SWRConfig
          value={{
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            shouldRetryOnError: false,
          }}
        >
          <Toaster position="top-center" />
          {children}
        </SWRConfig>
      </body>
    </html>
  )
}
