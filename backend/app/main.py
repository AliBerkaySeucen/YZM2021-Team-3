from fastapi import FastAPI
from routers import users, nodes, images, links, memories

app = FastAPI(
    title="SWE Project API",
    description="FastAPI backend with Supabase integration",
    version="1.0.0"
)

app.include_router(users.router)
app.include_router(images.router)
app.include_router(nodes.router)
app.include_router(links.router)
app.include_router(memories.router)

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker and monitoring"""
    return {"status": "healthy", "service": "swe-project-backend"}