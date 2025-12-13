import os
from dotenv import load_dotenv
from supabase import create_client

# 1. Load secrets
load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

print(f"🔌 Connecting to: {url}")
supabase = create_client(url, key)

try:
    # 2. Try to insert WITHOUT password_hash first
    # This tests if the TABLE itself is working.
    print("\n--- TEST 1: Minimal Insert (No password_hash) ---")
    test_user = {
        "email": "debug_test@example.com",
        "first_name": "debug_user" 
        # Add other REQUIRED columns here if you have them (e.g. first_name)
    }
    
    # We use 'upsert' so we don't crash on duplicate emails
    response = supabase.table("users").upsert(test_user).execute()
    print("✅ Minimal Insert: SUCCESS")
    print("   (The table exists and is writable)")

    # 3. Check what columns exist in the returned data
    print("\n--- TEST 2: Column Visibility ---")
    # Retrieve the row we just made
    data = supabase.table("users").select("*").eq("email", "debug_test@example.com").execute()
    
    if data.data:
        row = data.data[0]
        print(f"👀 Columns visible to API: {list(row.keys())}")
        
        if "password_hash" in row:
            print("🎉 'password_hash' IS found! The issue is likely a typo in your Pydantic model.")
        else:
            print("❌ 'password_hash' is MISSING from the response.")
            print("   👉 Check: Did you add it to 'public.users' or 'auth.users'?")
            print("   👉 Check: Is Row Level Security (RLS) blocking you from seeing it?")
    else:
        print("⚠️ Could not fetch the inserted row.")

except Exception as e:
    print(f"\n❌ FATAL ERROR: {e}")