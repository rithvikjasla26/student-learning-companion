# 🔐 Demo Authentication Setup Guide

## Quick Start for Testing

### Login Flow
1. **Request OTP**: Enter any email address
2. **Use OTP**: `123456` (hardcoded for demo)
3. **Access App**: User is logged in for 30 days

### Key Features (Demo Mode)

✅ **Hardcoded OTP**: Always use `123456`
✅ **Long Session**: 30-day token expiry (vs 7d in production)
✅ **Lenient Rate Limiting**: 100 requests per 15 min (vs 10 for production)
✅ **Extended OTP Expiry**: 30 minutes (vs 10 min in production)
✅ **Console Logging**: Detailed auth flow logs visible in terminal

---

## Configuration Files

### Backend Environment Variables

**Development (.env.example)**
```env
JWT_EXPIRES_IN=30d              # Long session for demo
OTP_EXPIRY_MINUTES=30           # Extended OTP validity
```

**Production (.env.production.example)**
```env
JWT_EXPIRES_IN=30d              # Can adjust to 7d for security
OTP_EXPIRY_MINUTES=30           # Can adjust to 10 for production
```

---

## Backend Middleware Stack

### 1. **Rate Limiter** (`rateLimiter.middleware.ts`)

**Current Configuration (DEMO MODE)**
```typescript
authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window (DEMO - very lenient)
  keyGenerator: (req) => {
    // Uses email from request body
    // Falls back to IP if no email
  }
})
```

**Issues Fixed**
- ❌ OLD: 10 requests per 15 minutes (too strict for demo)
- ✅ NEW: 100 requests per 15 minutes (lenient for demo)

### 2. **Auth Middleware** (`authMiddleware.ts`)

**Verification Flow**
```typescript
1. Check "Authorization: Bearer <token>" header
2. Verify JWT signature with JWT_SECRET
3. Extract userId, email, role
4. Attach to req.user for downstream handlers
```

**Enhanced Logging**
- ✓ Logs successful token verification
- ✓ Logs detailed error messages
- ✓ Includes request method and path

### 3. **Auth Service** (`auth.service.ts`)

**sendOTP(email)**
```
1. Normalizes email to lowercase
2. Stores OTP "123456" in memory for 30 minutes
3. Logs OTP to console for demo viewing
```

**verifyOTP(email, otp)**
```
1. Checks if OTP exists and is valid
2. Verifies code matches "123456" exactly
3. Checks expiry time
4. Creates user + tokens on success
5. Detailed console logging for debugging
```

**refreshToken(refreshToken)**
```
1. Verifies refresh token signature
2. Generates new access token with 30d expiry
3. Logs success/failure for debugging
```

---

## API Endpoints

### Public Endpoints (No Auth Required)

**POST /api/auth/send-otp**
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Response
{
  "success": true,
  "message": "OTP sent to user@example.com (Demo: use code 123456)"
}

# Console Output (Backend)
# ╔════════════════════════════════════════════════════════════════╗
# ║ 📧 DEMO OTP - Use this to login:                              ║
# ║ Email: user@example.com                                        ║
# ║ OTP Code: 123456                                               ║
# ║ Expires in: 30 minutes                                         ║
# ╚════════════════════════════════════════════════════════════════╝
```

**POST /api/auth/verify-otp**
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","otp":"123456","role":"STUDENT"}'

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "user-123"
}

# Console Output (Backend)
# ╔════════════════════════════════════════════════════════════════╗
# ║ 🔐 OTP VERIFICATION ATTEMPT                                    ║
# ║ Email: user@example.com                                        ║
# ║ Provided OTP: 123456                                           ║
# ╚════════════════════════════════════════════════════════════════╝
# ✅ OTP verified successfully
# ╔════════════════════════════════════════════════════════════════╗
# ║ ✅ USER LOGGED IN SUCCESSFULLY                                 ║
# ║ User ID: user-123                                              ║
# ║ Email: user@example.com                                        ║
# ║ Role: STUDENT                                                  ║
# ║ Access Token Expires In: 30d                                   ║
# ╚════════════════════════════════════════════════════════════════╝
```

**POST /api/auth/refresh-token**
```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Console Output (Backend)
# 🔄 Token refreshed for user: user@example.com
```

**GET /api/auth/profile** (Protected)
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <accessToken>"

