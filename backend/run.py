import subprocess
import sys
import os
import platform
import time


sys.path.append(os.path.dirname(os.path.abspath(__file__)))
def check_node_installed():
    """Checks if Node.js/npm is installed on the user's machine."""
    npm_cmd = "npm.cmd" if platform.system() == "Windows" else "npm"
    try:
        # Check if npm exists
        subprocess.run([npm_cmd, "-v"], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                       shell=(platform.system() == "Windows"))
        return npm_cmd
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ ERROR: Node.js/npm not found.")
        print("Please install Node.js from https://nodejs.org/")
        sys.exit(1)


def main():
    print("🚀 Starting xAI MED8...")

    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    # --- PATH LOGIC ---
    # Gets directory of run.py (C:/.../P8Project/backend)
    current_script_dir = os.path.dirname(os.path.abspath(__file__))
    # Jumps up to the root (C:/.../P8Project)
    root_dir = os.path.dirname(current_script_dir)

    frontend_dir = os.path.join(root_dir, "frontend")
    backend_dir = current_script_dir  # main.py is in the same folder as run.py
    req_file = os.path.join(root_dir, "requirements.txt")

    # 1. Setup Backend
    print("\n📦 Checking Python dependencies...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req_file])

    # 2. Setup Frontend
    print("\n📦 Checking React frontend dependencies...")
    npm_cmd = check_node_installed()

    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        print("📥 Installing Node modules (first time setup)...")
        subprocess.check_call([npm_cmd, "install"], cwd=frontend_dir, shell=(platform.system() == "Windows"))
    else:
        print("✅ Node modules found.")

    # 3. Launch
    print("\n🟢 Starting Servers...")
    try:
        # Start FastAPI
        # Note: we use "main:app" because we are running from the backend directory
        backend_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
            cwd=backend_dir
        )

        time.sleep(2)

        # Start Vite
        frontend_proc = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=frontend_dir,
            shell=(platform.system() == "Windows")
        )

        print("\n Operating...")
        backend_proc.wait()
        frontend_proc.wait()

    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        backend_proc.terminate()
        frontend_proc.terminate()


if __name__ == "__main__":
    main()