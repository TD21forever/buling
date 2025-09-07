'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import { VoiceInput } from './VoiceInput'
import { SaveInspirationModal } from './SaveInspirationModal'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Send, Lightbulb, StopCircle, Save, Sparkles } from 'lucide-react'
import { ChatMessage as ChatMessageType } from '@/lib/types'
import { generateId } from '@/lib/utils'

interface ChatInterfaceProps {
  onInspirationGenerated?: (inspiration: {
    title: string
    content: string
    summary: string
    categories: string[]
    tags: string[]
  }) => void
}

export function ChatInterface({ onInspirationGenerated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isSavingInspiration, setIsSavingInspiration] = useState(false)
  const [lastSavedMessageCount, setLastSavedMessageCount] = useState(0)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    // Initialize with a greeting message
    if (messages.length === 0) {
      const greetingMessage: ChatMessageType = {
        id: generateId(),
        role: 'assistant',
        content: '你好！我是你的灵感捕捉助手。让我们通过对话来捕捉你的创意和想法吧！你可以：\n\n✨ 分享你的想法和灵感\n🎯 讨论你的项目或计划\n💡 探索新的创意方向\n🗣️ 使用语音输入（长按麦克风）\n\n有什么想聊的吗？',
        timestamp: new Date().toISOString()
      }
      setMessages([greetingMessage])
    }
  }, [])

  // Auto-save when user is about to leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (messages.length > 1 && currentSessionId) {
        saveCompleteConversation()
        e.preventDefault()
        e.returnValue = '你的对话将被保存为灵感。确定要离开吗？'
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && messages.length > 1 && currentSessionId) {
        saveCompleteConversation()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [messages, currentSessionId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const createChatSession = async () => {
    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        const { session } = await response.json()
        return session.id
      }
    } catch (error) {
      console.error('Failed to create chat session:', error)
    }
    return null
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: ChatMessageType = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      // Create session if none exists
      let sessionId = currentSessionId
      if (!sessionId) {
        sessionId = await createChatSession()
        setCurrentSessionId(sessionId)
      }

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          sessionId
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      let aiResponse = ''
      const aiMessage: ChatMessageType = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      }

      setIsTyping(false)
      setMessages(prev => [...prev, aiMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                aiResponse += data.content
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === aiMessage.id 
                      ? { ...msg, content: aiResponse }
                      : msg
                  )
                )
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Check if the conversation has enough content for inspiration
      const conversationContent = [...messages, userMessage]
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n')

      if (conversationContent.length > 200 && Math.random() > 0.3) {
        await analyzeForInspiration(conversationContent)
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error)
        const errorMessage: ChatMessageType = {
          id: generateId(),
          role: 'assistant',
          content: '抱歉，我遇到了一些技术问题。请稍后再试。',
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } finally {
      setIsLoading(false)
      setIsTyping(false)
      abortControllerRef.current = null
    }
  }

  const analyzeForInspiration = async (content: string) => {
    try {
      const response = await fetch('/api/inspiration/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        const analysis = await response.json()
        onInspirationGenerated?.(analysis)
        setLastSavedMessageCount(messages.length)
      }
    } catch (error) {
      console.error('Failed to analyze inspiration:', error)
    }
  }

  const saveCompleteConversation = async () => {
    if (!currentSessionId || messages.length <= 1) return

    try {
      const response = await fetch(`/api/chat-sessions/${currentSessionId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.filter(msg => msg.role !== 'system'),
          title: `对话记录 - ${new Date().toLocaleDateString('zh-CN')}`
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.inspiration) {
          onInspirationGenerated?.(result.inspiration)
        }
        console.log('对话已保存', result)
      }
    } catch (error) {
      console.error('Failed to save complete conversation:', error)
    }
  }

  const handleSaveInspiration = () => {
    if (messages.length <= 1) return
    setShowSaveModal(true)
  }

  const handleSaveModalClose = () => {
    setShowSaveModal(false)
  }

  const handleSaveModalSave = (inspiration: any) => {
    setShowSaveModal(false)
    onInspirationGenerated?.(inspiration)
  }

  // Auto-save logic when conversation reaches certain length
  useEffect(() => {
    const shouldAutoSave = messages.length >= 4 && 
                          messages.length > lastSavedMessageCount + 6 && 
                          !isLoading && 
                          !isTyping &&
                          !isSavingInspiration

    if (shouldAutoSave) {
      const conversationContent = messages
        .map(msg => `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content}`)
        .join('\n\n')
      
      analyzeForInspiration(conversationContent)
    }
  }, [messages, isLoading, isTyping, lastSavedMessageCount, isSavingInspiration])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const handleVoiceTranscript = (transcript: string) => {
    setInputValue(prev => prev + transcript)
    inputRef.current?.focus()
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">捕灵</h1>
              <p className="text-xs text-gray-600">AI灵感捕捉助手</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {messages.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveInspiration}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
              >
                <Save className="w-4 h-4 mr-1" />
                保存灵感
              </Button>
            )}
            {(isLoading || isTyping) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
              >
                <StopCircle className="w-4 h-4 mr-1" />
                停止
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isTyping && (
          <ChatMessage
            message={{
              id: 'typing',
              role: 'assistant',
              content: '',
              timestamp: new Date().toISOString()
            }}
            isTyping={true}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4 shadow-lg">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="分享你的想法，或长按麦克风说话..."
              disabled={isLoading}
              className="pr-4 py-3 text-base text-gray-900 placeholder:text-gray-400 border-gray-300 focus:border-purple-400 focus:ring-purple-400 rounded-xl bg-white focus:bg-gray-50 transition-colors"
            />
          </div>
          
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            className="flex-shrink-0 w-12 h-12 rounded-xl shadow-md"
          />
          
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>

      {/* Save Inspiration Modal */}
      <SaveInspirationModal
        isOpen={showSaveModal}
        onClose={handleSaveModalClose}
        messages={messages}
        onSave={handleSaveModalSave}
      />
    </div>
  )
}