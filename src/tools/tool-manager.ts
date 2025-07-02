import type { ChatCompletionTool, ChatCompletionMessageToolCall } from 'groq-sdk/resources/chat/completions';
import { FileSystemTool } from './filesystem.js';
import { WebSearchTool } from './websearch.js';
import { ShellTool } from './shell.js';
import { BaseTool } from './base-tool.js';

export interface ToolExecutionResult {
  name: string;
  output: string;
  error?: string;
}

export class ToolManager {
  private tools: Map<string, BaseTool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    this.registerTool(new FileSystemTool());
    this.registerTool(new WebSearchTool());
    this.registerTool(new ShellTool());
  }

  registerTool(tool: BaseTool) {
    this.tools.set(tool.name, tool);
  }

  getToolDefinitions(): ChatCompletionTool[] {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  async executeTools(toolCalls: ChatCompletionMessageToolCall[]): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];

    for (const call of toolCalls) {
      const tool = this.tools.get(call.function.name);
      
      if (!tool) {
        results.push({
          name: call.function.name,
          output: '',
          error: `Tool ${call.function.name} not found`,
        });
        continue;
      }

      try {
        const args = JSON.parse(call.function.arguments);
        const output = await tool.execute(args);
        results.push({
          name: call.function.name,
          output,
        });
      } catch (error) {
        results.push({
          name: call.function.name,
          output: '',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  listTools(): string[] {
    return Array.from(this.tools.keys());
  }
}