import asyncio
import sys
import os
from dotenv import load_dotenv

# 1. Tell Python to look inside the 'backend' folder for imports
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

# 2. Load the .env file
load_dotenv()

# 3. Now Python can successfully find config.py and your services
from config import settings
from services.ai_router import _call_gemini, _call_claude, _call_groq
import google.generativeai as genai

async def test_all_providers():
    print("🚀 Booting up AI engines for ishaa.ai...\n")
    
    # Configure Gemini
    genai.configure(api_key=settings.GOOGLE_API_KEY)
    
    # Setup a mock Socratic test prompt
    system_prompt = "You are a helpful Socratic tutor. Keep your answer to one short sentence."
    history = []
    user_message = "What happens to the resistance of a wire if you double its length?"

    # --- TEST GEMINI ---
    print("Testing Gemini 2.5 Flash...")
    try:
        res = await _call_gemini(system_prompt, history, user_message)
        print(f"✅ Success! Response: {res}\n")
    except Exception as e:
        print(f"❌ Gemini Failed: {e}\n")

    # --- TEST CLAUDE ---
    print("Testing Claude Haiku...")
    try:
        res = await _call_claude(system_prompt, history, user_message)
        print(f"✅ Success! Response: {res}\n")
    except Exception as e:
        print(f"❌ Claude Failed: {e}\n")

    # --- TEST GROQ ---
    print("Testing Groq (Llama 3.3)...")
    try:
        res = await _call_groq(system_prompt, history, user_message)
        print(f"✅ Success! Response: {res}\n")
    except Exception as e:
        print(f"❌ Groq Failed: {e}\n")

if __name__ == "__main__":
    asyncio.run(test_all_providers())