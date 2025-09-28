#!/bin/bash

# Bitmax AI Server Startup Script

echo "🚀 Starting Bitmax AI Server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating example..."
    cat > .env << EOF
# Database Configuration
DB_URL=sqlite:///./bitmax_ai.db

# OpenAI API Key (optional, for MCP integration)
OPENAI_API_KEY=your_openai_api_key_here

# Cron job interval in seconds
CRON_SECONDS=60
EOF
    echo "📝 Please edit .env file with your configuration"
fi

# Start the server
echo "🌟 Starting FastAPI server..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 9000