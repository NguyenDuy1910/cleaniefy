from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import router
from backend.core.config import is_local_database
from backend.db.session import Base, engine
from backend.seed import seed_demo_data


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Local demo mode is zero-config; hosted PostgreSQL is migrated with Alembic before deploy.
    if is_local_database():
        Base.metadata.create_all(engine)
        seed_demo_data()
    yield


app = FastAPI(title="Cleanie API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])
app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok"}
