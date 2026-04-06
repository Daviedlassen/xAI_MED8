import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your routers
from backend.routers.fruits import router as fruits_router
from backend.routers.ml_processor import router as ml_router

app = FastAPI(title="P8Project API", debug=True)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the Routers
app.include_router(fruits_router)
app.include_router(ml_router)

@app.get("/")
def root():
    return {"message": "Welcome to the P8Project API. Head to /docs for the interactive UI."}

if __name__ == "__main__":
    # Note: Using "main:app" string allows the --reload feature to work properly
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)