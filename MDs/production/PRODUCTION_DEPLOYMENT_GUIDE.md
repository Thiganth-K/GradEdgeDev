# GradEdge - Production Deployment Guide

## 📋 Project Overview

**GradEdge** is a comprehensive educational management platform designed for hierarchical administration of educational institutions. The platform enables multi-level management from super administrators down to individual students, with robust role-based access control and real-time communication features.

### Technology Stack

- **Frontend:** React 19.2 + TypeScript + Vite + TailwindCSS
- **Backend:** Node.js + Express 5.2
- **Database:** MongoDB (Atlas Cloud)
- **Authentication:** JWT (JSON Web Tokens)
- **Deployment:** Render.com
- **Version Control:** Git + GitHub

---

## 🎯 Key Features

### 1. Role-Based Access Control (RBAC)
The platform supports **6 distinct user roles** with hierarchical permissions:

#### **SuperAdmin**
- Highest level of access
- Full CRUD operations on Admin accounts
- System-wide logs and monitoring
- Institution limit management
- Sample data access for testing

**API Endpoints:**
```
POST   /superadmin/login              - SuperAdmin authentication
GET    /superadmin/institutions       - View sample institutions
GET    /superadmin/logs               - System logs
GET    /superadmin/admins             - List all admins
POST   /superadmin/admins             - Create admin account
PUT    /superadmin/admins/:id         - Update admin account
DELETE /superadmin/admins/:id         - Delete admin account
```

#### **Admin**
- Manages multiple institutions (with limits set by SuperAdmin)
- Full CRUD operations on institutions
- Contributor management
- System announcements to institutions
- Chat with institutions
- Activity logging

**API Endpoints:**
```
POST   /admin/login                   - Admin authentication
GET    /admin/institutions            - List institutions (by admin)
POST   /admin/institutions            - Create institution
PUT    /admin/institutions/:id        - Update institution
DELETE /admin/institutions/:id        - Delete institution
POST   /admin/contributors            - Create contributor
GET    /admin/contributors            - List contributors
PUT    /admin/contributors/:id        - Update contributor
DELETE /admin/contributors/:id        - Delete contributor
POST   /admin/announcements           - Create announcement
GET    /admin/announcements           - List announcements
GET    /admin/institution/:id/chat    - Chat with institution
POST   /admin/institution/:id/chat    - Send message to institution
GET    /admin/logs                    - View admin logs
```

#### **Institution Admin**
- Complete control over institution operations
- Manage faculty, students, batches
- Create and manage tests/assessments
- Question library management
- Internal announcements
- Bidirectional chat with admin
- Internal chat system

**API Endpoints:**
```
POST   /institution/login             - Institution authentication
GET    /institution/welcome           - Dashboard data
GET    /institution/faculties         - List faculty
POST   /institution/faculties         - Create faculty
PUT    /institution/faculties/:id     - Update faculty
DELETE /institution/faculties/:id     - Delete faculty
GET    /institution/students          - List students
POST   /institution/students          - Create student
PUT    /institution/students/:id      - Update student
DELETE /institution/students/:id      - Delete student
GET    /institution/batches           - List batches
POST   /institution/batches           - Create batch
PUT    /institution/batches/:id       - Update batch
DELETE /institution/batches/:id       - Delete batch
GET    /institution/questions         - Question library
POST   /institution/questions         - Create question
PATCH  /institution/questions/:id     - Update question
DELETE /institution/questions/:id     - Delete question
GET    /institution/tests             - List tests
POST   /institution/tests             - Create test
PUT    /institution/tests/:id         - Update test
DELETE /institution/tests/:id         - Delete test
POST   /institution/tests/:id/assign  - Assign test to batches
GET    /institution/announcements     - List announcements
POST   /institution/announcements     - Create announcement
POST   /institution/chat              - Send chat message
GET    /institution/chat              - View chat messages
POST   /institution/admin-chat        - Chat with admin
GET    /institution/admin-chat        - View admin chat
```

#### **Faculty**
- View assigned batches
- Access announcements
- View assigned tests
- See test results for their batches
- Participate in institution chat

**API Endpoints:**
```
POST   /institution/faculty/login              - Faculty authentication
GET    /institution/faculty/announcements      - View announcements
GET    /institution/faculty/batches            - View assigned batches
GET    /institution/faculty/tests              - View assigned tests
GET    /institution/faculty/tests/:id/results  - View test results
POST   /institution/faculty/chat               - Send chat message
GET    /institution/faculty/chat               - View chat messages
```

#### **Student**
- View announcements
- Access assigned tests
- Take tests (start/submit)
- View test results
- Personal dashboard

