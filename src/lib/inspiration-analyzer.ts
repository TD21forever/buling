import { SiliconFlowAPI, SiliconFlowMessage } from './siliconflow'

export interface InspirationAnalysis {
  title: string
  summary: string
  categories: string[]
  tags: string[]
}

export class InspirationAnalyzer {
  private api: SiliconFlowAPI

  constructor(apiKey: string) {
    this.api = new SiliconFlowAPI(apiKey)
  }

  async analyzeContent(content: string): Promise<InspirationAnalysis> {
    const prompt = this.buildAnalysisPrompt(content)
    
    const messages: SiliconFlowMessage[] = [
      { role: 'user', content: prompt }
    ]

    try {
      const response = await this.api.chat(messages)
      const analysisText = response.choices[0]?.message?.content

      if (!analysisText) {
        throw new Error('No analysis response received')
      }

      return this.parseAnalysisResponse(analysisText, content)
    } catch (error) {
      console.error('Analysis failed:', error)
      return this.createFallbackAnalysis(content)
    }
  }

  private buildAnalysisPrompt(content: string): string {
    return `你是一个专业的灵感分析助手。请分析以下内容，提取其中的核心思想和关键信息，并按照指定格式返回分析结果。

分析内容：
${content}

请严格按照以下JSON格式返回分析结果，不要包含任何其他文字：

{
  "title": "为这个灵感生成一个简洁有吸引力的标题（10-20字）",
  "summary": "总结这个灵感的核心要点和价值（50-100字）",
  "categories": ["从以下4个类别中选择最合适的1-2个：work（工作）, life（生活）, creation（创作）, learning（学习）"],
  "tags": ["提取3-5个最相关的关键词标签，用中文表示"]
}

分类标准：
- work：工作相关、商业想法、职业发展、项目计划等
- life：生活感悟、个人体验、日常思考、情感表达等  
- creation：创意作品、艺术灵感、设计想法、创作计划等
- learning：学习心得、知识总结、技能提升、教育相关等

请确保返回的是有效的JSON格式。`
  }

  private parseAnalysisResponse(response: string, originalContent: string): InspirationAnalysis {
    try {
      // Clean the response - remove any markdown formatting or extra text
      let cleanResponse = response.trim()
      
      // Find JSON content between curly braces
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanResponse = jsonMatch[0]
      }

      const analysis = JSON.parse(cleanResponse)
      
      // Validate required fields
      if (!analysis.title || !analysis.summary || !analysis.categories || !analysis.tags) {
        throw new Error('Missing required fields in analysis')
      }

      // Validate categories
      const validCategories = ['work', 'life', 'creation', 'learning']
      const filteredCategories = Array.isArray(analysis.categories)
        ? analysis.categories.filter((cat: string) => validCategories.includes(cat))
        : []

      if (filteredCategories.length === 0) {
        filteredCategories.push('creation') // Default category
      }

      // Validate tags
      const filteredTags = Array.isArray(analysis.tags)
        ? analysis.tags.slice(0, 5) // Limit to 5 tags
        : []

      return {
        title: String(analysis.title).slice(0, 50), // Limit title length
        summary: String(analysis.summary).slice(0, 200), // Limit summary length
        categories: filteredCategories,
        tags: filteredTags
      }
    } catch (error) {
      console.error('Failed to parse analysis response:', error)
      return this.createFallbackAnalysis(originalContent)
    }
  }

  private createFallbackAnalysis(content: string): InspirationAnalysis {
    const words = content.split(/\s+/).filter(word => word.length > 1)
    const firstSentence = content.split(/[.!?。！？]/)[0]
    
    return {
      title: firstSentence.slice(0, 20) + (firstSentence.length > 20 ? '...' : ''),
      summary: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
      categories: ['creation'],
      tags: words.slice(0, 3).concat(['灵感'])
    }
  }

  async extractTags(content: string): Promise<string[]> {
    const prompt = `请从以下内容中提取3-5个最重要的关键词标签，用中文表示，以JSON数组格式返回：

内容：${content}

返回格式：["标签1", "标签2", "标签3"]`

    try {
      const messages: SiliconFlowMessage[] = [
        { role: 'user', content: prompt }
      ]

      const response = await this.api.chat(messages)
      const tagsText = response.choices[0]?.message?.content

      if (tagsText) {
        const tags = JSON.parse(tagsText)
        return Array.isArray(tags) ? tags.slice(0, 5) : []
      }
    } catch (error) {
      console.error('Tag extraction failed:', error)
    }

    // Fallback: simple keyword extraction
    const words = content.split(/\s+/).filter(word => word.length > 1)
    return words.slice(0, 3)
  }

  async categorizeContent(content: string): Promise<string[]> {
    const prompt = `请分析以下内容，从这4个类别中选择最合适的1-2个：
- work（工作）
- life（生活）  
- creation（创作）
- learning（学习）

内容：${content}

返回格式：["category1", "category2"]`

    try {
      const messages: SiliconFlowMessage[] = [
        { role: 'user', content: prompt }
      ]

      const response = await this.api.chat(messages)
      const categoriesText = response.choices[0]?.message?.content

      if (categoriesText) {
        const categories = JSON.parse(categoriesText)
        const validCategories = ['work', 'life', 'creation', 'learning']
        return Array.isArray(categories) 
          ? categories.filter(cat => validCategories.includes(cat))
          : ['creation']
      }
    } catch (error) {
      console.error('Categorization failed:', error)
    }

    return ['creation'] // Default category
  }
}

// Singleton instance
export const inspirationAnalyzer = new InspirationAnalyzer(
  process.env.SILICON_FLOW_API_KEY || ''
)