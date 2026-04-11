import os
import sys
import subprocess

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
APP_SCRIPT = os.path.join(BACKEND_DIR, "app.py")

print("--- Social Media Addiction Web Application ---")
print("We have upgraded the architecture! The backend now natively handles the database and serves the frontend.")
print(f"Starting server from {APP_SCRIPT}...")

if not os.path.exists(APP_SCRIPT):
    print("ERROR: Backend app.py not found. Please ensure the project structure is correct.")
    sys.exit(1)

# Ensure the backend directory is in the path for imports
sys.path.insert(0, BACKEND_DIR)

try:
    subprocess.Popen([sys.executable, APP_SCRIPT]).wait()
except KeyboardInterrupt:
    print("\nStopping server...")
