'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Sparkles, Save, Loader2, Edit3, Tag, Folder } from 'lucide-react'
import { ChatMessage as ChatMessageType } from '@/lib/types'

interface SaveInspirationModalProps {
  isOpen: boolean
  onClose: () => void
  messages: ChatMessageType[]
  onSave: (inspiration: InspirationAnalysis) => void
}

interface InspirationAnalysis {
  title: string
  summary: string
  categories: string[]
  tags: string[]
}

export function SaveInspirationModal({ isOpen, onClose, messages, onSave }: SaveInspirationModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [analysis, setAnalysis] = useState<InspirationAnalysis | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedSummary, setEditedSummary] = useState('')
  const [editedCategories, setEditedCategories] = useState<string[]>([])
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  const categoryOptions = [
    { value: 'work', label: '工作', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'life', label: '生活', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'creation', label: '创作', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'learning', label: '学习', color: 'bg-orange-100 text-orange-800 border-orange-200' }
  ]

  // 分析对话内容
  useEffect(() => {
    if (isOpen && messages.length > 1) {
      analyzeConversation()
    }
  }, [isOpen, messages])

  // 更新编辑状态
  useEffect(() => {
    if (analysis) {
      setEditedTitle(analysis.title)
      setEditedSummary(analysis.summary)
      setEditedCategories(analysis.categories)
      setEditedTags(analysis.tags)
    }
  }, [analysis])

  const analyzeConversation = async () => {
    setIsAnalyzing(true)
    try {
      const conversationContent = messages
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
        setAnalysis(result)
      } else {
        throw new Error('分析失败')
      }
    } catch (error) {
      console.error('分析对话失败:', error)
      // 提供默认分析
      const fallbackAnalysis = {
        title: `对话记录 - ${new Date().toLocaleDateString('zh-CN')}`,
        summary: '这是一次有意义的对话，包含了一些有价值的想法和见解。',
        categories: ['creation'],
        tags: ['对话', '想法']
      }
      setAnalysis(fallbackAnalysis)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (!analysis) return

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
        const result = await response.json()
        onSave(result.inspiration)
        onClose()
        resetState()
      } else {
        throw new Error('保存失败')
      }
    } catch (error) {
      console.error('保存灵感失败:', error)
      alert('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const resetState = () => {
    setAnalysis(null)
    setEditedTitle('')
    setEditedSummary('')
    setEditedCategories([])
    setEditedTags([])
    setNewTag('')
  }

  const handleClose = () => {
    onClose()
    resetState()
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTag()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>保存灵感</span>
          </DialogTitle>
          <DialogDescription>
            AI正在分析你的对话内容，提取其中的灵感要点
          </DialogDescription>
        </DialogHeader>

        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">正在分析对话内容...</p>
            <p className="text-sm text-gray-500 mt-2">AI正在提取关键信息和灵感要点</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* 标题编辑 */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Edit3 className="w-4 h-4" />
                <span>灵感标题</span>
              </label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="为你的灵感起个标题..."
                className="font-medium"
              />
            </div>

            {/* 摘要编辑 */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Sparkles className="w-4 h-4" />
                <span>核心摘要</span>
              </label>
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                placeholder="简要描述这个灵感的核心内容..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                rows={3}
              />
            </div>

            {/* 分类选择 */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Folder className="w-4 h-4" />
                <span>选择分类</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categoryOptions.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => toggleCategory(category.value)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      editedCategories.includes(category.value)
                        ? `${category.color} border-current`
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 标签编辑 */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Tag className="w-4 h-4" />
                <span>标签</span>
              </label>
              
              {/* 现有标签 */}
              <div className="flex flex-wrap gap-2">
                {editedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <span className="ml-1 text-xs opacity-60">×</span>
                  </Badge>
                ))}
              </div>

              {/* 添加新标签 */}
              <div className="flex space-x-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="添加标签..."
                  className="flex-1"
                />
                <Button
                  onClick={addTag}
                  variant="outline"
                  size="sm"
                  disabled={!newTag.trim()}
                >
                  添加
                </Button>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3 pt-4 border-t">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
                disabled={isSaving}
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !editedTitle.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-gray-500">分析失败，请重试</p>
            <Button
              onClick={analyzeConversation}
              variant="outline"
              className="mt-4"
            >
              重新分析
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}