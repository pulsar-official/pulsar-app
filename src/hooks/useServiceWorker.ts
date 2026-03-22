import { useEffect, useState } from 'react'

/**
 * Hook to register and manage the Service Worker
 */
export function useServiceWorker() {
  const [swReady, setSwReady] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check for service worker support
    if (!('serviceWorker' in navigator)) {
      console.log('[SW] Service Worker not supported')
      return
    }

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })

        console.log('[SW] Registered successfully')
        setSwReady(true)
        setRegistration(reg)

        // Check for updates periodically
        const updateInterval = setInterval(() => {
          reg.update().catch(() => {
            // Silently ignore errors
          })
        }, 60000) // Check every minute

        return () => clearInterval(updateInterval)
      } catch (error) {
        console.error('[SW] Registration error:', error)
      }
    }

    // Delay registration slightly to avoid blocking app
    const timeout = setTimeout(registerSW, 2000)

    return () => clearTimeout(timeout)
  }, [])

  // Listen for service worker updates
  useEffect(() => {
    if (!registration) return

    const handleControllerChange = () => {
      console.log('[SW] New service worker activated')
      // Refresh page to use new SW
      window.location.reload()
    }

    const handleUpdateFound = () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          console.log('[SW] Update available')
          setUpdateAvailable(true)

          // Notify user of update
          if (window.confirm('New version available! Reload to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' })
          }
        }
      })
    }

    registration.addEventListener('updatefound', handleUpdateFound)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
      registration.removeEventListener('updatefound', handleUpdateFound)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [registration])

  const requestUpdate = () => {
    if (registration) {
      registration.update().catch(console.error)
    }
  }

  const clearCache = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
    }
  }

  return {
    swReady,
    updateAvailable,
    registration,
    requestUpdate,
    clearCache,
  }
}
