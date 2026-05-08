# Database Migrations

This directory contains database migration scripts for the application.

## Available Migrations

### add_task_logs_table.js

Creates the `task_logs` table for storing task execution logs persistently.

**Features:**
- Creates `task_logs` table with columns: id, task_id, level, message, created_at
- Adds foreign key constraint to `tasks` table with CASCADE delete
- Creates indexes on `task_id` and `created_at` for query performance
- Includes CHECK constraint on `level` column (only accepts: 'info', 'warning', 'error')

**Usage:**

```bash
# Run migration (create table)
node migrations/add_task_logs_table.js up

# Rollback migration (drop table)
node migrations/add_task_logs_table.js down
```

**Schema:**

```sql
CREATE TABLE task_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    level TEXT NOT NULL CHECK(level IN ('info', 'warning', 'error')),
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX idx_task_logs_created_at ON task_logs(created_at);
```

## Migration Guidelines

1. **Always test migrations** in a development environment before running in production
2. **Backup the database** before running migrations in production
3. **Use transactions** for complex migrations to ensure atomicity
4. **Document rollback procedures** for each migration
5. **Test both up and down** migration functions

## Running Migrations

Migrations can be run individually using Node.js:

```bash
node migrations/<migration_name>.js up    # Apply migration
node migrations/<migration_name>.js down  # Rollback migration
```

## Migration Status

| Migration | Status | Date Applied |
|-----------|--------|--------------|
| add_task_logs_table | ✓ Applied | 2026-05-08 |
