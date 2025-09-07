'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { 
  Download, 
  Trash2, 
  Plus, 
  Minus, 
  RefreshCw,
  X,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BatchOperationsProps {
  selectedIds: string[]
  onComplete: () => void
  onCancel: () => void
}

export function BatchOperations({ selectedIds, onComplete, onCancel }: BatchOperationsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeOperation, setActiveOperation] = useState<string | null>(null)
  const [operationData, setOperationData] = useState<{ 
    categories?: string[]; 
    tags?: string[]; 
    format?: string; 
    tagsInput?: string; 
    categoriesInput?: string;
    confirmed?: boolean;
  }>({})

  const operations = [
    {
      id: 'addCategories',
      label: '添加分类',
      icon: Plus,
      color: 'text-blue-600',
      description: '为选中的灵感添加分类'
    },
    {
      id: 'removeCategories', 
      label: '移除分类',
      icon: Minus,
      color: 'text-red-600',
      description: '从选中的灵感中移除分类'
    },
    {
      id: 'addTags',
      label: '添加标签',
      icon: Plus,
      color: 'text-green-600',
      description: '为选中的灵感添加标签'
    },
    {
      id: 'removeTags',
      label: '移除标签',
      icon: Minus,
      color: 'text-orange-600',
      description: '从选中的灵感中移除标签'
    },
    {
      id: 'export',
      label: '导出',
      icon: Download,
      color: 'text-purple-600',
      description: '导出选中的灵感'
    },
    {
      id: 'delete',
      label: '删除',
      icon: Trash2,
      color: 'text-red-600',
      description: '删除选中的灵感（不可恢复）'
    }
  ]

  const categories = [
    { value: 'work', label: '工作' },
    { value: 'life', label: '生活' },
    { value: 'creation', label: '创作' },
    { value: 'learning', label: '学习' }
  ]

  const exportFormats = [
    { value: 'markdown', label: 'Markdown (.md)' },
    { value: 'json', label: 'JSON (.json)' },
    { value: 'txt', label: '纯文本 (.txt)' }
  ]

  const handleOperationClick = (operationId: string) => {
    setActiveOperation(operationId)
    setOperationData({})
  }

  const handleExecute = async () => {
    if (!activeOperation || selectedIds.length === 0) return

    try {
      setIsLoading(true)

      const requestData: { action: string; inspirationIds: string[]; data: typeof operationData } = {
        action: activeOperation,
        inspirationIds: selectedIds,
        data: operationData
      }

      const response = await fetch('/api/inspirations/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error('操作失败')
      }

      if (activeOperation === 'export') {
        const result = await response.json()
        if (result.exportData) {
          downloadFile(result.exportData)
        }
      } else {
        const result = await response.json()
        console.log('Batch operation result:', result)
      }

      onComplete()
      setActiveOperation(null)
    } catch (error) {
      console.error('Batch operation failed:', error)
      alert('操作失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadFile = (fileData: { data: string; filename: string; mimeType?: string }) => {
    const blob = new Blob([fileData.data], { type: fileData.mimeType || 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileData.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderOperationForm = () => {
    if (!activeOperation) return null

    switch (activeOperation) {
      case 'addCategories':
      case 'removeCategories':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              选择分类
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <label key={category.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={operationData.categories?.includes(category.value) || false}
                    onChange={(e) => {
                      const categories = operationData.categories || []
                      if (e.target.checked) {
                        setOperationData({
                          ...operationData,
                          categories: [...categories, category.value]
                        })
                      } else {
                        setOperationData({
                          ...operationData,
                          categories: categories.filter((c: string) => c !== category.value)
                        })
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{category.label}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'addTags':
      case 'removeTags':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              输入标签（用逗号分隔）
            </label>
            <Input
              placeholder="例如：创意, 想法, 计划"
              value={operationData.tagsInput || ''}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                setOperationData({
                  ...operationData,
                  tagsInput: e.target.value,
                  tags
                })
              }}
            />
            {operationData.tags && operationData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {operationData.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )

      case 'export':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              选择导出格式
            </label>
            <div className="space-y-2">
              {exportFormats.map((format) => (
                <label key={format.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={format.value}
                    checked={operationData.format === format.value}
                    onChange={(e) => setOperationData({
                      ...operationData,
                      format: e.target.value
                    })}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{format.label}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'delete':
        return (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Trash2 className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">确认删除</h4>
                  <p className="text-sm text-red-700 mt-1">
                    您即将删除 {selectedIds.length} 个灵感。此操作不可恢复。
                  </p>
                </div>
              </div>
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={operationData.confirmed || false}
                onChange={(e) => setOperationData({
                  ...operationData,
                  confirmed: e.target.checked
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">我确认要删除这些灵感</span>
            </label>
          </div>
        )

      default:
        return null
    }
  }

  const canExecute = () => {
    if (!activeOperation) return false

    switch (activeOperation) {
      case 'addCategories':
      case 'removeCategories':
        return operationData.categories && operationData.categories.length > 0
      case 'addTags':
      case 'removeTags':
        return operationData.tags && operationData.tags.length > 0
      case 'export':
        return operationData.format
      case 'delete':
        return operationData.confirmed
      default:
        return false
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          批量操作
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="p-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        已选择 {selectedIds.length} 个灵感
      </div>

      {!activeOperation ? (
        <div className="space-y-2">
          {operations.map((operation) => {
            const Icon = operation.icon
            return (
              <button
                key={operation.id}
                onClick={() => handleOperationClick(operation.id)}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
              >
                <Icon className={cn("w-5 h-5", operation.color)} />
                <div>
                  <div className="font-medium text-gray-900">{operation.label}</div>
                  <div className="text-sm text-gray-500">{operation.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveOperation(null)}
              className="p-1"
            >
              ←
            </Button>
            <span className="font-medium text-gray-900">
              {operations.find(op => op.id === activeOperation)?.label}
            </span>
          </div>

          {renderOperationForm()}

          <div className="flex space-x-2 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setActiveOperation(null)}
              className="flex-1"
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              onClick={handleExecute}
              disabled={!canExecute() || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  执行中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  执行
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}