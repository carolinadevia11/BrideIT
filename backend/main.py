from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, family, calendar, admin, messaging, expenses, activity
from database import db

app = FastAPI()

# CORS middleware must be added BEFORE including routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5137", 
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5137",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

db_connection_status = "successful" if db is not None else "failed"

# Include routers AFTER middleware
app.include_router(auth.router)
app.include_router(family.router)
app.include_router(calendar.router)
app.include_router(admin.router)
app.include_router(messaging.router)
app.include_router(expenses.router)
app.include_router(activity.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Family App API"}

@app.get("/healthz")
def health_check():
    return {"status": "ok", "db_connection": db_connection_status}