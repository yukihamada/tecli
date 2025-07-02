import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';

export class ConversationManager {
  private messages: ChatCompletionMessageParam[] = [];
  private maxMessages: number = 20;

  addMessage(role: 'system' | 'user' | 'assistant' | 'tool', content: string, name?: string) {
    const message: ChatCompletionMessageParam = role === 'tool' 
      ? { role, content, tool_call_id: name || '' }
      : { role, content };
    
    this.messages.push(message);
    
    if (this.messages.length > this.maxMessages) {
      const systemMessages = this.messages.filter(m => m.role === 'system');
      const otherMessages = this.messages.filter(m => m.role !== 'system');
      this.messages = [...systemMessages, ...otherMessages.slice(-this.maxMessages + systemMessages.length)];
    }
  }

  addToolCallResponse(toolCallId: string, content: string) {
    this.messages.push({
      role: 'tool',
      content,
      tool_call_id: toolCallId,
    });
  }

  getMessages(): ChatCompletionMessageParam[] {
    return [...this.messages];
  }

  clear() {
    this.messages = [];
  }

  setMaxMessages(max: number) {
    this.maxMessages = max;
  }

  exportConversation(): string {
    return JSON.stringify(this.messages, null, 2);
  }

  importConversation(data: string) {
    try {
      const imported = JSON.parse(data);
      if (Array.isArray(imported)) {
        this.messages = imported;
      }
    } catch (error) {
      throw new Error('Invalid conversation data');
    }
  }
}