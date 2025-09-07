export interface SiliconFlowMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SiliconFlowResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class SiliconFlowAPI {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL: string = 'https://api.siliconflow.cn/v1/chat/completions') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async chat(messages: SiliconFlowMessage[], model: string = 'Qwen/QwQ-32B'): Promise<SiliconFlowResponse> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async streamChat(messages: SiliconFlowMessage[], model: string = 'Qwen/QwQ-32B'): Promise<ReadableStream> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.body!;
  }
}

export const siliconFlowAPI = new SiliconFlowAPI(
  process.env.SILICON_FLOW_API_KEY || '',
  process.env.SILICON_FLOW_API_URL
);