'use client'

import { useState } from 'react'
import { ChatInterface } from '@/components/ChatInterface'
import { InspirationLibrary } from '@/components/InspirationLibrary'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { Button } from '@/components/ui/button'
import { Lightbulb, Archive, MessageSquare } from 'lucide-react'

export default function Home() {
  const [currentView, setCurrentView] = useState<'chat' | 'inspirations'>('chat')
  const [inspirationCount, setInspirationCount] = useState(0)

  const handleInspirationGenerated = async (inspiration: unknown) => {
    try {
      // Save inspiration to database
      const response = await fetch('/api/inspirations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspiration)
      })

      if (response.ok) {
        setInspirationCount(prev => prev + 1)
        console.log('Inspiration saved:', inspiration)
      }
    } catch (error) {
      console.error('Failed to save inspiration:', error)
    }
  }

  const handleCreateNew = () => {
    setCurrentView('chat')
  }

  const handleViewLibrary = () => {
    setCurrentView('inspirations')
  }

  const handleBackToChat = () => {
    setCurrentView('chat')
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">捕灵</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={currentView === 'chat' ? 'default' : 'ghost'}
              size="sm"
              onClick={handleBackToChat}
              className="flex items-center space-x-1"
            >
              <MessageSquare className="w-4 h-4" />
              <span>对话</span>
            </Button>
            
            <Button
              variant={currentView === 'inspirations' ? 'default' : 'ghost'}
              size="sm"
              onClick={handleViewLibrary}
              className="flex items-center space-x-1"
            >
              <Archive className="w-4 h-4" />
              <span>灵感库</span>
              {inspirationCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                  {inspirationCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'chat' ? (
          <ChatInterface onInspirationGenerated={handleInspirationGenerated} />
        ) : (
          <InspirationLibrary onCreateNew={handleCreateNew} />
        )}
      </div>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}