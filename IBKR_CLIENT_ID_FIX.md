# IB Gateway Client ID 0 Configuration

## ✅ FIXED: Auto-Bind Error

### Problem
```
Error validating request.-'b1' : cause - Only the default client (i.e 0) can auto bind orders;
```

### Solution
Both IB Gateway and the application must use **client ID 0**.

## Configuration

### 1. IB Gateway Settings
- Path: **Configure → Settings → API → Settings**
- Setting: **"Master API client ID"** = `0`
- **Must restart IB Gateway** after changing

### 2. Application Configuration

**File: `.env`**
```bash
IBKR_CLIENT_ID=0
```

**File: `src/config.ts`**
```typescript
clientId: parseInt(process.env.IBKR_CLIENT_ID || "0", 10)
```

## Verification

### IB Gateway Logs Should Show:
```
### client connected: 0
```
or
```
client0
```

### Application Logs Should Show:
```json
{
  "message": "Connecting to IBKR Gateway",
  "data": {"clientId": 0}
}
```

### Network Connection:
```bash
lsof -i :4002
# Should show ESTABLISHED connection between node and JavaAppli
```

## Testing

1. Open: http://localhost:3000/desktop
2. Check: Broker shows "✅ Connected"
3. Place test order: SPY, 1 share, Market
4. Expected:
   - ✅ No auto-bind error
   - ✅ Order appears in IB Gateway
   - ✅ Order fills successfully
   - ✅ Position shows in UI
   - ✅ IB Gateway does NOT freeze

## Troubleshooting

If "client1" appears instead of "client0":
1. Check `.env` file has `IBKR_CLIENT_ID=0`
2. Rebuild: `npm run build`
3. Restart app: `pkill -f "node dist/index.js" && npm start`

If "auto-bind" error persists:
1. Verify IB Gateway "Master API client ID" = 0
2. Restart IB Gateway completely
3. Restart application
