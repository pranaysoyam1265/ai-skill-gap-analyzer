"""
Run the FastAPI server with error handling and diagnostics
"""
import uvicorn
import sys
import os
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

def check_dependencies():
    """Check if all required dependencies are installed"""
    required_modules = [
        ("fastapi", "FastAPI"),
        ("uvicorn", "Uvicorn"),
        ("pydantic", "Pydantic"),
        ("pydantic", "pydantic[email]"),
        ("email_validator", "email-validator"),
        ("dotenv", "python-dotenv"),
        ("sqlalchemy", "SQLAlchemy"),
        ("asyncpg", "asyncpg"),
        ("psycopg2", "psycopg2-binary"),
        ("pdfplumber", "pdfplumber"),
        ("docx", "python-docx"),
        ("spacy", "spacy"),
        ("pandas", "pandas"),
        ("numpy", "numpy"),
    ]
    
    missing = []
    for module_name, display_name in required_modules:
        try:
            __import__(module_name)
        except ImportError:
            missing.append(display_name)
    
    if missing:
        print(f"""
❌ Missing dependencies detected!

The following packages are required but not installed:
  {', '.join(missing)}

Install them with:
  pip install -r requirements.txt

Or install individually:
  pip install {' '.join([m.lower().replace('[', '').replace(']', '') for m in missing])}
        """)
        return False
    
    return True

def check_environment():
    """Check if .env file exists and has required variables"""
    env_file = Path(__file__).parent / ".env"
    
    if not env_file.exists():
        print(f"""
⚠️  .env file not found!

Create a .env file in the Backend directory with:

# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here
POSTGRES_HOST=your-project.supabase.co
POSTGRES_PORT=5432
POSTGRES_DB=postgres

# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=true
PROJECT_NAME=SkillMatch AI Backend
VERSION=1.0.0

Get your Supabase credentials from:
  https://app.supabase.com → Your Project → Settings → Database
        """)
        return False
    
    return True

def main():
    """Main function to start the server"""
    import sys
    import io
    # Fix encoding for Windows console
    if sys.stdout.encoding != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    print("""
╔══════════════════════════════════════════════════════════╗
║   🚀 Starting SkillMatch AI Backend Server...           ║
╚══════════════════════════════════════════════════════════╝
    """)
    
    # Check dependencies
    print("📦 Checking dependencies...")
    if not check_dependencies():
        print("\n❌ Please install missing dependencies and try again.")
        return False
    print("   ✅ All dependencies installed\n")
    
    # Check environment
    print("🔧 Checking configuration...")
    if not check_environment():
        print("\n❌ Please create .env file with required variables.")
        return False
    print("   ✅ Configuration loaded\n")
    
    # Load configuration
    try:
        from app.core.config import settings
    except Exception as e:
        print(f"""
❌ Failed to load configuration!

Error: {e}

Make sure:
  1. .env file exists with all required variables
  2. All environment variables are properly formatted
  3. No special characters in passwords without quotes
        """)
        return False
    
    print(f"""
╔══════════════════════════════════════════════════════════╗
║   {settings.PROJECT_NAME:^52} ║
║   Version: {settings.VERSION:^45} ║
╠══════════════════════════════════════════════════════════╣
║   🌐 Server: http://{settings.SERVER_HOST}:{settings.SERVER_PORT:<5}                      ║
║   📚 Docs:   http://{settings.SERVER_HOST}:{settings.SERVER_PORT:<5}/docs                 ║
║   🔄 Redoc:  http://{settings.SERVER_HOST}:{settings.SERVER_PORT:<5}/redoc                ║
║   🐛 Debug:  {str(settings.DEBUG).ljust(47)} ║
╚══════════════════════════════════════════════════════════╝

📝 Press CTRL+C to stop the server

    """)
    
    try:
        uvicorn.run(
            "app.main:app",
            host=settings.SERVER_HOST,
            port=settings.SERVER_PORT,
            reload=settings.DEBUG,
            log_level="info"
        )
        return True
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped by user")
        return True
    except Exception as e:
        print(f"""
❌ Server failed to start!

Error: {type(e).__name__}: {e}

Common issues:
  1. Port {settings.SERVER_PORT} is already in use
     → Change SERVER_PORT in .env
  
  2. Database connection failed
     → Check POSTGRES_* variables in .env
     → Verify Supabase project is running
     → Run: python test_db_queries.py
  
  3. Missing module imports
     → Run: pip install -r requirements.txt
        """)
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
