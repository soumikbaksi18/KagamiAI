@echo off

REM Bitmax AI Server Startup Script for Windows

echo 🚀 Starting Bitmax AI Server...

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  No .env file found. Creating example...
    (
        echo # Database Configuration
        echo DB_URL=sqlite:///./bitmax_ai.db
        echo.
        echo # OpenAI API Key ^(optional, for MCP integration^)
        echo OPENAI_API_KEY=your_openai_api_key_here
        echo.
        echo # Cron job interval in seconds
        echo CRON_SECONDS=60
    ) > .env
    echo 📝 Please edit .env file with your configuration
)

REM Start the server
echo 🌟 Starting FastAPI server...
uvicorn app.main:app --reload --host 0.0.0.0 --port 9000

pause
