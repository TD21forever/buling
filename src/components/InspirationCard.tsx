'use client'

import { Inspiration } from '@/lib/types'
import { cn, formatDate, truncateText } from '@/lib/utils'
import {
  Calendar,
  Copy,
  Edit,
  Folder,
  MoreVertical,
  Share,
  Tag,
  Trash
} from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'

interface InspirationCardProps {
  inspiration: Inspiration
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onEdit?: (inspiration: Inspiration) => void
  onDelete?: (id: string) => void
  onShare?: (inspiration: Inspiration) => void
  className?: string
}

export function InspirationCard({
  inspiration,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onShare,
  className
}: InspirationCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(inspiration.id, !isSelected)
    }
  }

  const handleMenuAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)

    switch (action) {
      case 'edit':
        onEdit?.(inspiration)
        break
      case 'delete':
        onDelete?.(inspiration.id)
        break
      case 'copy':
        navigator.clipboard.writeText(inspiration.content)
        break
      case 'share':
        onShare?.(inspiration)
        break
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      work: 'bg-blue-100 text-blue-800 border-blue-200',
      life: 'bg-green-100 text-green-800 border-green-200',
      creation: 'bg-purple-100 text-purple-800 border-purple-200',
      learning: 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      work: '工作',
      life: '生活',
      creation: '创作',
      learning: '学习'
    }
    return labels[category as keyof typeof labels] || category
  }

  return (
    <div 
      className={cn(
        "bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer group relative",
        isSelected && "ring-2 ring-blue-500 border-blue-300",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Selection Indicator */}
      {onSelect && (
        <div className="absolute top-3 left-3 z-10">
          <div className={cn(
            "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
            isSelected 
              ? "bg-blue-500 border-blue-500" 
              : "border-gray-300 bg-white group-hover:border-gray-400"
          )}>
            {isSelected && (
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Menu Button */}
      <div className="absolute top-3 right-3 z-10">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
              <button
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={(e) => handleMenuAction('edit', e)}
              >
                <Edit className="w-4 h-4" />
                <span>编辑</span>
              </button>
              <button
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={(e) => handleMenuAction('copy', e)}
              >
                <Copy className="w-4 h-4" />
                <span>复制内容</span>
              </button>
              <button
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={(e) => handleMenuAction('share', e)}
              >
                <Share className="w-4 h-4" />
                <span>分享</span>
              </button>
              <hr className="my-1" />
              <button
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={(e) => handleMenuAction('delete', e)}
              >
                <Trash className="w-4 h-4" />
                <span>删除</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className={cn("p-4", onSelect && "pl-8")}>
        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {inspiration.title}
        </h3>

        {/* Summary */}
        {inspiration.summary && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {inspiration.summary}
          </p>
        )}

        {/* Content Preview */}
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
          {truncateText(inspiration.content, 120)}
        </p>

        {/* Categories */}
        {inspiration.categories && inspiration.categories.length > 0 && (
          <div className="flex items-center space-x-1 mb-3">
            <Folder className="w-3 h-3 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              {inspiration.categories.map((category) => (
                <span
                  key={category}
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                    getCategoryColor(category)
                  )}
                >
                  {getCategoryLabel(category)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {inspiration.tags && inspiration.tags.length > 0 && (
          <div className="flex items-center space-x-1 mb-3">
            <Tag className="w-3 h-3 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              {inspiration.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
              {inspiration.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{inspiration.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(inspiration.created_at)}</span>
          </div>
          {inspiration.created_at !== inspiration.updated_at && (
            <span>已更新</span>
          )}
        </div>
      </div>

      {/* Click overlay for menu close */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(false)
          }}
        />
      )}
    </div>
  )
}