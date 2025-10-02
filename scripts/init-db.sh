#!/bin/bash
set -e

echo "🔧 Running database migrations..."

# Apply all migrations in order
for migration in /migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo "  ➜ Applying $(basename $migration)..."
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -p "$PGPORT" < "$migration"
    fi
done

echo "✅ Database migrations complete!"
