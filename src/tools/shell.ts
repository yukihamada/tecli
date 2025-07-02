import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseTool } from './base-tool.js';

const execAsync = promisify(exec);

export class ShellTool extends BaseTool {
  name = 'shell';
  description = 'Execute shell commands';
  
  parameters = {
    type: 'object' as const,
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute',
      },
      cwd: {
        type: 'string',
        description: 'Working directory for the command',
      },
      timeout: {
        type: 'number',
        description: 'Command timeout in milliseconds',
      },
    },
    required: ['command'],
  };

  async execute(args: any): Promise<string> {
    this.validateArgs(args);
    const { command, cwd, timeout = 30000 } = args;

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        maxBuffer: 1024 * 1024 * 10, // 10MB
      });

      if (stderr && !stdout) {
        return `Error: ${stderr}`;
      }

      return stdout + (stderr ? `\nWarnings: ${stderr}` : '');
    } catch (error) {
      if (error instanceof Error) {
        return `Command failed: ${error.message}`;
      }
      return 'Command failed with unknown error';
    }
  }
}