# Troubleshooting Guide

## Frontend Not Loading

### Issue: Tailwind CSS PostCSS Error ✅ FIXED

**Symptoms:**
- Browser shows error about `tailwindcss` and PostCSS plugin
- Error message: "It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin"

**Root Cause:**
Tailwind CSS v4+ changed how it integrates with PostCSS and requires `@tailwindcss/postcss` instead of the traditional setup.

**Solution:**
We need to use Tailwind CSS v3 which is compatible with the standard PostCSS setup:

```bash
cd frontend
npm uninstall tailwindcss
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
npm run dev
```

**Status:** ✅ **FIXED** - Frontend now loads correctly at http://localhost:5173

---

### Issue: Axios Type Errors - White Screen ✅ FIXED

**Symptoms:**
- Browser shows white screen
- Console error about `AxiosRequestConfig` not being exported
- Error in `axios-instance.ts`

**Root Cause:**
Axios type imports were causing TypeScript compilation errors that blocked the app from rendering.

**Solution:**
Removed all Axios type imports and used plain TypeScript types:

```typescript
// Before (caused error):
import axios, { AxiosRequestConfig } from 'axios';

// After (works):
import axios from 'axios';
// Use native config types without explicit imports
```

**Status:** ✅ **FIXED** - Frontend renders correctly with full routing

---

### Issue: ApiResponse Export Error ✅ FIXED

**Symptoms:**
- Console error: "The requested module '/src/shared/types/api.types.ts' does not provide an export named 'ApiResponse'"
- White screen or module loading errors
- TypeScript can't find the export even though it exists

**Root Cause:**
TypeScript/Vite module resolution issues with deep import paths in development mode. Direct imports to `.ts` files can sometimes fail to resolve properly.

**Solution:**
Create a barrel export file and use cleaner import paths:

```bash
# 1. Create barrel export file
cat > frontend/src/shared/types/index.ts << 'EOF'
export type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  BaseEntity,
  SoftDeletableEntity,
} from './api.types';
EOF

# 2. Clear Vite cache
cd frontend
rm -rf node_modules/.vite

# 3. Update imports in your files
# Change from: import { ApiResponse } from '../../../shared/types/api.types';
# Change to:   import { ApiResponse } from '../../../shared/types';
```

**Status:** ✅ **FIXED** - Module exports properly resolved

---

## Backend Connection Issues

### Issue: Frontend shows "Network Error" when trying to login

**Symptoms:**
- Login form submits but shows error
- Browser console shows `ERR_CONNECTION_REFUSED` or CORS error

**Solution:**

1. **Check backend is running:**
```bash
cd backend
npm run dev
# Should show: "TransitOps API running on port 5000"
```

2. **Check database is running:**
```bash
docker ps
# Should show: transitops-db container running
```

3. **Check frontend .env:**
```bash
cd frontend
cat .env
# Should contain: VITE_API_URL=http://localhost:5000/api
```

4. **Test backend directly:**
```bash
curl http://localhost:5000/health
# Should return JSON with status "healthy"
```

---

## Database Issues

### Issue: Database migrations fail

**Symptoms:**
- Error: "Can't reach database server"
- Prisma errors during migration

**Solution:**

1. **Restart PostgreSQL:**
```bash
cd backend
docker-compose down
docker-compose up -d
sleep 5  # Wait for PostgreSQL to start
```

2. **Re-run migrations:**
```bash
npm run prisma:migrate
npm run prisma:seed
```

3. **Check database connection:**
```bash
docker exec -it transitops-db psql -U postgres -d transitops -c "SELECT 1;"
# Should return: 1
```

---

## Login Issues

### Issue: Can't login with demo credentials

**Symptoms:**
- "Invalid email or password" error
- Even though using correct credentials

**Solution:**

1. **Verify database is seeded:**
```bash
cd backend
npm run prisma:seed
```

2. **Check users exist:**
```bash
docker exec -it transitops-db psql -U postgres -d transitops
\c transitops
SELECT email FROM users;
\q
```