**API Endpoints:**
```
POST   /institution/student/login          - Student authentication
GET    /institution/student/announcements  - View announcements
GET    /institution/student/tests          - List available tests
GET    /institution/student/tests/:id      - View specific test
POST   /institution/student/tests/:id/start - Start test attempt
POST   /institution/student/tests/:id/submit - Submit test
```

#### **Contributor**
- Specialized role for content contribution
- Protected dashboard access
- Future expansion for question bank contributions

**API Endpoints:**
```
POST   /contributor/login      - Contributor authentication
GET    /contributor/dashboard  - Contributor dashboard
```

---

### 2. Test Management System

#### Features:
- **Question Library:** Centralized repository of questions per institution
- **Test Creation:** Custom tests with multiple questions
- **Batch Assignment:** Assign tests to specific student batches
- **Test Attempts:** Track student attempts with timestamps
- **Result Management:** Faculty can view batch performance
- **Submission Tracking:** Complete audit trail of test submissions

#### Workflow:
1. Institution creates questions in library
2. Institution creates test and adds questions
3. Test is assigned to specific batches
4. Students see assigned tests in dashboard
5. Students start test (creates attempt record)
6. Students submit answers
7. Faculty views results by batch and test

---

### 3. Announcement System

#### Features:
- **Multi-target Broadcasting:** Announcements can target:
  - Entire institutions
  - Specific batches
  - Individual students
  - Faculty members
- **Read Status Tracking:** Mark announcements as read
- **Hierarchical Creation:**
  - Admins → Institutions
  - Institutions → Faculty/Students/Batches

#### Use Cases:
- System-wide notifications
- Institutional updates
- Batch-specific information
- Student-targeted messages

---

### 4. Real-time Communication

#### Chat Features:

**Admin ↔ Institution Chat:**
- Dedicated channels per institution
- Message history
- Real-time communication for support

**Institution Internal Chat:**
- Faculty participation
- Institution-wide discussions
- Separate admin communication channel

**Admin-Institution Private Chat:**
- Separate from public chat
- Direct administrative communication
- Enhanced privacy

---

### 5. Dashboard & Analytics

Each role has a customized dashboard:
- **SuperAdmin:** System overview, admin management
- **Admin:** Institution metrics, activity logs
- **Institution:** Faculty/student/test statistics
- **Faculty:** Assigned batches, test results
- **Student:** Available tests, announcements

---

## 🚀 Deployment to Render.com

### Prerequisites
- GitHub repository with codebase
- MongoDB Atlas database
- Render.com account

### Step 1: Repository Setup

1. **Project Structure:**
```
GradEdgeDev/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── middleware/
│   ├── package.json
│   └── .env (not committed)
├── frontend/
│   ├── src/
│   ├── dist/ (generated)
│   ├── .env.production
│   ├── .env.development
│   └── package.json
├── package.json (root)
└── .gitignore
```

2. **Environment Files Created:**

**`frontend/.env.production`:**
```env
# Production environment - Render deployment URL
VITE_API_URL=https://gradedgedev.onrender.com
```

**`frontend/.env.development`:**
```env
# Development environment - point to local backend
VITE_API_URL=http://localhost:5001
```

**`frontend/.env`:**
```env
# API URL for production - empty string means same domain (relative URLs)
VITE_API_URL=
```

### Step 2: Root Package.json Configuration

**Key Scripts:**
```json
{
  "scripts": {
    "install:all": "npm install --prefix backend && npm install --prefix frontend",
    "build:frontend": "npm install --prefix frontend && npm run build --prefix frontend",
    "start": "npm install --prefix backend && node backend/src/server.js",
    "start:prod": "npm install --prefix backend && node backend/src/server.js",
    "dev:backend": "npm run dev --prefix backend"
  }
}
```

**Critical Changes Made:**
- `build:frontend` now installs dependencies before building
- `start:prod` no longer rebuilds frontend (Render does this separately)
- `start` command installs backend dependencies on every start

### Step 3: Backend Configuration

**`backend/src/server.js` - Key Features:**

1. **Port Configuration:**
```javascript
const PORT = process.env.PORT || 5001;
```
- Uses Render's dynamic PORT environment variable
- Fallback to 5001 for local development

2. **MongoDB Connection:**
```javascript
const mongoUri = (process.env.MONGO_URI || '').trim();
if (mongoUri) {
  mongoose.connect(mongoUri, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err.message));
}
```

3. **Static File Serving:**
```javascript
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}
```

4. **SPA Routing Middleware:**
```javascript
// Serves index.html for browser navigation (not API calls)
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  
  const acceptHeader = req.headers.accept || '';
  const wantsHtml = acceptHeader.includes('text/html');
  const wantsJson = acceptHeader.includes('application/json');
  
  if (wantsHtml && !wantsJson && fs.existsSync(frontendDist)) {
    return res.sendFile(path.join(frontendDist, 'index.html'));
  }
  next();
});
```

