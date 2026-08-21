# Deployment Guide - Render

Since you're using manual deployment on Render (not render.yaml), follow these steps to properly configure your frontend and backend services.

## Prerequisites
- Two separate Render web services (one for frontend, one for backend)
- Frontend service name/domain: `https://your-frontend-service.onrender.com`
- Backend service name/domain: `https://your-backend-service.onrender.com`

## Backend Service Configuration

### 1. Environment Variables
In your Render backend service dashboard, set these environment variables:

```
BACKEND_PORT=5000
DATABASE_URL=<your-postgresql-url>
ANTHROPIC_API_KEY=<your-api-key>
CLAUDE_HAIKU_MODEL=claude-3-5-haiku-20241022
CLAUDE_SONNET_MODEL=claude-3-5-sonnet-20241022
JWT_SECRET=<generate-a-strong-random-secret>
JWT_EXPIRES_IN=7d
SENDGRID_API_KEY=<your-sendgrid-key>
OTP_EXPIRY_MINUTES=10
NODE_ENV=production
SCHEDULER_TIMEZONE=Asia/Kolkata
FRONTEND_URL=https://your-frontend-service.onrender.com
```

**IMPORTANT:** `FRONTEND_URL` must be your actual frontend service URL (without `/api` path). This enables CORS.

### 2. Build Command
```bash
cd packages/backend && npm install && npm run build
```

### 3. Start Command
```bash
cd packages/backend && npm start
```

---

## Frontend Service Configuration

### 1. Environment Variables
In your Render frontend service dashboard, set these environment variables:

```
VITE_API_BASE_URL=https://your-backend-service.onrender.com/api
VITE_APP_NAME=Student Learning Companion
```

**CRITICAL:** `VITE_API_BASE_URL` must be set **BEFORE** the build runs. This is a build-time variable, not a runtime variable.

### 2. Build Command
```bash
cd packages/frontend && npm install && npm run build
```

### 3. Start Command
```bash
cd packages/frontend && npm start
```

---

## Step-by-Step Setup in Render Dashboard

### For Backend Service:
1. Go to your backend web service
2. Click **Environment**
3. Add each variable from the list above
4. **IMPORTANT:** `FRONTEND_URL=https://your-frontend-service.onrender.com`
5. Deploy → **Auto-Deploy** should be enabled
6. Check **Deploy** tab to verify `npm start` succeeds

### For Frontend Service:
1. Go to your frontend web service
2. Click **Environment**
3. Add the variables:
   - `VITE_API_BASE_URL=https://your-backend-service.onrender.com/api`
   - `VITE_APP_NAME=Student Learning Companion`
4. **CRITICAL:** Save environment variables **BEFORE** redeploying
5. Deploy → Trigger a new deploy so build happens with these vars
6. Check **Deploy** tab to verify build completes successfully

---

## Verification

### 1. Check Frontend Network Calls
1. Open your frontend at `https://your-frontend-service.onrender.com`
2. Open Browser DevTools → Network tab
3. Try logging in (click OTP, enter email)
4. Look for the request to `/api/auth/send-otp`
5. **Verify URL:** Should be `https://your-backend-service.onrender.com/api/auth/send-otp`
6. **Check status:** Should be 200 (success) or appropriate error code, NOT a CORS error

### 2. Check Backend Logs
In your backend service's **Logs** tab, verify:
- Server starts with `✓ Server is running on http://localhost:5000`
- Frontend URL is logged: `✓ Frontend URL: https://your-frontend-service.onrender.com`

### 3. Test CORS
Frontend should be able to call:
- `POST https://your-backend-service.onrender.com/api/auth/send-otp`
- `POST https://your-backend-service.onrender.com/api/auth/verify-otp`
- And other API endpoints

---

## Common Issues & Solutions

### Issue: "CORS request did not succeed" or "localhost:5000"
**Cause:** `VITE_API_BASE_URL` not set during build

**Solution:**
1. Check frontend environment variables in Render dashboard
2. Verify `VITE_API_BASE_URL` is set
3. **Trigger a new deploy** (don't just update vars, rebuild needed)
4. Check frontend build logs for any warnings

### Issue: CORS errors from backend
**Cause:** `FRONTEND_URL` not correctly set on backend

**Solution:**
1. Check backend environment variables
2. Verify `FRONTEND_URL` matches your actual frontend domain
3. Redeploy backend

### Issue: 401/403 errors after OTP verification
**Cause:** Token handling issues (different problem)

**Solution:** Check auth middleware and JWT secret consistency between services

---

## Environment Variable Summary

| Variable | Service | Value | When Set |
|----------|---------|-------|----------|
| `VITE_API_BASE_URL` | Frontend | `https://backend-service.onrender.com/api` | Build time (CRITICAL) |
| `FRONTEND_URL` | Backend | `https://frontend-service.onrender.com` | Runtime |
| `NODE_ENV` | Both | `production` | Build/Runtime |
| `JWT_SECRET` | Backend | Generate random string | Build/Runtime |
| `DATABASE_URL` | Backend | PostgreSQL connection | Runtime |

---

## Additional Notes

- The vite dev proxy (`http://localhost:5000` fallback) is only for local development
- In production, all API calls must go through the explicitly configured `VITE_API_BASE_URL`
- Environment variables in Render are available immediately after setting them
- You must **trigger a new deploy** after changing `VITE_*` variables (they're build-time)
- You must **trigger a new deploy** after changing backend `FRONTEND_URL` (affects CORS)
