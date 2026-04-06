from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

# Define your schemas here
class Fruit(BaseModel):
    name: str

class Fruits(BaseModel):
    fruits: List[Fruit]

router = APIRouter(
    prefix="/fruits",
    tags=["Fruits"]
)

# Your in-memory database
memory_db = {"fruits": []}

@router.get("/", response_model=Fruits)
def get_fruits():
    return Fruits(fruits=memory_db["fruits"])

@router.post("/")
def add_fruit(fruit: Fruit):
    memory_db["fruits"].append(fruit)
    return fruit