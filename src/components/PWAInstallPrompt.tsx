'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if device is iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // Check if app is already installed (running in standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    setIsStandalone(isInStandaloneMode)

    // Don't show prompt if already installed
    if (isInStandaloneMode) {
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Check if user has previously dismissed the prompt
      const hasBeenDismissed = localStorage.getItem('pwa-prompt-dismissed')
      if (!hasBeenDismissed) {
        // Show prompt after a short delay
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS devices, show manual install prompt
    if (isIOSDevice && !isInStandaloneMode) {
      const hasBeenDismissed = localStorage.getItem('pwa-ios-prompt-dismissed')
      if (!hasBeenDismissed) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
        localStorage.setItem('pwa-prompt-dismissed', 'true')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    if (isIOS) {
      localStorage.setItem('pwa-ios-prompt-dismissed', 'true')
    } else {
      localStorage.setItem('pwa-prompt-dismissed', 'true')
    }
  }

  // Don't show if already installed or prompt is not needed
  if (isStandalone || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              安装捕灵应用
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {isIOS 
                ? '点击分享按钮，然后选择"添加到主屏幕"以安装应用'
                : '将捕灵添加到主屏幕，获得原生应用体验'
              }
            </p>
            
            <div className="flex space-x-2">
              {!isIOS && deferredPrompt && (
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>安装</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
              >
                稍后
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="p-1 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {isIOS && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center space-x-2">
                <span>1.</span>
                <span>点击底部的分享按钮 📤</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>2.</span>
                <span>选择"添加到主屏幕"</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>3.</span>
                <span>点击右上角的"添加"</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}