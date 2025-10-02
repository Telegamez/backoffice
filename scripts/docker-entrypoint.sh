#!/bin/sh
set -e

echo "🔧 Running database migrations..."

# Wait for database to be ready
until nc -z db 55432; do
  echo "⏳ Waiting for database..."
  sleep 1
done

# Run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  # Apply SQL migrations directly
  for migration in /app/drizzle/*.sql; do
    if [ -f "$migration" ]; then
      echo "  ➜ Applying $(basename $migration)..."
      psql "$DATABASE_URL" -f "$migration" 2>&1 | grep -v "already exists" || true
    fi
  done
  echo "✅ Database migrations complete!"
else
  echo "⚠️  DATABASE_URL not set. Skipping migrations."
fi

echo "🚀 Starting application..."
exec "$@"
