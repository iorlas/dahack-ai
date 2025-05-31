# Database Migrations

This directory contains SQL migration files that are automatically run when starting the application with docker-compose.

## How it works

1. When `docker-compose up` is run, the `migrate` service starts first
2. It waits for the database to be ready
3. It runs all `.sql` files in this directory in alphabetical order
4. Each migration is tracked in the `_sql_migrations` table to prevent re-running
5. Only after migrations complete successfully does the API service start

## Creating new migrations

1. Create a new `.sql` file in this directory
2. Name it with a timestamp prefix for proper ordering: `YYYYMMDD_HH_description.sql`
   - Example: `20240101_01_create_users_table.sql`
3. Write your SQL migration
4. The migration will run automatically on next `docker-compose up`

## Migration format

Each `.sql` file should contain valid PostgreSQL SQL statements. The entire file is executed within a transaction, so if any part fails, the whole migration is rolled back.

Example migration:
```sql
-- 20240101_01_create_users_table.sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
```

## Manual migration execution

To run migrations manually:
```bash
cd api
python run_migrations.py
```

## Checking migration status

Connect to the database and query:
```sql
SELECT * FROM _sql_migrations ORDER BY applied_at;
```

## Best practices

1. Always test migrations locally first
2. Keep migrations small and focused
3. Never modify existing migration files
4. Use descriptive names
5. Include both UP operations (create/alter) in the file
6. For complex migrations, add comments explaining the changes 