'use client'

import { ChatMessage as ChatMessageType } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'
import { Sparkles, User } from 'lucide-react'
import React from 'react'

interface ChatMessageProps {
  message: ChatMessageType
  isTyping?: boolean
}

export function ChatMessage({ message, isTyping = false }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn(
      "flex w-full mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex max-w-[80%] gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser 
            ? "bg-blue-500 text-white" 
            : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
        )}>
          {isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col">
          <div className={cn(
            "px-4 py-3 rounded-2xl shadow-md",
            isUser 
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md" 
              : "bg-white border border-gray-200 rounded-bl-md text-gray-800"
          )}>
            {isTyping ? (
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm text-gray-500 ml-2">AI正在思考...</span>
              </div>
            ) : (
              <div className="text-sm leading-relaxed">
                {message.content.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < message.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          {!isTyping && (
            <div className={cn(
              "text-xs text-gray-500 mt-1 px-1",
              isUser ? "text-right" : "text-left"
            )}>
              {formatDate(message.timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}