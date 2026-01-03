import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: Optional[str] = os.environ.get("SUPABASE_URL")
key: Optional[str] = os.environ.get("SUPABASE_KEY")

# Initialize Supabase client with error handling
supabase: Optional[Client] = None
if url and key:
    try:
        supabase = create_client(url, key)
    except Exception as e:
        print(f"Warning: Failed to initialize Supabase client: {e}")
        print("The application will start but database operations will fail.")
