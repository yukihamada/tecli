#!/bin/bash

set -e

echo "🚀 Installing TE - Ultra-fast AI CLI powered by Groq Cloud"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Clone repository
echo "📦 Cloning repository..."
git clone https://github.com/yukihamada/tecli.git ~/.tecli
cd ~/.tecli

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building..."
npm run build

# Create symlink
echo "🔗 Creating global command..."
npm link

# Create config directory
mkdir -p ~/.tecli-config

# Prompt for API key
echo ""
echo "✨ Almost done!"
echo ""
echo "Please get your Groq API key from: https://console.groq.com/"
echo ""
read -p "Enter your Groq API key: " GROQ_API_KEY

# Save API key to config
echo "GROQ_API_KEY=$GROQ_API_KEY" > ~/.tecli-config/.env

echo ""
echo "✅ Installation complete!"
echo ""
echo "Usage:"
echo "  te chat              - Start interactive chat"
echo "  te ask <question>    - Ask a single question"
echo "  te models            - List available models"
echo ""
echo "Try it now: te ask 'What is the capital of Japan?'"