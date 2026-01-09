# 📁 Project File Organization

**Last Updated:** January 9, 2026  
**Status:** ✅ Cleaned and Organized

---

## 🗂️ Project Structure

### **Source Code** (`src/`)
```
src/
├── config.ts           # App configuration
├── index.ts            # Entry point
├── logger.ts           # Logging utility
├── server.ts           # Express server setup
├── routes/             # API endpoints
│   ├── admin.ts        # Admin controls
│   ├── dashboard.ts    # Dashboard API
│   ├── desktop.ts      # Desktop UI (main interface)
│   ├── health.ts       # Health checks
│   ├── trading.ts      # Trading operations
│   ├── ui.ts           # Legacy UI
│   ├── webhook.ts      # TradingView webhooks
│   └── workspace.ts    # Workspace management
├── services/           # Business logic
│   ├── brokerRouter.ts     # Multi-broker routing
│   ├── demoClient.ts       # Demo mode client
│   ├── ibkrClient.ts       # IBKR integration
│   ├── lightspeedClient.ts # Lightspeed integration
│   ├── orderParser.ts      # Parse trade signals
│   ├── orderRouter.ts      # Build orders
│   ├── orderTracker.ts     # Track order lifecycle
│   ├── positionManager.ts  # Manage positions
│   ├── riskManager.ts      # Risk controls
│   └── stateStore.ts       # State management
└── types/              # TypeScript types
    ├── dashboard.ts    # Dashboard types
    ├── order.ts        # Order types
    └── tradingView.ts  # TradingView alert types
```

---

## 🚀 **Essential Scripts** (8 files)

### Deployment
- **`deploy-commit.sh`** - One-command deploy (git commit + push + VPS deploy)

### Monitoring
- **`check-quick.sh`** - Quick status (app, IBKR, positions, P&L)
- **`check-vps-status.sh`** - Detailed diagnostics

### Restart
- **`restart-headless.sh`** - Full restart (IB Gateway + app)

### Testing
- **`test-demo-order.sh`** - Test Demo mode order flow
- **`test-demo-ui-fix.sh`** - Test UI fixes

### Setup
- **`setup-env.sh`** - Configure environment variables
- **`clear-browser-cache.sh`** - Browser cache instructions

---

## 📚 **Documentation** (9 files)

### Getting Started
- **`README.md`** - Main project documentation
- **`QUICKSTART.md`** - 5-minute setup guide

### Daily Use
- **`DAILY_ROUTINE.md`** - Morning checklist, troubleshooting

### Deployment & Restart
- **`DEPLOYMENT_GUIDE.md`** - Deployment procedures
- **`RESTART_GUIDE.md`** - Restart procedures

### Broker Setup
- **`LIGHTSPEED_INTEGRATION.md`** - Lightspeed setup guide
- **`FIX_IBKR_LOGIN.md`** - IB Gateway login troubleshooting

### Features
- **`DEMO_MODE_FIXED.md`** - Demo mode documentation
- **`DEMO_UI_FIX.md`** - UI fix details

### This File
- **`PROJECT_FILES.md`** - File organization guide

---

## 🗑️ **Removed Files** (50 obsolete files)

**Cleaned up on January 9, 2026:**

### Duplicate Deployment Scripts (18)
- `deploy-and-fix.sh`, `deploy-demo.sh`, `deploy-fix.sh`, `deploy-fixes.sh`
- `deploy-github.sh`, `deploy-ibkr-complete.sh`, `deploy-lightspeed.sh`
- `deploy-now.sh`, `deploy-phase2.sh`, `deploy-visual-lines.sh`
- `deploy.sh`, `final-deploy.sh`, `quick-deploy.sh`, `simple-deploy.sh`
- And more...

**Replaced by:** `deploy-commit.sh` (single deployment script)

### Obsolete Fix Scripts (7)
- `fix-and-deploy.sh`, `fix-app-now.sh`, `fix-demo-routing.sh`
- `fix-ibgateway.sh`, `fix-positions.sh`, `DEMO_FIX_NOW.sh`
- `EMERGENCY_FIX.sh`

**Status:** Issues already fixed

### Duplicate Diagnostic Scripts (9)
- `diagnose-demo.sh`, `diagnose-now.sh`, `diagnose-orders.sh`
- `check-demo-status.sh`, `check-demo-vps.sh`, `check-logs.sh`
- And more...

**Replaced by:** `check-quick.sh` and `check-vps-status.sh`

### Obsolete Restart Scripts (5)
- `restart-app-only.sh`, `restart-auto.sh`, `restart-everything.sh`
- `restart-vnc.sh`, `restart-vps.sh`

**Replaced by:** `restart-headless.sh`

### Obsolete Documentation (6)
- `FIX_APP_NOW.md`, `DEPLOY_NOW.md`, `PHASE2_COMPLETE.md`
- `TODO_COMPLETED.md`, `IBKR_COMPLETE.md`, `DEMO_MODE_GUIDE.md`

**Replaced by:** Comprehensive guides (DEMO_MODE_FIXED.md, etc.)

### Other (5)
- `force-sync.sh`, `revert-to-tradingview.sh`, `setup-ssh-keys.sh`
- `test.sh`, `test-live-order.sh`

---

## 📊 **File Count Summary**

| Category | Before | After | Removed |
|----------|--------|-------|---------|
| **Shell Scripts** | 52 | 8 | 44 |
| **Documentation** | 15 | 10 | 5 |
| **Source Files** | 21 | 21 | 0 |
| **Config Files** | 4 | 4 | 0 |
| **Total** | 92 | 43 | 49 |

**Result:** 53% reduction in file count! 🎉

---

## 🎯 **Quick Reference**

### Deploy Changes
```bash
./deploy-commit.sh
```

### Check Status
```bash
./check-quick.sh
```

### Restart Everything
```bash
./restart-headless.sh
```

### Test Demo Mode
```bash
./test-demo-order.sh
```

### Setup Environment
```bash
./setup-env.sh
```

---

## 🔍 **Finding Files**

### By Purpose

**Want to deploy?**
→ `deploy-commit.sh`

**Want to check if everything's working?**
→ `check-quick.sh`

**Want to restart?**
→ `restart-headless.sh`

**Want to test?**
→ `test-demo-order.sh` or `test-demo-ui-fix.sh`

**Want to learn?**
→ `README.md` or `QUICKSTART.md`

**Having issues?**
→ `DAILY_ROUTINE.md` (troubleshooting section)

---

## 🧹 **Maintenance**

### If you create new scripts:
1. Give them clear, descriptive names
2. Add them to this document
3. Remove old versions
4. Keep only ONE script per task

### If you create new docs:
1. Update this file
2. Remove obsolete docs
3. Cross-reference related docs

---

## ✅ **Clean Project Benefits**

- 🎯 **Easier to find** the right script
- 🚀 **Faster onboarding** for new users
- 🧹 **Less confusion** about which file to use
- 📦 **Smaller repo** size
- 🔍 **Better Git history** (fewer duplicate changes)

---

**Last cleanup:** January 9, 2026  
**Files removed:** 50  
**Current file count:** 43 essential files

---

✨ **Your project is now clean and organized!**

