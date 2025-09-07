'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Loader2, Tag, Sparkles } from 'lucide-react'

export default function SaveInspirationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [editedTitle, setEditedTitle] = useState('')
  const [editedSummary, setEditedSummary] = useState('')
  const [editedCategories, setEditedCategories] = useState<string[]>([])
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  const categoryOptions = [
    { value: 'work', label: '工作', color: 'bg-blue-100 text-blue-800' },
    { value: 'life', label: '生活', color: 'bg-green-100 text-green-800' },
    { value: 'creation', label: '创作', color: 'bg-purple-100 text-purple-800' },
    { value: 'learning', label: '学习', color: 'bg-orange-100 text-orange-800' }
  ]

  useEffect(() => {
    // Get messages from localStorage or session
    const storedMessages = localStorage.getItem('currentChatMessages')
    if (storedMessages) {
      const parsedMessages = JSON.parse(storedMessages)
      setMessages(parsedMessages)
      analyzeConversation(parsedMessages)
    }
  }, [])

  const analyzeConversation = async (chatMessages: any[]) => {
    setIsAnalyzing(true)
    try {
      const conversationContent = chatMessages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content}`)
        .join('\n\n')

      const response = await fetch('/api/inspiration/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: conversationContent })
      })

      if (response.ok) {
        const result = await response.json()
        setEditedTitle(result.title)
        setEditedSummary(result.summary)
        setEditedCategories(result.categories)
        setEditedTags(result.tags)
      }
    } catch (error) {
      console.error('分析对话失败:', error)
      setEditedTitle(`对话记录 - ${new Date().toLocaleDateString('zh-CN')}`)
      setEditedSummary('这是一次有意义的对话')
      setEditedCategories(['creation'])
      setEditedTags(['对话'])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const conversationContent = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content}`)
        .join('\n\n')

      const inspirationData = {
        title: editedTitle,
        content: conversationContent,
        summary: editedSummary,
        categories: editedCategories,
        tags: editedTags
      }

      const response = await fetch('/api/inspirations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspirationData)
      })

      if (response.ok) {
        // Clear stored messages
        localStorage.removeItem('currentChatMessages')
        router.push('/')
      }
    } catch (error) {
      console.error('保存灵感失败:', error)
      alert('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleCategory = (category: string) => {
    setEditedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const addTag = () => {
    if (newTag.trim() && !editedTags.includes(newTag.trim())) {
      setEditedTags(prev => [...prev, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setEditedTags(prev => prev.filter(t => t !== tag))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <h1 className="font-bold text-gray-900">保存灵感</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">正在分析对话内容...</p>
          </div>
        ) : (
          <div className="space-y-6 bg-white rounded-lg p-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题
              </label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="为你的灵感起个标题..."
                className="text-gray-900"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                摘要
              </label>
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                placeholder="简要描述..."
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分类
              </label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => toggleCategory(category.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      editedCategories.includes(category.value)
                        ? category.color
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {editedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-3 py-1 bg-blue-100 text-blue-800 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="添加标签..."
                  className="text-gray-900"
                />
                <Button
                  onClick={addTag}
                  variant="outline"
                  disabled={!newTag.trim()}
                >
                  添加
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex-1"
                disabled={isSaving}
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !editedTitle.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    保存灵感
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}