**Environment Variables Required:**
- `SUPERADMIN_USERNAME` - SuperAdmin login username
- `SUPERADMIN_PASSWORD` - SuperAdmin login password
- `MONGO_URI` - MongoDB connection string
- `SUPERADMIN_JWT_SECRET` - JWT secret for SuperAdmin
- `ADMIN_JWT_SECRET` - JWT secret for Admin
- `INSTITUTION_JWT_SECRET` - JWT secret for Institution/Faculty/Student
- `PORT` - (Optional) Set by Render automatically

**Note:** Removed hardcoded `PORT=5001` from `.env` to let Render control the port

### Step 4: Render.com Configuration

#### Creating the Web Service

1. **Connect Repository:**
   - Go to Render.com Dashboard
   - Click "New +" → "Web Service"
   - Connect GitHub account
   - Select repository: `Thiganth-K/GradEdgeDev`
   - Branch: `main`

2. **Build Configuration:**
   ```
   Name: gradedgedev
   Environment: Node
   Region: Oregon (US West) or your preferred region
   Branch: main
   Build Command: npm run build:frontend
   Start Command: npm run start:prod
   ```

3. **Instance Configuration:**
   ```
   Plan: Free (or upgrade as needed)
   Auto-Deploy: Yes (deploys on git push)
   ```

4. **Environment Variables Setup:**
   
   Navigate to "Environment" tab and add:
   
   | Key | Value | Notes |
   |-----|-------|-------|
   | `SUPERADMIN_USERNAME` | `thiganth` | Your superadmin username |
   | `SUPERADMIN_PASSWORD` | `thiganth` | Your superadmin password |
   | `MONGO_URI` | `mongodb+srv://user:pass@cluster...` | MongoDB Atlas connection string |
   | `SUPERADMIN_JWT_SECRET` | `some-strong-secret` | JWT secret for SuperAdmin tokens |
   | `ADMIN_JWT_SECRET` | `very-some-strong-secret` | JWT secret for Admin tokens |
   | `INSTITUTION_JWT_SECRET` | `suspiciously-very-strong-secret` | JWT secret for Institution tokens |

   **Security Note:** Use strong, unique secrets in production!

5. **Click "Create Web Service"**

### Step 5: Deployment Process

#### How Render Deploys:

1. **Build Phase:**
   ```bash
   # Render executes:
   npm run build:frontend
   
   # Which runs:
   npm install --prefix frontend && npm run build --prefix frontend
   ```
   - Installs frontend dependencies
   - Builds React app with Vite
   - Creates optimized production bundle in `frontend/dist/`
   - Uses `.env.production` for build-time environment variables

2. **Deploy Phase:**
   ```bash
   # Render executes:
   npm run start:prod
   
   # Which runs:
   npm install --prefix backend && node backend/src/server.js
   ```
   - Installs backend dependencies
   - Starts Express server
   - Server serves static frontend files
   - API routes handle backend requests

#### Auto-Deploy Workflow:

```
Local Development → Git Commit → Push to GitHub → Render Auto-Deploy
```

Every push to `main` branch triggers:
1. Pull latest code
2. Run build command
3. Upload build artifacts
4. Deploy new version
5. Health check
6. Route traffic to new deployment

### Step 6: Troubleshooting Issues Encountered

#### Issue 1: TypeScript Build Errors
**Problem:**
```
error TS2688: Cannot find type definition file for 'vite/client'
error TS2688: Cannot find type definition file for 'node'
```

**Cause:** Dependencies not installed before build

**Solution:** Updated `build:frontend` script:
```json
"build:frontend": "npm install --prefix frontend && npm run build --prefix frontend"
```

#### Issue 2: Connection Refused Errors
**Problem:**
```
POST http://localhost:5001/superadmin/login net::ERR_CONNECTION_REFUSED
```

**Cause:** Frontend built with `localhost:5001` URL instead of production URL

**Solution:** Created `.env.production` with proper URL:
```env
VITE_API_URL=https://gradedgedev.onrender.com
```

#### Issue 3: Frontend Not Updating
**Problem:** Old frontend build served after changes

**Cause:** `start:prod` was rebuilding frontend, causing cached version issues

**Solution:** Separated build and start:
- **Build:** Only runs during Render's build phase
- **Start:** Only starts the server (no rebuild)

#### Issue 4: Port Binding Issues
**Problem:** "No open ports detected" warnings

**Cause:** Hardcoded `PORT=5001` in `.env` conflicting with Render's dynamic port

