from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import classify, duplicate, fake_detect
import uvicorn
import os
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(
    title="CivicConnect AI Service",
    description="Python FastAPI Microservice to manage AI classifications, duplicate checks, and fake complaint audits.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus instrumentation
Instrumentator().instrument(app).expose(app)

# Mount Routers
app.include_router(classify.router)
app.include_router(duplicate.router)
app.include_router(fake_detect.router)

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "CivicConnect AI Microservice",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
