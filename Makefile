.DEFAULT_GOAL := help

.PHONY: help install dev check typecheck lint test build migrate seed all

help:
	@printf '%s\n' \
		'Cleanie commands:' \
		'  make install' \
		'  make dev' \
		'  make check' \
		'  make build' \
		'  make migrate DATABASE_URL=<neon-url>' \
		'  make seed DATABASE_URL=<neon-url>'

install:
	bun install --frozen-lockfile

dev:
	bun run dev

check: typecheck lint test

typecheck:
	bun run typecheck

lint:
	bun run lint

test:
	bun run test

build:
	bun run build

migrate:
	@test -n "$(DATABASE_URL)" || (printf '%s\n' 'DATABASE_URL is required.' >&2; exit 1)
	DATABASE_URL="$(DATABASE_URL)" bun run db:migrate

seed:
	@test -n "$(DATABASE_URL)" || (printf '%s\n' 'DATABASE_URL is required.' >&2; exit 1)
	DATABASE_URL="$(DATABASE_URL)" bun run db:seed

all: install check build
