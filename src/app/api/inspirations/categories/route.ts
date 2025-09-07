import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_CATEGORIES = ['work', 'life', 'creation', 'learning']

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all inspirations with categories
    const { data, error } = await supabase
      .from('inspirations')
      .select('categories')
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Count categories
    const categoryCounts: Record<string, number> = {
      work: 0,
      life: 0,
      creation: 0,
      learning: 0
    }

    data?.forEach(inspiration => {
      if (inspiration.categories && Array.isArray(inspiration.categories)) {
        inspiration.categories.forEach((category: string) => {
          if (VALID_CATEGORIES.includes(category)) {
            categoryCounts[category] = (categoryCounts[category] || 0) + 1
          }
        })
      }
    })

    const categories = VALID_CATEGORIES.map(category => ({
      name: category,
      count: categoryCounts[category],
      label: {
        work: '工作',
        life: '生活',
        creation: '创作',
        learning: '学习'
      }[category]
    }))

    return NextResponse.json({ categories })

  } catch (error) {
    console.error('Get categories API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { inspirationIds, categories, action } = await request.json()

    if (!inspirationIds || !Array.isArray(inspirationIds) || !categories || !Array.isArray(categories)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Validate categories
    const validCategories = categories.filter((cat: string) => VALID_CATEGORIES.includes(cat))
    if (validCategories.length === 0) {
      return NextResponse.json({ error: 'No valid categories provided' }, { status: 400 })
    }

    const results = await Promise.all(
      inspirationIds.map(async (id: string) => {
        // Get current inspiration
        const { data: inspiration, error: fetchError } = await supabase
          .from('inspirations')
          .select('categories')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (fetchError) {
          return { id, error: fetchError.message }
        }

        let updatedCategories = inspiration.categories || []

        if (action === 'add') {
          // Add new categories (avoid duplicates)
          const newCategories = validCategories.filter((cat: string) => !updatedCategories.includes(cat))
          updatedCategories = [...updatedCategories, ...newCategories]
        } else if (action === 'remove') {
          // Remove specified categories
          updatedCategories = updatedCategories.filter((cat: string) => !validCategories.includes(cat))
        } else if (action === 'replace') {
          // Replace all categories
          updatedCategories = validCategories
        }

        // Ensure at least one category exists
        if (updatedCategories.length === 0) {
          updatedCategories = ['creation']
        }

        // Update inspiration
        const { error: updateError } = await supabase
          .from('inspirations')
          .update({ 
            categories: updatedCategories,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.id)

        if (updateError) {
          return { id, error: updateError.message }
        }

        return { id, success: true, categories: updatedCategories }
      })
    )

    return NextResponse.json({ results })

  } catch (error) {
    console.error('Update categories API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}