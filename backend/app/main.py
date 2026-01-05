from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users, nodes, images, links

app = FastAPI(
    title="MemoLink API",
    description="Backend API for MemoLink - Memory Graph Application",
    version="1.0.0"
)

# Configure CORS - Allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://memolink-app.vercel.app",
        "https://memolink-front-five.vercel.app",
        "https://memolink-rv0e.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)
app.include_router(images.router)
app.include_router(nodes.router)
app.include_router(links.router)

@app.get("/")
@app.head("/")
async def root():
    """Root endpoint - API status check"""
    return {
        "message": "MemoLink API is running",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
@app.head("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy"}