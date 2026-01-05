# 🚀 Quick Setup Guide

## Your Repository
**GitHub:** https://github.com/mailtoakash08-glitch/tradingview-app.git

---

## ⚡ SUPER QUICK START (5 Commands)

```bash
cd /Users/dev/Documents/tradingview

# 1. Initialize Git and commit
git init
git add .
git commit -m "Initial commit: TradingView Desktop Trading App"

# 2. Connect to your GitHub repo
git remote add origin https://github.com/mailtoakash08-glitch/tradingview-app.git
git branch -M main

# 3. Push to GitHub
git push -u origin main

# 4. Deploy to VPS
./deploy-github.sh

# 5. Access your app
# http://165.227.104.40:3000/desktop
```

---

## 📋 What I've Set Up For You

✅ **README.md** - Professional documentation with your GitHub link
✅ **.gitignore** - Proper Git ignore rules
✅ **.env.example** - Environment template
✅ **deploy-github.sh** - Automated deployment (configured for your repo)

---

## 🔄 Future Updates

When you make changes:

```bash
# 1. Commit changes
git add .
git commit -m "Your changes"
git push

# 2. Deploy (ONE COMMAND!)
./deploy-github.sh
```

---

## 🌐 After Deployment

1. **Configure IBKR on VPS:**

```bash
ssh root@165.227.104.40
cd /root/trading-app
nano .env
# Change: IBKR_ACCOUNT_ID=YOUR_ACCOUNT_ID_HERE
# To: IBKR_ACCOUNT_ID=DU1234567  (your paper account)
pm2 restart trading-app
```

2. **Access your app:**
```
http://165.227.104.40:3000/desktop
```

---

## 🎯 Your App Features

- ✅ TradingView Desktop-style interface
- ✅ Manual trading (Market/Limit/Stop/Trailing)
- ✅ Extended hours trading
- ✅ Real-time P&L tracking
- ✅ Take Profit & Stop Loss
- ✅ IBKR integration
- ✅ Dark UI

---

## 📞 Useful Commands

| Task | Command |
|------|---------|
| Deploy/Update | `./deploy-github.sh` |
| View logs | `ssh root@165.227.104.40 'pm2 logs trading-app'` |
| Restart | `ssh root@165.227.104.40 'pm2 restart trading-app'` |
| Check status | `ssh root@165.227.104.40 'pm2 list'` |

---

**Ready to push to GitHub?** Run the 5 commands above! 🚀

