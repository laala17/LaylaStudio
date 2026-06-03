import type { Metadata } from 'next'
import Script from 'next/script'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/cart-context'
import { OrderProvider } from '@/lib/order-context'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
const metadataBase = new URL(siteUrl)

const geistSans = Geist({ 
  subsets: ["latin"],
  variable: "--font-geist-sans"
})
const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-geist-mono"
})

export const metadata: Metadata = {
  metadataBase,
  alternates: {
    canonical: '/',
  },
  title: 'LayalaStudio | Personalizované plavky',
  description: 'LayalaStudio — Vytváříme jedinečné personalizované plavky s vlastními návrhy. Elegance, kvalita a kreativita.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="cs" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <CartProvider>
          <OrderProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </OrderProvider>
        </CartProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <Script
          src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
          strategy="beforeInteractive"
          type="module"
        />
      </body>
    </html>
  )
}