3. **Verify password:**
All demo accounts use password: `password123`

**Demo Accounts:**
- admin@transitops.com
- dispatcher@transitops.com
- fleet@transitops.com
- safety@transitops.com
- finance@transitops.com

---

## Port Already in Use

### Issue: Backend won't start - "Port 5000 already in use"

**Solution:**

```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port
# Edit backend/.env and change PORT=5000 to PORT=5001
# Then update frontend/.env to VITE_API_URL=http://localhost:5001/api
```

### Issue: Frontend won't start - "Port 5173 already in use"

**Solution:**

```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or let Vite choose another port automatically
npm run dev
# It will suggest using port 5174 or similar
```

---

## TypeScript Errors

### Issue: TypeScript compilation errors

**Symptoms:**
- Red squiggly lines in VS Code
- Build fails with TS errors

**Solution:**

1. **Restart TypeScript server in VS Code:**
   - Cmd+Shift+P → "TypeScript: Restart TS Server"

2. **Check tsconfig.json exists:**
```bash
ls frontend/tsconfig.json
ls backend/tsconfig.json
```

3. **Reinstall dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Module Not Found Errors

### Issue: "Cannot find module" errors in browser console

**Symptoms:**
- Browser console shows import errors
- Components not rendering

**Solution:**

1. **Check file paths are correct:**
   - All imports should use relative paths
   - Case-sensitive file names

2. **Restart dev server:**
```bash
# Stop server (Ctrl+C)
# Clear Vite cache
rm -rf frontend/node_modules/.vite
npm run dev
```

3. **Verify file exists:**
```bash
# If error says: Cannot find './components/Button'
ls frontend/src/shared/components/ui/Button.tsx
```

---

## CORS Errors

### Issue: "CORS policy" error in browser console

**Symptoms:**
- Browser blocks API requests
- Error mentions "Access-Control-Allow-Origin"

**Solution:**

1. **Check backend CORS config:**
```typescript
// backend/src/app.ts should have:
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

2. **Check frontend URL matches:**
   - Backend expects: `http://localhost:5173`
   - Frontend runs on: `http://localhost:5173`

3. **Restart both servers:**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

## Checking Logs

### Backend Logs
```bash
# In backend directory
# Logs are in logs/ directory
cat logs/combined.log | tail -50
cat logs/error.log
```

### Frontend Console
- Open browser DevTools (F12 or Cmd+Option+I)
- Check Console tab for errors
- Check Network tab to see API requests

### Database Logs
```bash
docker logs transitops-db
```

---

## Complete Reset

If nothing works, do a complete reset:

```bash
# 1. Stop all processes
lsof -ti:5000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# 2. Reset database
cd backend
docker-compose down -v  # -v removes volumes
docker-compose up -d
sleep 10

# 3. Reinstall backend
rm -rf node_modules package-lock.json
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. Reinstall frontend
cd ../frontend
rm -rf node_modules package-lock.json .vite
npm install

# 5. Start everything
cd ../backend
npm run dev &
cd ../frontend
npm run dev
```

---

## Getting Help

If you're still stuck:

1. **Check the error message carefully** - It usually tells you what's wrong
2. **Search the error in the project** - Someone might have fixed it before
3. **Check GitHub issues** - For the specific library causing issues
4. **Read the docs** - IMPLEMENTATION_PLAN.md, PROGRESS.md, START_HERE.md

## Success Checklist

Frontend is working correctly if:

- ✅ No errors in terminal
- ✅ `http://localhost:5173` loads the login page
- ✅ No red errors in browser console
- ✅ Can see the TransitOps logo and login form
- ✅ Demo credential buttons work
- ✅ Can submit login (even if backend is off, should see network error)

Backend is working correctly if:

- ✅ No errors in terminal
- ✅ Shows "TransitOps API running on port 5000"
- ✅ `http://localhost:5000/health` returns JSON
- ✅ Can login successfully from frontend
- ✅ Dashboard loads after login

---

**Last Updated:** After fixing Tailwind CSS v4 compatibility issue
