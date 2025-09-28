import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DB_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
CRON_SECONDS = int(os.getenv("CRON_SECONDS", "60"))
