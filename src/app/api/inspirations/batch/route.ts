import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, inspirationIds, data: updateData } = await request.json()

    if (!action || !inspirationIds || !Array.isArray(inspirationIds)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    if (inspirationIds.length === 0) {
      return NextResponse.json({ error: 'No inspirations selected' }, { status: 400 })
    }

    let results: any[] = []

    switch (action) {
      case 'delete':
        results = await handleBatchDelete(supabase, user.id, inspirationIds)
        break
      
      case 'addCategories':
        results = await handleBatchUpdateCategories(supabase, user.id, inspirationIds, updateData.categories, 'add')
        break
        
      case 'removeCategories':
        results = await handleBatchUpdateCategories(supabase, user.id, inspirationIds, updateData.categories, 'remove')
        break
        
      case 'replaceCategories':
        results = await handleBatchUpdateCategories(supabase, user.id, inspirationIds, updateData.categories, 'replace')
        break
        
      case 'addTags':
        results = await handleBatchUpdateTags(supabase, user.id, inspirationIds, updateData.tags, 'add')
        break
        
      case 'removeTags':
        results = await handleBatchUpdateTags(supabase, user.id, inspirationIds, updateData.tags, 'remove')
        break
        
      case 'replaceTags':
        results = await handleBatchUpdateTags(supabase, user.id, inspirationIds, updateData.tags, 'replace')
        break
        
      case 'export':
        const exportResult = await handleBatchExport(supabase, user.id, inspirationIds, updateData.format || 'markdown')
        return NextResponse.json({ exportData: exportResult })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      results,
      summary: {
        total: inspirationIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error) {
    console.error('Batch operation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleBatchDelete(supabase: any, userId: string, inspirationIds: string[]) {
  const results = await Promise.all(
    inspirationIds.map(async (id) => {
      try {
        const { error } = await supabase
          .from('inspirations')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)

        if (error) throw error

        return { id, success: true }
      } catch (error: any) {
        return { id, success: false, error: error.message }
      }
    })
  )

  return results
}

async function handleBatchUpdateCategories(
  supabase: any, 
  userId: string, 
  inspirationIds: string[], 
  newCategories: string[], 
  operation: 'add' | 'remove' | 'replace'
) {
  const validCategories = ['work', 'life', 'creation', 'learning']
  const filteredCategories = newCategories.filter(cat => validCategories.includes(cat))

  if (filteredCategories.length === 0 && operation !== 'remove') {
    return inspirationIds.map(id => ({ id, success: false, error: 'No valid categories provided' }))
  }

  const results = await Promise.all(
    inspirationIds.map(async (id) => {
      try {
        // Get current inspiration
        const { data: inspiration, error: fetchError } = await supabase
          .from('inspirations')
          .select('categories')
          .eq('id', id)
          .eq('user_id', userId)
          .single()

        if (fetchError) throw fetchError

        let updatedCategories = inspiration.categories || []

        switch (operation) {
          case 'add':
            const newCats = filteredCategories.filter(cat => !updatedCategories.includes(cat))
            updatedCategories = [...updatedCategories, ...newCats]
            break
          case 'remove':
            updatedCategories = updatedCategories.filter((cat: string) => !filteredCategories.includes(cat))
            break
          case 'replace':
            updatedCategories = filteredCategories
            break
        }

        // Ensure at least one category
        if (updatedCategories.length === 0) {
          updatedCategories = ['creation']
        }

        const { error: updateError } = await supabase
          .from('inspirations')
          .update({ 
            categories: updatedCategories,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', userId)

        if (updateError) throw updateError

        return { id, success: true, categories: updatedCategories }
      } catch (error: any) {
        return { id, success: false, error: error.message }
      }
    })
  )

  return results
}

async function handleBatchUpdateTags(
  supabase: any, 
  userId: string, 
  inspirationIds: string[], 
  newTags: string[], 
  operation: 'add' | 'remove' | 'replace'
) {
  const results = await Promise.all(
    inspirationIds.map(async (id) => {
      try {
        // Get current inspiration
        const { data: inspiration, error: fetchError } = await supabase
          .from('inspirations')
          .select('tags')
          .eq('id', id)
          .eq('user_id', userId)
          .single()

        if (fetchError) throw fetchError

        let updatedTags = inspiration.tags || []

        switch (operation) {
          case 'add':
            const newTagsToAdd = newTags.filter(tag => !updatedTags.includes(tag))
            updatedTags = [...updatedTags, ...newTagsToAdd]
            break
          case 'remove':
            updatedTags = updatedTags.filter((tag: string) => !newTags.includes(tag))
            break
          case 'replace':
            updatedTags = newTags
            break
        }

        const { error: updateError } = await supabase
          .from('inspirations')
          .update({ 
            tags: updatedTags,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', userId)

        if (updateError) throw updateError

        return { id, success: true, tags: updatedTags }
      } catch (error: any) {
        return { id, success: false, error: error.message }
      }
    })
  )

  return results
}

async function handleBatchExport(
  supabase: any, 
  userId: string, 
  inspirationIds: string[], 
  format: 'markdown' | 'json' | 'txt'
) {
  // Get inspirations
  const { data: inspirations, error } = await supabase
    .from('inspirations')
    .select('*')
    .in('id', inspirationIds)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  if (!inspirations || inspirations.length === 0) {
    throw new Error('No inspirations found')
  }

  switch (format) {
    case 'markdown':
      return generateMarkdownExport(inspirations)
    case 'json':
      return { data: inspirations, filename: `inspirations-${Date.now()}.json` }
    case 'txt':
      return generateTextExport(inspirations)
    default:
      throw new Error('Unsupported export format')
  }
}

function generateMarkdownExport(inspirations: any[]) {
  const content = inspirations.map(inspiration => {
    const categories = inspiration.categories?.map((cat: string) => `#${cat}`).join(' ') || ''
    const tags = inspiration.tags?.map((tag: string) => `#${tag}`).join(' ') || ''
    const date = new Date(inspiration.created_at).toLocaleDateString('zh-CN')
    
    return `# ${inspiration.title}

**创建时间**: ${date}
**分类**: ${categories}
**标签**: ${tags}

## 摘要
${inspiration.summary || '无摘要'}

## 内容
${inspiration.content}

---
`
  }).join('\n')

  return {
    data: content,
    filename: `inspirations-${Date.now()}.md`,
    mimeType: 'text/markdown'
  }
}

function generateTextExport(inspirations: any[]) {
  const content = inspirations.map(inspiration => {
    const categories = inspiration.categories?.join(', ') || ''
    const tags = inspiration.tags?.join(', ') || ''
    const date = new Date(inspiration.created_at).toLocaleDateString('zh-CN')
    
    return `标题: ${inspiration.title}
创建时间: ${date}
分类: ${categories}
标签: ${tags}
摘要: ${inspiration.summary || '无摘要'}
内容: ${inspiration.content}

${'='.repeat(50)}
`
  }).join('\n')

  return {
    data: content,
    filename: `inspirations-${Date.now()}.txt`,
    mimeType: 'text/plain'
  }
}