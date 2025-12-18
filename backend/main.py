import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, family, calendar, admin, messaging, expenses, activity, documents, support
from database import db

app = FastAPI()

# Middleware to log incoming connection origins (Debug)
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Scope, Receive, Send

class LogOriginMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] in ("http", "websocket"):
            headers = dict(scope.get("headers", []))
            origin = headers.get(b"origin", b"").decode("utf-8")
            client = scope.get("client")
            print(f"[Middleware] Incoming {scope['type']} connection from {client} | Origin: {origin}")
        await self.app(scope, receive, send)

app.add_middleware(LogOriginMiddleware)

# CORS middleware must be added BEFORE including routers
app.add_middleware(
    CORSMiddleware,
    # Allow all origins using regex to support credentials
    allow_origin_regex=".*", # Temporarily allow EVERYTHING to rule out regex issues
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

db_connection_status = "successful" if db is not None else "failed"

# Include routers AFTER middleware
try:
    app.include_router(auth.router)
    app.include_router(family.router)
    app.include_router(calendar.router)
    app.include_router(admin.router)
    app.include_router(messaging.router)
    app.include_router(expenses.router)
    app.include_router(activity.router)
    app.include_router(documents.router)
    app.include_router(support.router)
    print("[INFO] All routers included successfully")
except Exception as e:
    print(f"[ERROR] Failed to include routers: {e}")
    import traceback
    traceback.print_exc()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Bridge-it API"}

@app.get("/healthz")
def health_check():
    return {"status": "ok", "db_connection": db_connection_status}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False,
        proxy_headers=True,
        forwarded_allow_ips="*",
    )