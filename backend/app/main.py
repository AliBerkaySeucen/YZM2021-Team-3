from fastapi import FastAPI
import os
from supabase import Client, create_client
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()
supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(supabase_url, supabase_key)