# Console Output (Backend)
# [Auth] ✓ Token verified for user@example.com - GET /api/auth/profile
```

---

## Frontend Token Management

### Token Storage (`localStorage`)
```javascript
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "STUDENT"
  }
}
```

### API Interceptor Flow

**Request Interceptor**
```
1. Get accessToken from localStorage
2. Add "Authorization: Bearer <token>" header
3. Send request
```

**Response Interceptor**
```
If 401 Unauthorized:
  ├─ Check if already retrying (prevent infinite loop)
  ├─ Get refreshToken from localStorage
  ├─ Call /api/auth/refresh-token
  ├─ Store new accessToken
  ├─ Retry original request
  └─ If refresh fails → logout user

Otherwise:
  └─ Return response normally
```

### Console Logging (Frontend)
```javascript
// Successful API call
// No logging (optional enhancement)

// 401 Unauthorized
// [API] Received 401 Unauthorized for GET /api/learning-hub/review-queue
// [API] Attempting to refresh token...
// [API] ✓ Token refreshed successfully

// Token refresh failed
// [API] ✗ Token refresh failed, logging out user
```

---

## Troubleshooting

### Issue: "OTP not found" Error

**Symptoms**
```
Error: OTP not found. Please request a new OTP.
```

**Causes**
1. OTP expired (> 30 minutes)
2. Wrong email used
3. Email case mismatch (should be normalized)

**Solution**
1. Request new OTP: Send email again
2. Check backend logs for stored OTP emails
3. Use exact email address from OTP request

### Issue: "Invalid OTP" Error

**Symptoms**
```
Error: Invalid OTP
```

**Causes**
1. Wrong code (should be "123456")
2. OTP store mismatch

**Solution**
1. Always use "123456" in demo mode
2. Check backend logs for expected vs provided OTP
3. Request new OTP if unsure

### Issue: "Invalid or expired token" During Navigation

**Symptoms**
```
After a few page navigations, logged out automatically
```

**Causes** (Now Fixed)
1. ❌ Auth rate limit exceeded (was 10 per 15 min)
2. ❌ JWT token expired too quickly (was 7 days)
3. ❌ Token refresh failing silently

**Solution** (Implemented)
1. ✅ Increased rate limit to 100 per 15 min
2. ✅ Increased JWT expiry to 30 days
3. ✅ Added detailed logging for debugging

### Issue: Seeing Console Logs

**How to View**
1. **Backend**: Check terminal where server is running
2. **Frontend**: Open browser DevTools (F12) → Console tab

**Typical Successful Flow (Console Output)**
```
[Backend]
📧 DEMO OTP - Use this to login:
Email: user@example.com
OTP Code: 123456
Expires in: 30 minutes

✅ OTP verified successfully

✅ USER LOGGED IN SUCCESSFULLY
User ID: user-123
Email: user@example.com
Role: STUDENT

[Frontend - On 401]
[API] Received 401 Unauthorized
[API] Attempting to refresh token...
[API] ✓ Token refreshed successfully
```

---

## Security Notes for Demo vs Production

| Feature | Demo Mode | Production |
|---------|-----------|-----------|
| OTP | Hardcoded "123456" | SendGrid email |
| Rate Limit | 100 req/15min | 10 req/15min |
| JWT Expiry | 30 days | 7 days |
| OTP Expiry | 30 min | 10 min |
| Logging | Verbose console | Minimal logging |
| Secret | Test secret | Strong random key |

---

## How to Switch to Production Mode

1. **Generate strong JWT secret**
   ```bash
   openssl rand -base64 32
   ```

2. **Update .env**
   ```env
   JWT_EXPIRES_IN=7d
   OTP_EXPIRY_MINUTES=10
   SENDGRID_API_KEY=SG....  # Add SendGrid key
   ```

3. **Update rate limiter** (if needed)
   ```typescript
   max: 10,  // Change from 100 back to 10
   ```

4. **Remove hardcoded OTP** (integrate real email service)

---

## Demo Login Steps

### Step 1: Request OTP
```
1. Go to login page
2. Enter email: demo@example.com
3. Click "Send OTP"
4. Check backend console for: 📧 DEMO OTP - 123456
```

### Step 2: Enter OTP
```
1. OTP field appears
2. Type: 123456
3. Click "Verify"
4. Success! User is logged in for 30 days
```

### Step 3: Navigate Freely
```
1. No more logout on navigation
2. Token auto-refreshes when needed
3. Stays logged in for 30 days
4. Check backend logs: ✓ Token verified for each request
```

---

**Last Updated**: 2026-08-21
**Mode**: 🟢 DEMO
**Status**: Ready for Testing
