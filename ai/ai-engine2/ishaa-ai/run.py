import uvicorn
import sys
import os

# 1. Force Windows and Python to permanently recognize the backend folder
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.insert(0, backend_path)

# 2. Programmatically launch Uvicorn so child processes obey the rules
if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="127.0.0.1", 
        port=8000, 
        reload=True, 
        env_file=".env",
        reload_dirs=[backend_path] # Only watch the backend folder for changes
    )