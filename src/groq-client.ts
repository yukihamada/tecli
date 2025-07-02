import Groq from 'groq-sdk';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'groq-sdk/resources/chat/completions';

export interface ChatOptions {
  model: string;
  messages: ChatCompletionMessageParam[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  tools?: ChatCompletionTool[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

export class GroqClient {
  private client: Groq;

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  async chat(options: ChatOptions) {
    const { model, messages, stream = true, ...rest } = options;

    return this.client.chat.completions.create({
      model,
      messages,
      stream,
      ...rest,
    } as any);
  }

  async listModels() {
    const response = await this.client.models.list();
    return response.data;
  }

  async transcribe(audioFile: Buffer, options?: { model?: string; language?: string }) {
    const formData = new FormData();
    formData.append('file', new Blob([audioFile]), 'audio.wav');
    formData.append('model', options?.model || 'distil-whisper-large-v3-en');
    
    if (options?.language) {
      formData.append('language', options.language);
    }

    const response = await this.client.audio.transcriptions.create({
      file: audioFile as any,
      model: options?.model || 'distil-whisper-large-v3-en',
    });

    return response.text;
  }
}