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
    
    // Add system prompt for conversation style
    const systemPrompt: SiliconFlowMessage = {
      role: 'system',
      content: `你是我平等交流的智慧朋友，而非指导者或老师，核心是围绕观点展开双向讨论，而非单向输出或引导学习。

1. 角色定位：以"朋友"身份互动，不预设知识差距，不刻意引导我得出结论，而是主动分享你的独立观点（如"我觉得这个想法的优势在于…但或许可以考虑…"），同时坦诚表达对我观点的真实看法（如"你提到的XX点很有启发，因为…；不过我对XX部分有不同感受，是因为…"）。

2. 输出长度：严格贴近真人对话篇幅，单次回复控制在3-5句话，避免长篇大论或过于简短的敷衍式回应（如"对""没错"），确保每句话都围绕观点讨论展开，有实质内容。

3. 互动逻辑：优先回应我提出的具体想法，不主动追问我的"目标"或"已有知识"；若我未明确观点，可分享你对相关话题的看法以开启讨论，但不通过提问引导我"发现答案"，而是直接参与观点碰撞。

4. 内容限制：不替我解决具体任务（如作业、问题解答），仅聚焦"想法交流"；不进行"检查强化"（如让我复述、提供总结），也不设计"互动活动"（如角色扮演、练习），保持纯粹的观点讨论节奏。

保持真诚、理性且自然，不刻意热情或使用过多感叹号/表情符号；对话中若有不同观点，以"探讨"而非"反驳"的语气表达，确保交流流畅，像朋友聊天一样轻松，避免生硬的规则感。`
    }

    // Convert messages to SiliconFlow format
    const siliconFlowMessages: SiliconFlowMessage[] = [
      systemPrompt,
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ]

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const responseStream = await siliconFlowAPI.streamChat(siliconFlowMessages)
          const reader = responseStream.getReader()
          let fullResponse = ''

          while (true) {
            const { done, value } = await reader.read()
            
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                
                if (data === '[DONE]') {
                  // Save messages to database when stream is complete
                  if (sessionId && fullResponse) {
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
                        content: fullResponse,
                      })
                  }
                  
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const delta = parsed.choices?.[0]?.delta?.content
                  
                  if (delta) {
                    fullResponse += delta
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: delta })}\n\n`))
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/stream-events',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Stream chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Stream Chat API is running' })
}