**Solution:** 
- Removed `PORT` from `.env` file
- Server code already uses: `const PORT = process.env.PORT || 5001`
- Render sets `PORT` automatically

---

## 📊 Monitoring & Logs

### Render Dashboard
- **Logs:** Real-time log streaming
- **Metrics:** CPU, Memory, Bandwidth usage
- **Events:** Deployment history
- **Health Checks:** Automatic health monitoring

### Application Logging
The application includes comprehensive debug logging:

```javascript
console.log('[REQ] ${timestamp} ${method} ${path}');
console.log('[SuperAdmin.login] authenticated - generated token');
console.log('[Institution.createBatch] ✓ created batch - id, name');
```

All routes and controllers log:
- WHO performed the action (username/role)
- WHAT action was performed
- Input parameters/payloads
- Operation results (success ✓ or failure ✗)

---

## 🔐 Security Best Practices

### Implemented:
1. **JWT Authentication:** All protected routes require valid tokens
2. **Role-Based Middleware:** `verifyAdmin`, `verifyInstitution`, `verifyFaculty`, etc.
3. **Password Hashing:** bcrypt for password storage
4. **CORS Protection:** Configured CORS headers
5. **Environment Variables:** Secrets not in codebase
6. **Input Validation:** Basic validation on all inputs

### Recommendations:
1. **Use Strong Secrets:** Replace placeholder secrets with cryptographically strong values
2. **Enable Rate Limiting:** Add express-rate-limit middleware
3. **Helmet.js:** Add security headers
4. **HTTPS Only:** Enforce HTTPS (Render does this automatically)
5. **Regular Updates:** Keep dependencies updated
6. **Audit Logs:** Comprehensive logging already implemented

---

## 🧪 Testing

### Local Development:
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Production Testing:
- **URL:** https://gradedgedev.onrender.com
- **SuperAdmin Login:** https://gradedgedev.onrender.com/login
  - Username: `thiganth`
  - Password: `thiganth`

---

## 📈 Scaling Considerations

### Current Setup:
- Single web service (backend + frontend)
- MongoDB Atlas (shared cluster)
- Render Free Tier

### Future Scaling:
1. **Separate Services:**
   - Dedicated frontend service (static hosting)
   - Dedicated backend API service
   - Better performance isolation

2. **Database:**
   - Upgrade to dedicated MongoDB cluster
   - Read replicas for better performance
   - Database indexes optimization

3. **CDN:**
   - CloudFlare or similar for static assets
   - Reduced latency for global users

4. **Caching:**
   - Redis for session management
   - Response caching for frequent queries

5. **Load Balancing:**
   - Multiple backend instances
   - Horizontal scaling

---

## 🔄 Continuous Deployment Workflow

### Current Flow:
```
1. Develop locally on feature branch
2. Test changes
3. Merge to main branch
4. Push to GitHub
5. Render auto-deploys (2-3 minutes)
6. Health check passes
7. New version live
```

### Git Workflow:
```bash
# Feature development
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Merge to main
git checkout main
git merge feature/new-feature
git push origin main
# Render auto-deploys
```

---

## 📝 Maintenance

### Regular Tasks:
1. **Monitor Logs:** Check Render dashboard daily
2. **Database Backups:** MongoDB Atlas automatic backups
3. **Dependency Updates:** Monthly security updates
4. **Performance Review:** Weekly metrics review
5. **Error Tracking:** Monitor error rates

### Update Process:
```bash
# Update dependencies
npm update --prefix backend
npm update --prefix frontend

# Test locally
npm run start:prod

# Commit and push
git add package*.json
git commit -m "Update dependencies"
git push
```

---

## 🎓 Deployment Summary

### What We Built:
- Full-stack educational management platform
- 6-tier role-based access control
- Test management system
- Real-time communication
- Announcement broadcasting

### How We Deployed:
1. Configured monorepo structure (backend + frontend)
2. Set up environment variables for dev/prod
3. Created Render web service
4. Configured build and start commands
5. Set up auto-deployment from GitHub
6. Fixed build issues (dependencies, ports, URLs)

### Current Status:
✅ Deployed at: https://gradedgedev.onrender.com
✅ Auto-deploy enabled from `main` branch
✅ All features functional
✅ Comprehensive logging enabled
✅ Environment properly configured

---

## 📞 Support & Resources

- **Render Documentation:** https://render.com/docs
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas/
- **Express.js:** https://expressjs.com/
- **React + Vite:** https://vitejs.dev/

---

**Deployment Date:** January 11, 2026  
**Platform:** Render.com  
**Status:** Production Ready ✅  
**Repository:** https://github.com/Thiganth-K/GradEdgeDev
