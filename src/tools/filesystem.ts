import { readFile, writeFile, readdir, stat, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { BaseTool } from './base-tool.js';

export class FileSystemTool extends BaseTool {
  name = 'filesystem';
  description = 'Perform file system operations like read, write, list, delete files and directories';
  
  parameters = {
    type: 'object' as const,
    properties: {
      operation: {
        type: 'string',
        enum: ['read', 'write', 'list', 'delete', 'mkdir'],
        description: 'The operation to perform',
      },
      path: {
        type: 'string',
        description: 'The file or directory path',
      },
      content: {
        type: 'string',
        description: 'Content to write (only for write operation)',
      },
      recursive: {
        type: 'boolean',
        description: 'Whether to perform operation recursively',
      },
    },
    required: ['operation', 'path'],
  };

  async execute(args: any): Promise<string> {
    this.validateArgs(args);
    const { operation, path, content, recursive } = args;

    try {
      switch (operation) {
        case 'read':
          return await readFile(path, 'utf-8');
        
        case 'write':
          if (!content) throw new Error('Content is required for write operation');
          await mkdir(dirname(path), { recursive: true });
          await writeFile(path, content);
          return `File written successfully to ${path}`;
        
        case 'list':
          const items = await readdir(path);
          const details = await Promise.all(
            items.map(async (item) => {
              const itemPath = join(path, item);
              const stats = await stat(itemPath);
              return {
                name: item,
                type: stats.isDirectory() ? 'directory' : 'file',
                size: stats.size,
              };
            })
          );
          return JSON.stringify(details, null, 2);
        
        case 'delete':
          await rm(path, { recursive: recursive || false });
          return `Deleted ${path}`;
        
        case 'mkdir':
          await mkdir(path, { recursive: recursive || false });
          return `Created directory ${path}`;
        
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      throw new Error(`FileSystem operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}