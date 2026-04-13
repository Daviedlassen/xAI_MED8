import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import os
import threading

# Import your routers
from backend.routers import ml_processor
from backend.routers.fruits import router as fruits_router
from backend.routers.ml_processor import router as ml_router

print(f"📍 DEBUG: Backend is loading ML logic from: {ml_processor.__file__}")

app = FastAPI(title="P8Project API", debug=True)

# --- FRONTEND AUTO-LAUNCHER ---
def run_frontend():
    """Function to start the React dev server in a separate thread."""
    # Since main.py is in /backend, we go up one level to reach the root, then into /frontend
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frontend_path = os.path.join(base_dir, "frontend")

    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"

    # Check if node_modules exists, if not, try to install
    if not os.path.exists(os.path.join(frontend_path, "node_modules")):
        print("📦 First time setup: Installing frontend dependencies...")
        subprocess.run([npm_cmd, "install"], cwd=frontend_path, shell=(os.name == "nt"))

    print("🚀 Launching Frontend (Vite)...")
    # Using 'shell=True' on Windows helps with npm commands
    subprocess.Popen([npm_cmd, "run", "dev"], cwd=frontend_path, shell=(os.name == "nt"))

@app.on_event("startup")
async def startup_event():
    """This runs even if PyCharm bypasses the __main__ block."""
    threading.Thread(target=run_frontend, daemon=True).start()

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include the Routers ---
app.include_router(fruits_router)
app.include_router(ml_router)
app.include_router(ml_processor.router)

@app.get("/")
def root():
    return {"message": "Welcome to the P8Project API. Head to /docs for the interactive UI."}

if __name__ == "__main__":
    # Note: If running via PyCharm's FastAPI runner, this block might be ignored,
    # which is why we added the @app.on_event("startup") above.
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)