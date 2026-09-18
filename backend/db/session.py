from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from core.config import database_url


class Base(DeclarativeBase):
    pass


connect_args = {"check_same_thread": False} if database_url().startswith("sqlite") else {}
engine = create_engine(database_url(), pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
