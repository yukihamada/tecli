#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import { GroqClient } from './groq-client.js';
import { loadConfig } from './config.js';
import { ConversationManager } from './conversation.js';
import { ToolManager } from './tools/tool-manager.js';

marked.use(markedTerminal() as any);

const program = new Command();

program
  .name('te')
  .description('Ultra-fast AI CLI powered by Groq Cloud')
  .version('1.0.0');

program
  .command('chat')
  .description('Start an interactive chat session')
  .option('-m, --model <model>', 'Model to use', 'llama-3.1-70b-versatile')
  .option('-s, --system <prompt>', 'System prompt')
  .option('--no-stream', 'Disable streaming responses')
  .action(async (options) => {
    const config = await loadConfig();
    const client = new GroqClient(config.apiKey);
    const conversation = new ConversationManager();
    const toolManager = new ToolManager();

    if (options.system) {
      conversation.addMessage('system', options.system);
    }

    console.log(chalk.cyan('🚀 TE - Ultra-fast AI assistant powered by Groq'));
    console.log(chalk.gray(`Model: ${options.model}`));
    console.log(chalk.gray('Type "exit" to quit\n'));

    while (true) {
      const { message } = await prompts({
        type: 'text',
        name: 'message',
        message: chalk.green('You:'),
      });

      if (!message || message.toLowerCase() === 'exit') {
        console.log(chalk.yellow('Goodbye!'));
        break;
      }

      conversation.addMessage('user', message);
      const spinner = ora('Thinking...').start();

      try {
        const response = await client.chat({
          model: options.model,
          messages: conversation.getMessages(),
          stream: options.stream !== false,
          tools: toolManager.getToolDefinitions(),
        });

        spinner.stop();
        console.log(chalk.blue('\nAssistant:'));

        if (options.stream !== false) {
          let fullResponse = '';
          for await (const chunk of response as any) {
            const content = chunk.choices[0]?.delta?.content || '';
            process.stdout.write(content);
            fullResponse += content;

            const toolCalls = chunk.choices[0]?.delta?.tool_calls;
            if (toolCalls) {
              const results = await toolManager.executeTools(toolCalls);
              console.log(chalk.gray('\n\nTool execution results:'));
              results.forEach(result => {
                console.log(chalk.gray(`- ${result.name}: ${result.output}`));
              });
            }
          }
          conversation.addMessage('assistant', fullResponse);
        } else {
          const chatResponse = response as any;
          const content = chatResponse.choices[0]?.message?.content || '';
          console.log(marked(content));
          conversation.addMessage('assistant', content);
        }

        console.log('\n');
      } catch (error) {
        spinner.fail('Error occurred');
        console.error(chalk.red('Error:'), error);
      }
    }
  });

program
  .command('ask <question>')
  .description('Ask a single question')
  .option('-m, --model <model>', 'Model to use', 'llama-3.1-70b-versatile')
  .action(async (question, options) => {
    const config = await loadConfig();
    const client = new GroqClient(config.apiKey);
    const spinner = ora('Thinking...').start();

    try {
      const response = await client.chat({
        model: options.model,
        messages: [{ role: 'user', content: question }],
        stream: false,
      });

      spinner.stop();
      const chatResponse = response as any;
      const content = chatResponse.choices[0]?.message?.content || '';
      console.log(marked(content));
    } catch (error) {
      spinner.fail('Error occurred');
      console.error(chalk.red('Error:'), error);
    }
  });

program
  .command('search <query>')
  .description('Search the web using Groq compound model')
  .option('-m, --model <model>', 'Model to use', 'compound-beta')
  .action(async (query, options) => {
    const config = await loadConfig();
    const client = new GroqClient(config.apiKey);
    const spinner = ora('Searching...').start();

    try {
      const response = await client.chat({
        model: options.model,
        messages: [{ 
          role: 'user', 
          content: `Search the web for: ${query}\n\nProvide a comprehensive answer based on current web information.`
        }],
        stream: false,
      });

      spinner.stop();
      const chatResponse = response as any;
      const content = chatResponse.choices[0]?.message?.content || '';
      console.log(marked(content));
    } catch (error) {
      spinner.fail('Search failed');
      console.error(chalk.red('Error:'), error);
    }
  });

program
  .command('models')
  .description('List available models')
  .action(async () => {
    const config = await loadConfig();
    const client = new GroqClient(config.apiKey);
    const spinner = ora('Fetching models...').start();

    try {
      const models = await client.listModels();
      spinner.stop();
      
      console.log(chalk.cyan('Available Models:'));
      models.forEach((model: any) => {
        console.log(`- ${chalk.green(model.id)}: ${model.description || 'No description'}`);
      });
    } catch (error) {
      spinner.fail('Error fetching models');
      console.error(chalk.red('Error:'), error);
    }
  });

program.parse();