'use client'

import { Inspiration } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Archive,
  Check,
  Grid,
  List,
  Plus,
  RefreshCw,
  Search,
  SortAsc,
  SortDesc,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { InspirationCard } from './InspirationCard'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface InspirationLibraryProps {
  onCreateNew?: () => void
}

export function InspirationLibrary({ onCreateNew }: InspirationLibraryProps) {
  const [inspirations, setInspirations] = useState<Inspiration[]>([])
  const [filteredInspirations, setFilteredInspirations] = useState<Inspiration[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'title'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  // Load inspirations
  useEffect(() => {
    loadInspirations()
  }, [])

  // Filter and sort inspirations
  useEffect(() => {
    let filtered = [...inspirations]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(inspiration =>
        inspiration.title.toLowerCase().includes(query) ||
        inspiration.content.toLowerCase().includes(query) ||
        inspiration.summary?.toLowerCase().includes(query) ||
        inspiration.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(inspiration =>
        inspiration.categories.includes(categoryFilter)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | Date
      let bValue: string | Date

      switch (sortBy) {
        case 'title':
          aValue = a.title
          bValue = b.title
          break
        case 'updated_at':
          aValue = new Date(a.updated_at)
          bValue = new Date(b.updated_at)
          break
        default:
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredInspirations(filtered)
  }, [inspirations, searchQuery, categoryFilter, sortBy, sortOrder])

  const loadInspirations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/inspirations')
      
      if (response.ok) {
        const data = await response.json()
        setInspirations(data.inspirations || [])
      } else {
        console.error('Failed to load inspirations')
      }
    } catch (error) {
      console.error('Error loading inspirations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds)
    if (selected) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredInspirations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredInspirations.map(i => i.id)))
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个灵感吗？')) {
      try {
        const response = await fetch(`/api/inspirations/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setInspirations(prev => prev.filter(i => i.id !== id))
          setSelectedIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
        }
      } catch (error) {
        console.error('Failed to delete inspiration:', error)
      }
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    
    if (confirm(`确定要删除选中的 ${selectedIds.size} 个灵感吗？`)) {
      try {
        const response = await fetch(`/api/inspirations?ids=${Array.from(selectedIds).join(',')}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setInspirations(prev => prev.filter(i => !selectedIds.has(i.id)))
          setSelectedIds(new Set())
          setIsSelectionMode(false)
        }
      } catch (error) {
        console.error('Failed to delete inspirations:', error)
      }
    }
  }

  const handleEdit = (inspiration: Inspiration) => {
    // TODO: Open edit modal/page
    console.log('Edit inspiration:', inspiration)
  }

  const handleShare = (inspiration: Inspiration) => {
    // TODO: Implement sharing
    if (navigator.share) {
      navigator.share({
        title: inspiration.title,
        text: inspiration.summary || inspiration.content,
      })
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${inspiration.title}\n\n${inspiration.content}`)
      alert('已复制到剪贴板')
    }
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-2 text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Archive className="w-5 h-5 text-gray-600" />
            <h1 className="text-lg font-semibold text-gray-900">灵感库</h1>
            <span className="text-sm text-gray-500">({filteredInspirations.length})</span>
          </div>
          
          <Button
            onClick={onCreateNew}
            className="flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>新建灵感</span>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索灵感..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">所有分类</option>
            <option value="work">工作</option>
            <option value="life">生活</option>
            <option value="creation">创作</option>
            <option value="learning">学习</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'created_at' | 'updated_at' | 'title')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at">创建时间</option>
            <option value="updated_at">更新时间</option>
            <option value="title">标题</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortOrder}
            className="p-2"
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
        </div>

        {/* Selection Mode Controls */}
        {isSelectionMode && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-700">
                已选择 {selectedIds.size} 项
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-700"
              >
                {selectedIds.size === filteredInspirations.length ? '取消全选' : '全选'}
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0}
              >
                删除选中
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSelectionMode(false)
                  setSelectedIds(new Set())
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredInspirations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Archive className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || categoryFilter ? '没有找到匹配的灵感' : '还没有灵感记录'}
            </h3>
            <p className="text-sm text-center max-w-md">
              {searchQuery || categoryFilter 
                ? '尝试调整搜索条件或清除筛选器'
                : '开始与AI对话，捕捉你的第一个灵感吧！'
              }
            </p>
            {!(searchQuery || categoryFilter) && (
              <Button
                onClick={onCreateNew}
                className="mt-4"
              >
                开始对话
              </Button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          )}>
            {filteredInspirations.map((inspiration) => (
              <InspirationCard
                key={inspiration.id}
                inspiration={inspiration}
                isSelected={selectedIds.has(inspiration.id)}
                onSelect={isSelectionMode ? handleSelect : undefined}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onShare={handleShare}
                className={viewMode === 'list' ? 'flex-row' : ''}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB for selection mode */}
      {!isSelectionMode && filteredInspirations.length > 0 && (
        <Button
          onClick={() => setIsSelectionMode(true)}
          className="fixed bottom-4 right-4 rounded-full w-12 h-12 p-0 shadow-lg"
        >
          <Check className="w-5 h-5" />
        </Button>
      )}
    </div>
  )
}