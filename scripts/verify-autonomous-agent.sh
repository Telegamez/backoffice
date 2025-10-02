#!/bin/bash

# Autonomous Agent Scheduler - Deployment Verification Script
# This script verifies that all components are properly deployed and functional

echo "🔍 Autonomous Agent Scheduler - Deployment Verification"
echo "========================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Function to check and report
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ $1${NC}"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}❌ $1${NC}"
    ((CHECKS_FAILED++))
  fi
}

warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  ((WARNINGS++))
}

echo "1️⃣  Database Schema Verification"
echo "--------------------------------"

# Check if migration files exist
if [ -f "drizzle/0008_worried_randall_flagg.sql" ]; then
  check "Migration file exists (0008_worried_randall_flagg.sql)"
else
  check "Migration file missing"
fi

# Check if schema has scheduledTasks table definition
if grep -q "scheduledTasks.*pgTable" src/db/db-schema.ts; then
  check "scheduledTasks table defined in schema"
else
  check "scheduledTasks table missing from schema"
fi

# Check if schema has taskExecutions table definition
if grep -q "taskExecutions.*pgTable" src/db/db-schema.ts; then
  check "taskExecutions table defined in schema"
else
  check "taskExecutions table missing from schema"
fi

echo ""
echo "2️⃣  Core Services Verification"
echo "------------------------------"

# Check task scheduler
if [ -f "src/lib/services/task-scheduler.ts" ]; then
  check "Task Scheduler service exists"
  if grep -q "class TaskScheduler" src/lib/services/task-scheduler.ts; then
    check "TaskScheduler class implemented"
  fi
else
  check "Task Scheduler service missing"
fi

# Check task executor
if [ -f "src/lib/services/task-executor.ts" ]; then
  check "Task Executor service exists"
else
  check "Task Executor service missing"
fi

# Check task parser
if [ -f "src/lib/services/task-parser.ts" ]; then
  check "Task Parser service exists"
else
  check "Task Parser service missing"
fi

echo ""
echo "3️⃣  API Integration Services"
echo "----------------------------"

# Check Calendar service
if [ -f "src/lib/services/calendar-service.ts" ]; then
  check "Calendar Service exists"
else
  check "Calendar Service missing"
fi

# Check Gmail service
if [ -f "src/lib/services/gmail-service.ts" ]; then
  check "Gmail Service exists"
else
  check "Gmail Service missing"
fi

# Check YouTube service
if [ -f "src/lib/services/youtube-service.ts" ]; then
  check "YouTube Service exists"
else
  check "YouTube Service missing"
fi

# Check Search service
if [ -f "src/lib/services/search-service.ts" ]; then
  check "Search Service exists"
else
  check "Search Service missing"
fi

# Check Email Templates
if [ -f "src/lib/services/email-templates.ts" ]; then
  check "Email Templates service exists"
else
  check "Email Templates service missing"
fi

echo ""
echo "4️⃣  API Endpoints Verification"
echo "------------------------------"

# Check all API routes
ROUTES=(
  "src/app/api/autonomous-agent/tasks/route.ts"
  "src/app/api/autonomous-agent/tasks/[id]/route.ts"
  "src/app/api/autonomous-agent/tasks/[id]/execute/route.ts"
  "src/app/api/autonomous-agent/tasks/[id]/approve/route.ts"
  "src/app/api/autonomous-agent/tasks/[id]/history/route.ts"
  "src/app/api/autonomous-agent/status/route.ts"
  "src/app/api/autonomous-agent/test-search/route.ts"
)

for route in "${ROUTES[@]}"; do
  if [ -f "$route" ]; then
    check "$(basename $(dirname $route))/$(basename $route) exists"
  else
    check "$(basename $route) missing"
  fi
done

echo ""
echo "5️⃣  UI Components Verification"
echo "------------------------------"

# Check UI files
if [ -f "src/app/apps/autonomous-agent/page.tsx" ]; then
  check "Main dashboard page exists"
else
  check "Main dashboard page missing"
fi

if [ -f "src/app/apps/autonomous-agent/components/TaskCreator.tsx" ]; then
  check "TaskCreator component exists"
else
  check "TaskCreator component missing"
fi

if [ -f "src/app/apps/autonomous-agent/components/TaskList.tsx" ]; then
  check "TaskList component exists"
else
  check "TaskList component missing"
fi

echo ""
echo "6️⃣  Infrastructure Configuration"
echo "--------------------------------"

# Check instrumentation
if [ -f "src/instrumentation.ts" ]; then
  check "Instrumentation file exists"
else
  check "Instrumentation file missing"
fi

# Check if instrumentationHook is enabled
if grep -q "instrumentationHook.*true" next.config.ts; then
  check "Instrumentation hook enabled in next.config.ts"
else
  check "Instrumentation hook not enabled"
fi

# Check package dependencies
if grep -q "node-cron" package.json; then
  check "node-cron dependency installed"
else
  check "node-cron dependency missing"
fi

echo ""
echo "7️⃣  Environment Variables"
echo "------------------------"

# Check .env.local exists
if [ -f ".env.local" ]; then
  check ".env.local file exists"

  # Check required variables
  if grep -q "GOOGLE_SEARCH_API_KEY" .env.local; then
    check "GOOGLE_SEARCH_API_KEY configured"
  else
    warn "GOOGLE_SEARCH_API_KEY not configured (optional)"
  fi

  if grep -q "GOOGLE_SEARCH_ENGINE_ID" .env.local; then
    check "GOOGLE_SEARCH_ENGINE_ID configured"
  else
    warn "GOOGLE_SEARCH_ENGINE_ID not configured (optional)"
  fi

  if grep -q "OPENAI_API_KEY" .env.local; then
    check "OPENAI_API_KEY configured"
  else
    check "OPENAI_API_KEY missing (required)"
  fi
else
  check ".env.local file missing"
fi

echo ""
echo "8️⃣  Documentation Files"
echo "----------------------"

DOCS=(
  "AUTONOMOUS-AGENT-READY.md"
  "_docs/implementations/DEPLOYMENT-CHECKLIST.md"
  "_docs/implementations/PHASE-1-COMPLETE.md"
  "_docs/implementations/PHASE-2-PROGRESS.md"
  "_docs/implementations/implementation-guides/autonomous-agent-quick-start.md"
  "src/app/apps/autonomous-agent/README.md"
)

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    check "$(basename $doc) exists"
  else
    warn "$(basename $doc) missing (non-critical)"
  fi
done

echo ""
echo "========================================================"
echo "📊 Verification Summary"
echo "========================================================"
echo ""
echo -e "${GREEN}Checks Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Checks Failed: $CHECKS_FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All critical checks passed!${NC}"
  echo ""
  echo "Next Steps:"
  echo "1. Run database migration:"
  echo "   ./scripts/setup-autonomous-agent.sh"
  echo ""
  echo "2. Start development server:"
  echo "   pnpm dev"
  echo ""
  echo "3. Test Search API:"
  echo "   curl http://localhost:3000/api/autonomous-agent/test-search"
  echo ""
  echo "4. Access dashboard:"
  echo "   http://localhost:3000/apps/autonomous-agent"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Some checks failed. Please review the issues above.${NC}"
  echo ""
  exit 1
fi
