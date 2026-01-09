#!/bin/bash

# Cleanup Script - Remove Unnecessary Files
# This will remove duplicate/obsolete deployment and diagnostic scripts

set -e

echo "🧹 CLEANING UP PROJECT FILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Files to DELETE (obsolete/duplicate)
FILES_TO_DELETE=(
  # Obsolete deployment scripts (superseded by deploy-commit.sh)
  "deploy-and-fix.sh"
  "deploy-demo-complete.sh"
  "deploy-demo-final.sh"
  "deploy-demo.sh"
  "deploy-fix.sh"
  "deploy-fixes.sh"
  "deploy-github.sh"
  "deploy-ibkr-complete.sh"
  "deploy-lightspeed.sh"
  "deploy-now.sh"
  "deploy-phase2.sh"
  "deploy-visual-lines.sh"
  "deploy.sh"
  "final-deploy.sh"
  "quick-deploy-lines.sh"
  "quick-deploy.sh"
  "simple-deploy.sh"
  "DEPLOY_NOW.sh"
  
  # Obsolete fix scripts (already fixed)
  "fix-and-deploy.sh"
  "fix-app-now.sh"
  "fix-demo-routing.sh"
  "fix-ibgateway.sh"
  "fix-positions.sh"
  "DEMO_FIX_NOW.sh"
  "EMERGENCY_FIX.sh"
  
  # Obsolete diagnostic scripts (replaced by check-quick.sh)
  "diagnose-demo.sh"
  "diagnose-now.sh"
  "diagnose-orders.sh"
  "diagnose-positions.sh"
  "check-demo-status.sh"
  "check-demo-vps.sh"
  "check-logs.sh"
  "check-order-status.sh"
  "check-webhook-error.sh"
  
  # Obsolete restart scripts (replaced by restart-headless.sh)
  "restart-app-only.sh"
  "restart-auto.sh"
  "restart-everything.sh"
  "restart-vnc.sh"
  "restart-vps.sh"
  
  # Obsolete setup scripts
  "force-sync.sh"
  "revert-to-tradingview.sh"
  "setup-ssh-keys.sh"
  
  # Test scripts that are no longer needed
  "test.sh"
  "test-live-order.sh"
  
  # Obsolete documentation (superseded by better docs)
  "FIX_APP_NOW.md"
  "DEPLOY_NOW.md"
  "PHASE2_COMPLETE.md"
  "TODO_COMPLETED.md"
  "IBKR_COMPLETE.md"
  
  # Duplicate/outdated guides
  "DEMO_MODE_GUIDE.md"
)

# Count files to delete
TOTAL=${#FILES_TO_DELETE[@]}
echo "📋 Found $TOTAL obsolete files to remove"
echo ""

# Delete each file
DELETED=0
SKIPPED=0

for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    echo "  🗑️  Deleting: $file"
    rm "$file"
    DELETED=$((DELETED + 1))
  else
    SKIPPED=$((SKIPPED + 1))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Cleanup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  • Files deleted: $DELETED"
echo "  • Files already missing: $SKIPPED"
echo ""

# Show remaining useful files
echo "📁 Remaining useful files:"
echo ""
echo "🚀 Deployment:"
echo "  • deploy-commit.sh - Main deployment script"
echo ""
echo "🔍 Monitoring:"
echo "  • check-quick.sh - Quick status check"
echo "  • check-vps-status.sh - Detailed diagnostics"
echo ""
echo "🔄 Restart:"
echo "  • restart-headless.sh - Full restart with IB Gateway"
echo ""
echo "🧪 Testing:"
echo "  • test-demo-order.sh - Test demo mode"
echo "  • test-demo-ui-fix.sh - Test UI fixes"
echo ""
echo "⚙️ Setup:"
echo "  • setup-env.sh - Environment configuration"
echo "  • clear-browser-cache.sh - Browser cache help"
echo ""
echo "📚 Documentation:"
echo "  • README.md - Main documentation"
echo "  • QUICKSTART.md - Quick start guide"
echo "  • DAILY_ROUTINE.md - Daily workflow"
echo "  • DEPLOYMENT_GUIDE.md - Deployment reference"
echo "  • RESTART_GUIDE.md - Restart procedures"
echo "  • LIGHTSPEED_INTEGRATION.md - Lightspeed setup"
echo "  • FIX_IBKR_LOGIN.md - IB Gateway login help"
echo "  • DEMO_MODE_FIXED.md - Demo mode documentation"
echo "  • DEMO_UI_FIX.md - UI fix documentation"
echo ""

