from fastapi import FastAPI
from routers import users, nodes, images, links, memories

app = FastAPI()

app.include_router(users.router)
app.include_router(images.router)
app.include_router(nodes.router)
app.include_router(links.router)
app.include_router(memories.router)