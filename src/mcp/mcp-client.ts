import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';

interface MCPRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export class MCPClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();
  private buffer = '';

  constructor(private serverPath: string, private args: string[] = []) {
    super();
  }

  async connect(): Promise<void> {
    this.process = spawn(this.serverPath, this.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.process.stdout?.on('data', (data) => {
      this.buffer += data.toString();
      this.processBuffer();
    });

    this.process.stderr?.on('data', (data) => {
      console.error('MCP Server Error:', data.toString());
    });

    this.process.on('close', (code) => {
      this.emit('close', code);
      this.pendingRequests.forEach(({ reject }) => 
        reject(new Error(`Process exited with code ${code}`))
      );
      this.pendingRequests.clear();
    });

    // Initialize connection
    await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: true,
        resources: true,
      },
    });

    await this.request('initialized');
  }

  private processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const message = JSON.parse(line) as MCPResponse;
        const pending = this.pendingRequests.get(message.id);
        
        if (pending) {
          this.pendingRequests.delete(message.id);
          
          if (message.error) {
            pending.reject(new Error(message.error.message));
          } else {
            pending.resolve(message.result);
          }
        }
      } catch (error) {
        console.error('Failed to parse MCP message:', line);
      }
    }
  }

  private async request(method: string, params?: any): Promise<any> {
    if (!this.process?.stdin) {
      throw new Error('MCP client not connected');
    }

    const id = randomUUID();
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.process!.stdin!.write(JSON.stringify(request) + '\n');
    });
  }

  async listTools(): Promise<MCPTool[]> {
    const response = await this.request('tools/list');
    return response.tools || [];
  }

  async callTool(name: string, args: any): Promise<any> {
    return this.request('tools/call', {
      name,
      arguments: args,
    });
  }

  async listResources(): Promise<any[]> {
    const response = await this.request('resources/list');
    return response.resources || [];
  }

  async readResource(uri: string): Promise<any> {
    return this.request('resources/read', { uri });
  }

  disconnect() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}