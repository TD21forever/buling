import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inspirationAnalyzer } from '@/lib/inspiration-analyzer'

export async function POST(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, title } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    // Save all messages to the session
    const messagesData = messages.map((msg: { role: 'user' | 'assistant'; content: string }, index: number) => ({
      session_id: params.id,
      role: msg.role,
      content: msg.content,
      created_at: new Date(Date.now() + index * 1000).toISOString() // Ensure ordering
    }))

    // Clear existing messages for this session first
    await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', params.id)

    // Insert new messages
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .insert(messagesData)

    if (messagesError) {
      console.error('Failed to save messages:', messagesError)
    }

    // Update session title if provided
    if (title) {
      await supabase
        .from('chat_sessions')
        .update({ 
          title,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('user_id', user.id)
    }

    // Generate and save inspiration analysis
    const conversationContent = messages
      .map((msg: { role: 'user' | 'assistant'; content: string }) => `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content}`)
      .join('\n\n')

    let inspiration = null
    try {
      const analysis = await inspirationAnalyzer.analyzeContent(conversationContent)
      
      // Save the inspiration
      const { data: inspirationData, error: inspirationError } = await supabase
        .from('inspirations')
        .insert({
          user_id: user.id,
          title: analysis.title,
          content: conversationContent,
          summary: analysis.summary,
          categories: analysis.categories,
          tags: analysis.tags,
        })
        .select()
        .single()

      if (!inspirationError) {
        inspiration = inspirationData
        
        // Link the session to the inspiration
        await supabase
          .from('chat_sessions')
          .update({ inspiration_id: inspirationData.id })
          .eq('id', params.id)
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.warn('Failed to generate inspiration analysis:', error)
    }

    return NextResponse.json({
      success: true,
      inspiration,
      messagesSaved: messagesData.length
    })

  } catch (error) {
    console.error('Save chat session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}