# 🚀 Quick Deploy Checklist

## Before Deploying:

1. **Get your Public IP:**
   ```bash
   curl ifconfig.me
   ```
   Write it down: _______________

2. **Configure TWS:**
   - ☐ Settings → API → Settings
   - ☐ **UNCHECK** "Allow connections from localhost only"
   - ☐ Socket Port: **7497**
   - ☐ Master API client ID: **0**
   - ☐ Add Trusted IP: **165.227.104.40** (VPS)

3. **Configure Router:**
   - ☐ Port Forward: **7497 → Your Local IP**

4. **Test Connection:**
   ```bash
   # On local
   netstat -an | grep 7497
   # Should show LISTENING
   ```

## Deploy to VPS:

```bash
# 1. Run deployment script
cd /Users/dev/Documents/tradingview
./deploy-from-github.sh

# 2. SSH to VPS and update .env
ssh root@165.227.104.40
nano /root/tradingview/.env

# Change this line:
IBKR_HOST=[YOUR_PUBLIC_IP]  # e.g., 73.25.142.89

# Save: Ctrl+X, Y, Enter

# 3. Restart app
pm2 restart trading-app

# 4. Check connection
curl localhost:3000/admin/broker-status

# 5. Check logs
pm2 logs trading-app --lines 20
```

## Verify:

- ☐ TWS shows "client0" connected
- ☐ Broker status API returns `"connected": true`
- ☐ Test order appears in TWS

## Done! ✅
