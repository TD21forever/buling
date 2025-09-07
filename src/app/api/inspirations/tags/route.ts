import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all unique tags from user's inspirations
    const { data, error } = await supabase
      .from('inspirations')
      .select('tags')
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Extract and count unique tags
    const tagCounts: Record<string, number> = {}
    
    data?.forEach(inspiration => {
      if (inspiration.tags && Array.isArray(inspiration.tags)) {
        inspiration.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })

    // Sort tags by frequency
    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([tag, count]) => ({ tag, count }))

    return NextResponse.json({ tags: sortedTags })

  } catch (error) {
    console.error('Get tags API error:', error)
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

    const { inspirationIds, tags, action } = await request.json()

    if (!inspirationIds || !Array.isArray(inspirationIds) || !tags || !Array.isArray(tags)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const results = await Promise.all(
      inspirationIds.map(async (id: string) => {
        // Get current inspiration
        const { data: inspiration, error: fetchError } = await supabase
          .from('inspirations')
          .select('tags')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (fetchError) {
          return { id, error: fetchError.message }
        }

        let updatedTags = inspiration.tags || []

        if (action === 'add') {
          // Add new tags (avoid duplicates)
          const newTags = tags.filter((tag: string) => !updatedTags.includes(tag))
          updatedTags = [...updatedTags, ...newTags]
        } else if (action === 'remove') {
          // Remove specified tags
          updatedTags = updatedTags.filter((tag: string) => !tags.includes(tag))
        } else if (action === 'replace') {
          // Replace all tags
          updatedTags = tags
        }

        // Update inspiration
        const { error: updateError } = await supabase
          .from('inspirations')
          .update({ 
            tags: updatedTags,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.id)

        if (updateError) {
          return { id, error: updateError.message }
        }

        return { id, success: true, tags: updatedTags }
      })
    )

    return NextResponse.json({ results })

  } catch (error) {
    console.error('Update tags API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}