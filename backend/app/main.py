from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users, nodes, images, links

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Add production URL when deployed
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(images.router)
app.include_router(nodes.router)
app.include_router(links.router)

@app.get("/")
async def root():
    return {"message": "MemoLink API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}