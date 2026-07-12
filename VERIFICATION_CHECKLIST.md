# ✅ Phase 1 Verification Checklist

Use this checklist to verify everything is working correctly.

## 🔧 Setup Verification

### Backend Setup
- [ ] `cd backend && npm install` - Dependencies installed
- [ ] `docker-compose up -d` - PostgreSQL running
- [ ] `npm run prisma:generate` - Prisma client generated
- [ ] `npm run prisma:migrate` - Migrations applied
- [ ] `npm run prisma:seed` - Demo data seeded
- [ ] `npm run dev` - Server starts on port 5000
- [ ] Visit `http://localhost:5000/health` - Returns healthy status

### Frontend Setup
- [ ] `cd frontend && npm install` - Dependencies installed
- [ ] `.env` file exists with `VITE_API_URL=http://localhost:5000/api`
- [ ] `npm run dev` - Dev server starts on port 5173
- [ ] Visit `http://localhost:5173` - Login page appears

## 🔐 Authentication Flow

### Login
- [ ] Login page displays with TransitOps branding
- [ ] Demo credential buttons are visible
- [ ] Click "admin@transitops.com" - Email fills
- [ ] Password shows `password123`
- [ ] Click "Sign In" - Shows loading state
- [ ] Redirects to `/dashboard` after successful login
- [ ] Dashboard shows welcome message with user name
- [ ] Header shows user full name and role

### Permission-Based UI
- [ ] Logout and login as `dispatcher@transitops.com`
- [ ] Sidebar shows different menu items
- [ ] Login as `finance@transitops.com`
- [ ] Sidebar shows only Analytics and read-only items

### Token Management
- [ ] Login successfully
- [ ] Open DevTools → Application → Local Storage
- [ ] See `accessToken` and `refreshToken` stored
- [ ] Open Network tab
- [ ] Navigate to different pages
- [ ] See `Authorization: Bearer ...` header on all requests

### Logout
- [ ] Click "Logout" button in header
- [ ] Redirects to `/login`
- [ ] Local storage tokens cleared
- [ ] Try visiting `/dashboard` directly
- [ ] Redirects back to `/login`

## 🎨 UI/UX Verification

### Responsive Design
- [ ] Open browser DevTools
- [ ] Toggle device toolbar (mobile view)
- [ ] Login page is readable on mobile
- [ ] Dashboard adapts to mobile screen
- [ ] Sidebar collapses on small screens
- [ ] All text is legible

### Component States
- [ ] Stats cards show on dashboard
- [ ] Active trips widget displays
- [ ] Maintenance alerts widget displays
- [ ] Badge components show colors correctly
- [ ] Loading spinner works (try slow network)

### Navigation
- [ ] Click each sidebar item
- [ ] Placeholder pages show for Phase 2 modules
- [ ] URL changes correctly
- [ ] Active nav item is highlighted
- [ ] Click TransitOps logo - stays on current page

### Accessibility
- [ ] Tab through login form - Focus visible
- [ ] Press Enter on Sign In - Form submits
- [ ] Tab through sidebar - Focus visible on nav items
- [ ] Press Enter on nav item - Navigates

## 🔒 Security Verification

### Rate Limiting
- [ ] Try logging in with wrong password 6 times
- [ ] See "Too many login attempts" error
- [ ] Wait 15 minutes or restart backend to reset

### Unauthorized Access
- [ ] Logout
- [ ] Try visiting `http://localhost:5173/dashboard` directly
- [ ] Redirects to login
- [ ] Try `http://localhost:5000/api/auth/me` in browser
- [ ] See "Unauthorized" error

### RBAC
- [ ] Login as `finance@transitops.com`
- [ ] Try POST to `http://localhost:5000/api/vehicles` (if endpoint exists)
- [ ] Should get 403 Forbidden

## 🗄️ Database Verification

### Schema
- [ ] Connect to PostgreSQL: `docker exec -it transitops-db psql -U postgres -d transitops`
- [ ] List tables: `\dt`
- [ ] See 15+ tables
- [ ] Check users: `SELECT email, "fullName" FROM users;`
- [ ] See 5 demo users

### Seed Data
- [ ] `SELECT * FROM roles;` - See 6 roles
- [ ] `SELECT COUNT(*) FROM permissions;` - See 38 permissions
- [ ] `SELECT * FROM vehicles;` - See 6 vehicles
- [ ] `SELECT * FROM drivers;` - See 5 drivers

### Relationships
- [ ] `SELECT u.email, r.name FROM users u JOIN roles r ON u."roleId" = r.id;`
- [ ] All users have roles assigned

## 🔄 API Testing

### Health Check
```bash
curl http://localhost:5000/health
```
- [ ] Returns JSON with status "healthy"

### Login API
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@transitops.com","password":"password123"}'
```
- [ ] Returns JSON with `accessToken` and `refreshToken`
- [ ] Returns user object with name and role

### Protected Endpoint
```bash
# First get token from login, then:
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
- [ ] Returns full user profile
- [ ] Returns permissions array

### Invalid Token
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer invalid_token"
```
- [ ] Returns 401 Unauthorized
- [ ] Returns error message

## 🎯 Integration Testing

### Full User Flow
1. [ ] Open `http://localhost:5173`
2. [ ] Click demo credential button
3. [ ] Submit login
4. [ ] See dashboard
5. [ ] Navigate to different pages
6. [ ] Check sidebar adapts
7. [ ] Click logout
8. [ ] See login page again
9. [ ] Try invalid credentials
10. [ ] See error message

### Browser Console
- [ ] Open DevTools Console
- [ ] No red errors during normal operation
- [ ] Network requests all return 200 (except intentional errors)
- [ ] No CORS errors

## 📝 Documentation Check

- [ ] `README.md` exists in backend folder
- [ ] `README.md` exists in frontend folder
- [ ] `IMPLEMENTATION_PLAN.md` is comprehensive
- [ ] `START_HERE.md` has quick start instructions
- [ ] `PROGRESS.md` reflects current status
- [ ] `PHASE_1_COMPLETE.md` summarizes achievements

## 🐛 Common Issues & Solutions

### Backend won't start
**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`
**Solution**: 
```bash
docker-compose up -d
# Wait 10 seconds for PostgreSQL to start
npm run dev
```

### Frontend shows API error
**Problem**: Network error when logging in
**Solution**: 
- Check backend is running on port 5000
- Check `.env` has correct `VITE_API_URL`
- Check CORS settings in `backend/src/app.ts`

### Can't login
**Problem**: Invalid credentials error
**Solution**:
- Check database is seeded: `npm run prisma:seed` in backend
- Verify demo passwords are all `password123`
- Check network tab for actual error from API

### Sidebar doesn't show
**Problem**: Blank sidebar after login
**Solution**:
- Check browser console for errors
- Verify user object exists in auth store
- Check if permissions are loaded

## ✅ Success Criteria

Phase 1 is verified if ALL of the following are true:

1. ✅ Backend starts without errors
2. ✅ Frontend starts without errors
3. ✅ Login works with demo credentials
4. ✅ Dashboard displays after login
5. ✅ Sidebar shows role-appropriate items
6. ✅ Logout redirects to login
7. ✅ Protected routes require auth
8. ✅ Token refresh works automatically
9. ✅ No console errors during normal use
10. ✅ UI is responsive and professional

---

## 🎉 All Checked?

**Congratulations! Phase 1 is fully verified and ready for Phase 2!**

**Next**: Review `IMPLEMENTATION_PLAN.md` Phase 2 to start building Vehicles, Drivers, and Trips modules.
