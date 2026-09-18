# Drizzle baseline

`0000_ambitious_spacker_dave.sql` is a baseline for a new Neon database. It
matches the pre-existing Alembic schema: table names, columns, JSON fields,
string UUIDs, foreign keys, and booking slot constraint are intentionally
unchanged.

Do not apply this initial migration to a database already created by the
legacy FastAPI/Alembic application. Mark that database as baselined in the
deployment workflow, then use Drizzle migrations generated after this file for
intentional schema changes only. No database DDL is required for the runtime
migration itself.
