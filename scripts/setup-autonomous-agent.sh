#!/bin/bash
set -e

echo "🤖 Autonomous Agent Scheduler - Setup Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check environment variables
echo "📋 Step 1: Checking environment variables..."
echo ""

MISSING_VARS=0

check_var() {
    if grep -q "^$1=" .env.local 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $1 is set"
    else
        echo -e "${RED}✗${NC} $1 is NOT set"
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
}

echo "Required variables:"
check_var "OPENAI_API_KEY"
check_var "DATABASE_URL"
check_var "GOOGLE_CLIENT_ID"
check_var "GOOGLE_CLIENT_SECRET"
check_var "NEXTAUTH_URL"
check_var "NEXTAUTH_SECRET"

echo ""
echo "Search API variables:"
check_var "GOOGLE_SEARCH_API_KEY"
check_var "GOOGLE_SEARCH_ENGINE_ID"

echo ""

if [ $MISSING_VARS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Warning: $MISSING_VARS environment variable(s) missing${NC}"
    echo "Add them to .env.local before continuing"
    echo ""
fi

# Apply database migration
echo "📦 Step 2: Applying database migration..."
echo ""
echo "Running: pnpm drizzle-kit push"
echo ""

pnpm drizzle-kit push

echo ""
echo -e "${GREEN}✓${NC} Database migration completed"
echo ""

# Check if migration was successful
echo "🔍 Step 3: Verifying database tables..."
echo ""

if grep -q "DATABASE_URL=postgresql" .env.local 2>/dev/null; then
    echo "Checking for scheduled_tasks and task_executions tables..."
    # Note: This requires psql to be installed
    if command -v psql &> /dev/null; then
        SOURCE_DB_URL=$(grep "^DATABASE_URL=" .env.local | cut -d '=' -f2-)
        TABLES=$(psql "$SOURCE_DB_URL" -t -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('scheduled_tasks', 'task_executions');" 2>/dev/null || echo "")

        if echo "$TABLES" | grep -q "scheduled_tasks" && echo "$TABLES" | grep -q "task_executions"; then
            echo -e "${GREEN}✓${NC} Tables created successfully"
        else
            echo -e "${YELLOW}⚠${NC} Could not verify tables. Check manually."
        fi
    else
        echo -e "${YELLOW}⚠${NC} psql not installed. Skipping verification."
    fi
else
    echo -e "${YELLOW}⚠${NC} DATABASE_URL not found or not PostgreSQL"
fi

echo ""

# Summary
echo "=============================================="
echo "🎉 Setup Complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo ""
echo "1. ${BLUE}Start the development server:${NC}"
echo "   pnpm dev"
echo ""
echo "2. ${BLUE}Test Search API (optional):${NC}"
echo "   curl http://localhost:3000/api/autonomous-agent/test-search"
echo ""
echo "3. ${BLUE}Check scheduler status:${NC}"
echo "   curl http://localhost:3000/api/autonomous-agent/status"
echo ""
echo "4. ${BLUE}Access the dashboard:${NC}"
echo "   http://localhost:3000/apps/autonomous-agent"
echo ""
echo "5. ${BLUE}Create your first task:${NC}"
echo "   Click 'Create New Task' and enter:"
echo "   \"Every day at 9am, email me trending AI news\""
echo ""
echo "📚 Documentation:"
echo "   - Deployment Checklist: _docs/implementations/DEPLOYMENT-CHECKLIST.md"
echo "   - Quick Start Guide: _docs/implementations/implementation-guides/autonomous-agent-quick-start.md"
echo "   - Phase 2 Progress: _docs/implementations/PHASE-2-PROGRESS.md"
echo ""
echo "🚀 Ready to go!"
echo ""
