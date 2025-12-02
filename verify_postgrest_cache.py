#!/usr/bin/env python3
"""
PostgREST Cache Verification Tool
Helps verify if the schema cache has been refreshed after Pause/Resume
"""

import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path("Frontend/.env.local")
if env_path.exists():
    load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}  {text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.RESET}\n")

def check_env_variables():
    """Check if Supabase credentials are configured"""
    print_header("Checking Environment Variables")
    
    if not SUPABASE_URL:
        print(f"{Colors.RED}❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local{Colors.RESET}")
        return False
    
    if not SUPABASE_ANON_KEY:
        print(f"{Colors.RED}❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local{Colors.RESET}")
        return False
    
    print(f"{Colors.GREEN}✅ Supabase URL configured:{Colors.RESET}")
    print(f"   {SUPABASE_URL}")
    print(f"{Colors.GREEN}✅ Supabase anon key configured{Colors.RESET}")
    
    return True

def check_schema_cache():
    """Check if PostgREST can see the new columns"""
    print_header("Checking PostgREST Schema Cache")
    
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print(f"{Colors.RED}❌ Cannot check schema without credentials{Colors.RESET}")
        return False
    
    try:
        # Test if we can fetch profiles with the expected columns
        url = f"{SUPABASE_URL}/rest/v1/profiles?limit=1&select=id,full_name,company,job_title,years_experience"
        
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Accept": "application/json",
        }
        
        print(f"Testing: {Colors.CYAN}{url}{Colors.RESET}\n")
        
        response = requests.get(url, headers=headers, timeout=5)
        
        print(f"Response status: {Colors.BLUE}{response.status_code}{Colors.RESET}")
        
        if response.status_code == 200:
            print(f"{Colors.GREEN}✅ Successfully queried profiles table{Colors.RESET}")
            
            data = response.json()
            if data:
                print(f"\n{Colors.GREEN}✅ Schema cache HAS been refreshed!{Colors.RESET}")
                print(f"Sample profile record:")
                print(f"  {Colors.CYAN}id:{Colors.RESET} {data[0].get('id')}")
                print(f"  {Colors.CYAN}full_name:{Colors.RESET} {data[0].get('full_name')}")
                print(f"  {Colors.CYAN}company:{Colors.RESET} {data[0].get('company', 'NULL')}")
                print(f"  {Colors.CYAN}job_title:{Colors.RESET} {data[0].get('job_title', 'NULL')}")
                print(f"  {Colors.CYAN}years_experience:{Colors.RESET} {data[0].get('years_experience', 'NULL')}")
                
                # Check which fields are available
                print(f"\n{Colors.BOLD}Field Availability:{Colors.RESET}")
                fields_to_check = ['company', 'job_title', 'years_experience', 'industry', 'current_salary']
                all_available = True
                for field in fields_to_check:
                    has_field = field in data[0]
                    status = f"{Colors.GREEN}✅ Available{Colors.RESET}" if has_field else f"{Colors.YELLOW}⚠️  Not yet visible{Colors.RESET}"
                    print(f"  {field}: {status}")
                    if not has_field:
                        all_available = False
                
                return all_available
            else:
                print(f"{Colors.YELLOW}⚠️  No profiles found (create one first){Colors.RESET}")
                return None
        
        elif response.status_code == 400:
            error_msg = response.text
            if "undefined" in error_msg.lower() or "column" in error_msg.lower():
                print(f"{Colors.RED}❌ Schema cache NOT refreshed yet{Colors.RESET}")
                print(f"Error: {Colors.YELLOW}{error_msg[:100]}{Colors.RESET}")
                return False
            else:
                print(f"{Colors.YELLOW}⚠️  Unexpected error: {error_msg[:100]}{Colors.RESET}")
                return None
        
        elif response.status_code == 401:
            print(f"{Colors.RED}❌ Authentication failed (wrong anon key?){Colors.RESET}")
            return False
        
        else:
            print(f"{Colors.YELLOW}⚠️  Unexpected status code: {response.status_code}{Colors.RESET}")
            print(f"Response: {response.text[:200]}")
            return None
    
    except requests.exceptions.Timeout:
        print(f"{Colors.RED}❌ Request timeout (Supabase not reachable){Colors.RESET}")
        return False
    
    except Exception as e:
        print(f"{Colors.RED}❌ Error: {str(e)}{Colors.RESET}")
        return False

def show_next_steps(result):
    """Show next steps based on result"""
    print_header("Next Steps")
    
    if result is True:
        print(f"{Colors.GREEN}{Colors.BOLD}✅ EXCELLENT! Schema cache has been refreshed!{Colors.RESET}\n")
        print("Now you need to:")
        print(f"1. {Colors.CYAN}Uncomment the new fields{Colors.RESET} in Frontend/app/profile/page.tsx (line ~645)")
        print(f"2. {Colors.CYAN}Hard refresh your browser{Colors.RESET}: Ctrl + Shift + R")
        print(f"3. {Colors.CYAN}Test profile save{Colors.RESET} with company, job title, etc.")
        print()
    
    elif result is False:
        print(f"{Colors.RED}{Colors.BOLD}❌ Schema cache still NOT refreshed{Colors.RESET}\n")
        print("Follow these steps to refresh it:")
        print(f"1. Go to {Colors.CYAN}Supabase Dashboard{Colors.RESET} → Your Project")
        print(f"2. Click {Colors.CYAN}⚙️ Project Settings{Colors.RESET} (bottom left)")
        print(f"3. Click {{Colors.CYAN}}\"General\"{{Colors.RESET}} tab")
        print(f"4. Scroll to bottom → Click {{Colors.CYAN}}\"Pause project\"{{Colors.RESET}}")
        print(f"   Wait ~30 seconds...")
        print(f"5. Click {{Colors.CYAN}}\"Unpause project\"{{Colors.RESET}}")
        print(f"   Wait ~2 minutes for full restart")
        print(f"6. Run this script again to verify")
        print()
    
    else:
        print(f"{Colors.YELLOW}{Colors.BOLD}⚠️  Could not determine status{Colors.RESET}\n")
        print("Possible causes:")
        print(f"• No profiles created yet (create one in the app first)")
        print(f"• Network connectivity issue")
        print(f"• Supabase project offline")
        print()

def main():
    print(f"\n{Colors.BOLD}{Colors.CYAN}")
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║         PostgREST Schema Cache Verification Tool                  ║")
    print("║  Checks if new columns are visible to the Supabase API layer     ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.RESET}")
    
    # Step 1: Check environment
    if not check_env_variables():
        print(f"\n{Colors.RED}Cannot proceed without Supabase credentials.{Colors.RESET}")
        return
    
    # Step 2: Check schema cache
    result = check_schema_cache()
    
    # Step 3: Show next steps
    show_next_steps(result)
    
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.RESET}\n")

if __name__ == "__main__":
    main()
