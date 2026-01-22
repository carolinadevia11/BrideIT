import os
import sys
from dotenv import load_dotenv

# Try to load .env as the app does
print(f"Current Working Directory: {os.getcwd()}")
print(f"Python Executable: {sys.executable}")

# Simulate what database.py does
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if api_key:
    print(f"OPENAI_API_KEY found (length: {len(api_key)})")
    print(f"Key starts with: {api_key[:8]}...")
else:
    print("OPENAI_API_KEY NOT found in environment after basic load_dotenv()")

# Check if we can find it if we explicitly look in backend/.env
backend_env_path = os.path.join(os.getcwd(), 'backend', '.env')
if os.path.exists(backend_env_path):
    print(f"Found backend/.env at {backend_env_path}")
    load_dotenv(backend_env_path)
    api_key_explicit = os.getenv("OPENAI_API_KEY")
    if api_key_explicit:
         print(f"OPENAI_API_KEY found after loading backend/.env explicitly (length: {len(api_key_explicit)})")
    else:
         print("OPENAI_API_KEY NOT found even after loading backend/.env")
else:
    print(f"backend/.env NOT found at {backend_env_path}")
    # Try just .env in current dir
    env_path = os.path.join(os.getcwd(), '.env')
    if os.path.exists(env_path):
        print(f"Found .env at {env_path}")
    else:
        print(f".env NOT found at {env_path}")


# Check openai package
try:
    import openai
    print(f"openai package is installed. Version: {openai.__version__}")
except ImportError:
    print("openai package is NOT installed")
