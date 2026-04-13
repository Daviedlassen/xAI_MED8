from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Import the router from your other file
from backend.routers.ml_processor import router as ml_router

app = FastAPI(title="P8Project API", debug=True)

# --- 1. ENABLE CORS (Fixes the OPTIONS 404 error) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows React (5173) to talk to FastAPI (8000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. REGISTER THE ROUTER ---
# This "attaches" the ML logic to your main app
app.include_router(ml_router)

@app.get("/")
def root():
    return {"message": "API is online. Go to /docs to see the ML endpoints."}