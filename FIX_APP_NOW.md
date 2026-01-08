# 🚨 APP NOT RUNNING - QUICK FIX GUIDE

## MANUAL STEPS TO FIX:

### Step 1: SSH into VPS
```bash
ssh root@165.227.104.40
```

### Step 2: Check PM2 Status
```bash
pm2 list
pm2 logs trading-app --lines 50
```

### Step 3: Navigate to App Directory
```bash
cd /root/trading-app
```

### Step 4: Check for Errors
```bash
# Look for build errors
cat logs/error.log 2>/dev/null || echo "No error log"

# Check if dist exists
ls -la dist/ | head -10
```

### Step 5: Rebuild App
```bash
# Stop app
pm2 delete trading-app

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Clean build
rm -rf dist/
npm run build

# Check for build errors
echo $?
# If 0 = success, if not 0 = failed
```

### Step 6: Check Build Output
```bash
# Should see dist/index.js
ls -la dist/index.js

# If missing, check build errors:
npm run build 2>&1 | grep -i error
```

### Step 7: Start App
```bash
pm2 start dist/index.js --name trading-app
pm2 save
pm2 list
```

### Step 8: Check Logs
```bash
pm2 logs trading-app --lines 30
```

### Step 9: Test Endpoints
```bash
curl http://localhost:3000/health
curl http://localhost:3000/admin/broker-status
```

---

## COMMON ISSUES:

### Issue 1: Build Fails with "Cannot find module"
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue 2: Port 3000 Already in Use
**Solution:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
# Then restart app
pm2 start dist/index.js --name trading-app
```

### Issue 3: Git Pull Conflicts
**Solution:**
```bash
git reset --hard HEAD
git pull origin main
```

### Issue 4: TypeScript Errors
**Solution:**
```bash
# Check specific errors
npm run build

# If you see errors about lightspeedClient or brokerRouter,
# make sure all files were pulled:
ls -la src/services/
# Should see: brokerRouter.ts, lightspeedClient.ts
```

---

## ONE-LINER FIX (Copy-Paste):

```bash
ssh root@165.227.104.40 "cd /root/trading-app && pm2 delete trading-app; git pull origin main; npm install; rm -rf dist/; npm run build && pm2 start dist/index.js --name trading-app && pm2 save && pm2 logs trading-app --lines 30"
```

---

## IF ALL ELSE FAILS:

### Nuclear Option - Fresh Deploy:
```bash
ssh root@165.227.104.40
cd /root
rm -rf trading-app
git clone https://github.com/mailtoakash08-glitch/tradingview-app.git trading-app
cd trading-app
npm install
npm run build
pm2 start dist/index.js --name trading-app
pm2 save
```

---

## AFTER IT'S RUNNING:

1. Check: http://165.227.104.40:3000/desktop
2. Check: http://165.227.104.40:3000/admin/broker-status
3. Place a test order to verify

---

**RUN THE ONE-LINER FIRST, then check the endpoints!**

