import { MetadataRoute } from 'next'
import { isProd } from '@/lib/env'

export default function manifest(): MetadataRoute.Manifest {
  const appName = isProd() ? 'ELTravel.in' : 'ELTravel.in Dev'

  return {
    name: appName,
    short_name: appName,
    description: 'The Executive Transit Experience',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A1628',
    theme_color: '#0A1628',
    id: '/?source=pwa',
    icons: [
      {
        src: '/images/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/images/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
