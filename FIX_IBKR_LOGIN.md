# 🔧 IB Gateway Login Issue - Troubleshooting Guide

**Error:** "UNRECOGNIZED USERNAME OR PASSWORD"

---

## 🔍 Common Causes & Solutions

### **1. Paper Trading vs Live Trading Mismatch**

**Most Common Issue:** You're trying to log in with Paper Trading credentials but using the wrong gateway configuration.

#### Check Your Account Type:

**Paper Trading Account:**

- Username format: Usually your live username
- Password: Usually your live password
- **BUT:** Must select "Paper Trading" mode in IB Gateway

**Live Trading Account:**

- Username: Your main IB username
- Password: Your main IB password
- Must select "Live Trading" mode

#### Solution:

1. **When IB Gateway opens, look for a toggle/dropdown:**

   - Make sure you select **"Paper Trading"** if using paper account
   - Or select **"Live Trading"** if using live account

2. **The username/password are usually THE SAME**, but you must select the correct mode!

---

### **2. Two-Factor Authentication (2FA)**

If you have 2FA enabled on your Interactive Brokers account:

**Solution A: Use IB Key (Mobile App)**

1. Download "IB Key" app on your phone
2. Log in to IBKR on the app
3. When logging into Gateway, after entering credentials:
   - Check your IB Key app for notification
   - Approve the login

**Solution B: Use Security Device Code**

1. If you have a physical security device
2. Enter the code when prompted

**Solution C: Disable 2FA for API (Not Recommended)**

1. Log in to Account Management: https://www.interactivebrokers.com
2. Settings → Security → Two-Factor Authentication
3. Configure to allow API connections without 2FA

---

### **3. Account Not Yet Activated**

**Paper Trading Account Activation:**

- Paper accounts can take up to **1 business day** to activate after approval
- Check your email for activation confirmation

**Solution:**

1. Log in to: https://www.interactivebrokers.com/portal
2. Check account status
3. Make sure paper trading is enabled

---

### **4. Username/Password Issues**

#### Common Mistakes:

1. **Extra spaces** - Copy/paste can add spaces
2. **Case sensitivity** - "User123" ≠ "user123"
3. **Wrong keyboard layout** - Check Caps Lock, Num Lock
4. **Outdated password** - Recently changed?

#### Solution:

1. **Reset your password:**

   - Go to: https://www.interactivebrokers.com
   - Click "Forgot Password"
   - Follow reset instructions

2. **Verify username:**
   - Check your IBKR welcome email
   - Username is usually shown when you log into portal

---

### **5. VPS Keyboard Layout Issue**

When typing via VNC, the keyboard layout might be different.

**Solution:**

