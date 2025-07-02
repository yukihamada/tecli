import { config as dotenvConfig } from 'dotenv';
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

dotenvConfig();

export interface Config {
  apiKey: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  streamingEnabled: boolean;
}

export async function loadConfig(): Promise<Config> {
  // Load from .tecli-config first
  try {
    const envPath = join(homedir(), '.tecli-config', '.env');
    const envContent = await readFile(envPath, 'utf-8');
    const envVars = envContent.split('\n').reduce((acc, line) => {
      const [key, value] = line.split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    if (envVars.GROQ_API_KEY) {
      process.env.GROQ_API_KEY = envVars.GROQ_API_KEY;
    }
  } catch {
    // Fallback to regular .env
  }

  const defaultConfig: Config = {
    apiKey: process.env.GROQ_API_KEY || '',
    defaultModel: 'llama-3.3-70b-versatile',
    maxTokens: 4096,
    temperature: 0.7,
    streamingEnabled: true,
  };

  try {
    const configPath = join(homedir(), '.tecli', 'config.json');
    const configFile = await readFile(configPath, 'utf-8');
    const userConfig = JSON.parse(configFile);
    
    return { ...defaultConfig, ...userConfig };
  } catch {
    return defaultConfig;
  }
}

export async function saveConfig(config: Partial<Config>): Promise<void> {
  const { mkdir, writeFile } = await import('fs/promises');
  const configDir = join(homedir(), '.tecli');
  const configPath = join(configDir, 'config.json');

  await mkdir(configDir, { recursive: true });
  
  const currentConfig = await loadConfig();
  const newConfig = { ...currentConfig, ...config };
  
  await writeFile(configPath, JSON.stringify(newConfig, null, 2));
}