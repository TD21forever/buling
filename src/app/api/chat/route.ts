import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SiliconFlowAPI, SiliconFlowMessage } from '@/lib/siliconflow'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, sessionId } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    const siliconFlowAPI = new SiliconFlowAPI(process.env.SILICON_FLOW_API_KEY!)
    
    // Convert messages to SiliconFlow format
    const siliconFlowMessages: SiliconFlowMessage[] = messages.map((msg: { role: 'user' | 'assistant'; content: string }) => ({
      role: msg.role,
      content: msg.content
    }))

    // Get AI response
    const response = await siliconFlowAPI.chat(siliconFlowMessages)
    const aiMessage = response.choices[0]?.message

    if (!aiMessage) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    // Save messages to database if sessionId provided
    if (sessionId) {
      // Save user message
      const userMessage = messages[messages.length - 1]
      if (userMessage.role === 'user') {
        await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            role: 'user',
            content: userMessage.content,
          })
      }

      // Save AI response
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: aiMessage.content,
        })
    }

    return NextResponse.json({
      message: aiMessage.content,
      usage: response.usage
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Chat API is running' })
}