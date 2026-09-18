.DEFAULT_GOAL := help

.PHONY: help install install-frontend install-backend dev dev-frontend dev-backend check typecheck lint test test-frontend test-backend build migrate migration-status all

help:
	@printf '%s\n' \
		'Cleanie commands:' \
		'  make install            Install Bun and uv dependencies' \
		'  make dev                Start the FastAPI and Next.js services together' \
		'  make check              Run type checks, linting, and tests' \
		'  make build              Create the production frontend build' \
		'  make all                Install, verify, and build everything' \
		'  make migrate NEON_DATABASE_URL=<neon-url>' \
		'                          Apply Alembic migrations to Neon' \
		'  make migration-status NEON_DATABASE_URL=<neon-url>'

install: install-frontend install-backend

install-frontend:
	cd frontend && bun install --frozen-lockfile

install-backend:
	cd backend && uv sync --locked

dev:
	@set -e; \
	trap 'kill "$$backend_pid" "$$frontend_pid" 2>/dev/null || true' EXIT INT TERM; \
	(cd backend && uv run uvicorn main:app --reload --port 8000) & backend_pid=$$!; \
	(cd frontend && BACKEND_INTERNAL_URL=http://127.0.0.1:8000 bun run dev) & frontend_pid=$$!; \
	wait $$backend_pid $$frontend_pid

dev-frontend:
	cd frontend && BACKEND_INTERNAL_URL=http://127.0.0.1:8000 bun run dev

dev-backend:
	cd backend && uv run uvicorn main:app --reload --port 8000

check: typecheck lint test

typecheck:
	cd frontend && bun run typecheck

lint:
	cd frontend && bun run lint

test: test-frontend test-backend

test-frontend:
	cd frontend && bun run test -- --passWithNoTests

test-backend:
	cd backend && uv run pytest -q

build:
	cd frontend && bun run build

all: install check build

migrate:
	@test -n "$(DATABASE_URL)$(NEON_DATABASE_URL)" || (printf '%s\n' 'DATABASE_URL or NEON_DATABASE_URL is required (use the Neon connection string).' >&2; exit 1)
	cd backend && DATABASE_URL="$(DATABASE_URL)" NEON_DATABASE_URL="$(NEON_DATABASE_URL)" uv run alembic upgrade head

migration-status:
	@test -n "$(DATABASE_URL)$(NEON_DATABASE_URL)" || (printf '%s\n' 'DATABASE_URL or NEON_DATABASE_URL is required (use the Neon connection string).' >&2; exit 1)
	cd backend && DATABASE_URL="$(DATABASE_URL)" NEON_DATABASE_URL="$(NEON_DATABASE_URL)" uv run alembic current
