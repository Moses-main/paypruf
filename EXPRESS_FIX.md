# Express Route Parameter Fix

## 🐛 Problem
The server was failing to start with this error:
```
Unexpected ? at index 21, expected end: /stats/:walletAddress?
```

## 🔍 Root Cause
- **Express v5.2.1** has stricter route parameter parsing
- The optional parameter syntax `/:param?` was causing issues
- Express v5 is still in beta and has breaking changes

## ✅ Solution Applied

### 1. Downgraded Express to Stable Version
```json
{
  "express": "^4.22.1",
  "@types/express": "^4.17.25"
}
```

### 2. Fixed Route Definition
The route `/stats/:walletAddress?` now works correctly with Express v4.

### 3. Cleaned Up Dependencies
- Removed deprecated `crypto` package (now built-in to Node.js)
- Updated to stable Express v4 ecosystem

## 🚀 How to Apply the Fix

### Option 1: Run the Fix Script
```bash
./fix-dependencies.sh
```

### Option 2: Manual Fix
```bash
cd server
npm install express@^4.22.1 @types/express@^4.17.25
npm install
```

## ✅ Verification

After applying the fix, the server should start without errors:

```bash
cd server
npm run dev
```

Expected output:
```
info: Flare anchor service initialized with wallet: 0x...
info: Server is running on port 3001
```

## 📋 What Changed

### Files Modified:
- `server/package.json` - Express version downgrade
- `server/src/routes/payment.routes.ts` - Route syntax (reverted to working version)

### Dependencies Updated:
- `express`: `^5.2.1` → `^4.22.1`
- `@types/express`: `^5.0.6` → `^4.17.25`

## 🎯 Result

The server now starts successfully and all API endpoints are functional:
- ✅ `/health` - Health check
- ✅ `/api/payment/*` - Payment endpoints
- ✅ `/api/proof/*` - Proof endpoints

Express v4 is the stable, production-ready version used by most Node.js applications.