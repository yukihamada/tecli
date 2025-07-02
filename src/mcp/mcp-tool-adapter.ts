import { BaseTool } from '../tools/base-tool.js';
import { MCPClient } from './mcp-client.js';

export class MCPToolAdapter extends BaseTool {
  constructor(
    private mcpClient: MCPClient,
    private toolName: string,
    private toolDescription: string,
    private toolParameters: any
  ) {
    super();
  }

  get name(): string {
    return `mcp_${this.toolName}`;
  }

  get description(): string {
    return this.toolDescription;
  }

  get parameters(): any {
    return this.toolParameters;
  }

  async execute(args: any): Promise<string> {
    try {
      const result = await this.mcpClient.callTool(this.toolName, args);
      
      if (typeof result === 'string') {
        return result;
      }
      
      return JSON.stringify(result, null, 2);
    } catch (error) {
      throw new Error(`MCP tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}