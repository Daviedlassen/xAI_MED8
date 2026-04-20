from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ml_processor # Ensure your folder structure is correct

app = FastAPI(title="xAI MED8 API")

# Allow React to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ml_processor.router)

@app.get("/")
async def root():
    return {"message": "API is online"}

#Push