1. Type password in a text editor first (to see what you're typing)
2. Copy and paste into password field
3. Or use the on-screen keyboard in VNC

---

## 🚀 Step-by-Step Fix

### **Option 1: Use Paper Trading Mode (Recommended for Testing)**

1. **Connect to VPS via VNC:**

   ```bash
   ssh -L 5901:localhost:5901 root@165.227.104.40
   ```

2. **Open VNC Viewer:**

   - Connect to: `localhost:5901`
   - Password: `trading123`

3. **Open IB Gateway**

4. **IMPORTANT: Look for "Paper Trading" dropdown/toggle**

   - Usually at the top or bottom of login window
   - Select **"IB Gateway - Paper Trading"** or **"Paper Trading"**

5. **Enter your credentials:**

   - Username: (your IBKR username)
   - Password: (your IBKR password)

6. **Click Login**

7. **If 2FA is enabled:**
   - Check your IB Key app and approve

---

### **Option 2: Create New Paper Trading Account**

If you don't have a paper account yet:

1. **Go to:** https://www.interactivebrokers.com/portal
2. **Log in with your credentials**
3. **Navigate to:** Account Management → Settings → Paper Trading
4. **Enable Paper Trading**
5. **Wait 15-30 minutes** for activation
6. **Try logging into IB Gateway again**

---

### **Option 3: Verify Credentials in Web Portal**

1. **Test your credentials here first:**

   ```
   https://www.interactivebrokers.com/portal
   ```

2. **Can you log in?**
   - ✅ **YES** → Credentials are correct, it's a Gateway configuration issue
   - ❌ **NO** → Reset your password

---

### **Option 4: Use Headless Authentication (Advanced)**

If VNC login keeps failing, you can configure IB Gateway to auto-login:

1. **Edit IB Gateway config file:**

   ```bash
   ssh root@165.227.104.40
   nano ~/Jts/jts.ini
   ```

2. **Add these lines:**

   ```ini
   [IBGateway]
   Username=YOUR_USERNAME
   Password=YOUR_PASSWORD  # This is stored in plain text - be careful!
   TradingMode=paper  # or "live"
   ```

3. **Restart IB Gateway**

**⚠️ Security Warning:** This stores your password in plain text. Only use on a secure VPS.

---

## 🔐 Security Notes

### **Current Error Message Explained:**

The message says:

- "Passwords are case sensitive" → Make sure you're typing exactly right
- "If you need to retrieve your username or reset your password, you can do so **HERE**" → Click the blue "HERE" link
- "If you want to continue an application or check on its status, you can do so **HERE**" → This is for new account applications

### **What the "UNRECOGNIZED" error usually means:**

1. ❌ Wrong username format
2. ❌ Wrong password
3. ❌ Wrong trading mode selected (Paper vs Live)
4. ❌ 2FA blocking login
5. ❌ Account not activated

---

## 🧪 Quick Test

Before trying to log in to IB Gateway again:

1. **Test in web portal:**

   ```
   https://www.interactivebrokers.com/portal
   ```

2. **Can you log in there?**

   - If YES → The credentials work, it's a Gateway configuration issue
   - If NO → Reset your password first

3. **Check if paper trading is enabled:**
   - In portal: Account → Paper Trading
   - Make sure it's activated

---

## 📞 Contact IBKR Support

If none of these work:

**IBKR Support:**

- Phone: 1-877-442-2757 (US/Canada)
- Chat: https://www.interactivebrokers.com/en/support/chat.php
- Hours: 24/7

**Tell them:**

- "I'm trying to log into IB Gateway for API trading"
- "Getting 'UNRECOGNIZED USERNAME OR PASSWORD' error"
- "I can log into the web portal fine"
- "I need help with paper trading access for API"

They can:

- ✅ Verify your account is set up for API access
- ✅ Confirm paper trading is enabled
- ✅ Reset credentials if needed
- ✅ Help with 2FA setup

---

## ✅ After Successful Login

Once you successfully log in:

1. **Verify IB Gateway is running:**

   ```bash
   ssh root@165.227.104.40
   lsof -i :4002
   ```

   Should show Java process listening on port 4002

2. **Check broker status:**

   ```bash
   curl http://165.227.104.40:3000/admin/broker-status
   ```

   Should show: `"ibkr": { "connected": true }`

3. **Test with 1 share:**
   - Go to: http://165.227.104.40:3000/desktop
   - Select: 🏦 Interactive Brokers
   - Symbol: AAPL
   - Quantity: 1
   - Click BUY
   - Should fill in 5-30 seconds

---

## 💡 Recommended Approach

**For Now (Testing):**

1. ✅ Use **🎮 DEMO MODE** (already working!)
2. ✅ No need for IB Gateway at all
3. ✅ Test all features risk-free

**Later (Real Trading):**

1. Resolve IB Gateway login issue
2. Test with 1-2 shares
3. Scale up gradually

**Demo mode is perfect for:**

- Learning the platform
- Testing features
- Training
- Strategy verification

---

## 🎯 Summary

| Issue                          | Most Likely Cause           | Solution                                   |
| ------------------------------ | --------------------------- | ------------------------------------------ |
| UNRECOGNIZED USERNAME/PASSWORD | Wrong trading mode selected | Select "Paper Trading" in dropdown         |
| Can't log in                   | 2FA enabled                 | Use IB Key app to approve                  |
| Account not working            | Not activated yet           | Wait 24h or contact IBKR                   |
| Keyboard issues                | VNC keyboard layout         | Type in text editor first, then copy/paste |

**Next Step:** Try logging in again, but **make sure to select "Paper Trading" mode** in the dropdown!

---

## 🚨 IMPORTANT

**You DO NOT need IB Gateway working right now!**

**Demo Mode is already working perfectly:**

- ✅ Place orders: http://165.227.104.40:3000/desktop
- ✅ Select: 🎮 DEMO MODE
- ✅ Test everything risk-free
- ✅ No IB Gateway needed

**Fix IB Gateway when you're ready for real trading.**

---

**Need help?** Let me know what error you get after trying these solutions!
