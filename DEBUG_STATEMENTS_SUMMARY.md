# Debug Statements Implementation Summary

## Overview
Comprehensive debug logging has been added to all controllers and route handlers for the GradEdge application. Each action now logs:
- WHO is performing the action (username/role)
- WHAT action is being performed
- Input parameters/payloads
- Operation results (success ✓ or failure ✗)
- Relevant data (IDs, names, counts)

---

## SuperAdmin Routes & Controllers

### Route Handlers (SuperAdminRoutes.js)
```
[SuperAdminRoutes] POST /login - SuperAdmin login
[SuperAdminRoutes] GET /institutions - Get sample institutions
[SuperAdminRoutes] GET /logs - Get system logs
[SuperAdminRoutes] GET /admins - List all admins (superadmin)
[SuperAdminRoutes] POST /admins - Create admin (superadmin)
[SuperAdminRoutes] PUT /admins/:id - Update admin (superadmin)
[SuperAdminRoutes] DELETE /admins/:id - Delete admin (superadmin)
```

### Controller Actions (SuperAdminControllers.js)

#### Login
- `[SuperAdmin.login]` - Authentication attempt with username
- Logs: credentials validation, success/failure

#### List Admins
- `[SuperAdmin.listAdmins]` - Called by: superadmin username
- Logs: ✓ found X admins

#### Create Admin
- `[SuperAdmin.createAdmin]` - Called by: superadmin username
- Logs: payload (username, institutionLimit)
- Logs: ✓ created admin - id, username, limit
- Logs: ✗ missing fields or username exists

#### Update Admin
- `[SuperAdmin.updateAdmin]` - Called by: superadmin username
- Logs: target id, payload (username, institutionLimit)
- Logs: ✓ updated - id, username, limit
- Logs: ✗ admin not found

#### Delete Admin
- `[SuperAdmin.deleteAdmin]` - Called by: superadmin username
- Logs: target id
- Logs: ✓ deleted admin - id, username
- Logs: ✗ admin not found

#### Institutions & Logs
- `[SuperAdmin.getInstitutions]` - Called by: user
- `[SuperAdmin.getLogs]` - Called by: user

---

## Admin Routes & Controllers

### Route Handlers (AdminRoutes.js)
```
[AdminRoutes] POST /login - Admin login
[AdminRoutes] GET /institutions - List institutions (admin)
[AdminRoutes] POST /institutions - Create institution (admin)
[AdminRoutes] PUT /institutions/:id - Update institution (admin)
[AdminRoutes] DELETE /institutions/:id - Delete institution (admin)
[AdminRoutes] GET /sample-institutions - Get sample institutions
[AdminRoutes] GET /logs - Get admin logs
```

### Controller Actions (AdminControllers.js)

#### Login
- `[Admin.login]` - Authentication with username
- Logs: user found/not found, password validation, success

#### List Institutions
- `[Admin.listInstitutions]` - Called by: admin username
- Logs: ✓ found X institutions

#### Create Institution
- `[Admin.createInstitution]` - Called by: admin username
- Logs: payload (name, institutionId, location)
- Logs: ✗ missing fields or institutionId exists
- Logs: ✗ limit reached (current vs limit)
- Logs: ✓ created - id, name, institutionId

#### Update Institution
- `[Admin.updateInstitution]` - Called by: admin username
- Logs: target id, payload (name, location, contactNo)
- Logs: ✓ updated - id, name
- Logs: ✗ unauthorized or institution not found

#### Delete Institution
- `[Admin.deleteInstitution]` - Called by: admin username
- Logs: target id
- Logs: ✓ deleted institution - id, name
- Logs: ✗ unauthorized or institution not found

---

## Institution Routes & Controllers

### Route Handlers (InstitutionRoutes.js)
```
Authentication:
[InstitutionRoutes] POST /login - Institution login
[InstitutionRoutes] POST /faculty/login - Faculty login
[InstitutionRoutes] POST /student/login - Student login
[InstitutionRoutes] GET /welcome - Welcome (institution)

Faculty Self-Service:
[InstitutionRoutes] GET /faculty/announcements - List faculty announcements
[InstitutionRoutes] GET /faculty/batches - List faculty batches

Faculty Management:
[InstitutionRoutes] GET /faculties - List faculties (institution)
[InstitutionRoutes] POST /faculties - Create faculty (institution)
[InstitutionRoutes] PUT /faculties/:id - Update faculty (institution)
[InstitutionRoutes] DELETE /faculties/:id - Delete faculty (institution)

Student Management:
[InstitutionRoutes] GET /students - List students (institution)
[InstitutionRoutes] POST /students - Create student (institution)
[InstitutionRoutes] PUT /students/:id - Update student (institution)
[InstitutionRoutes] DELETE /students/:id - Delete student (institution)

Batch Management:
[InstitutionRoutes] GET /batches - List batches (institution)
[InstitutionRoutes] POST /batches - Create batch (institution)
[InstitutionRoutes] PUT /batches/:id - Update batch (institution)
[InstitutionRoutes] DELETE /batches/:id - Delete batch (institution)

Question Library:
[InstitutionRoutes] GET /questions - List questions (institution)
[InstitutionRoutes] POST /questions - Create question (institution)
[InstitutionRoutes] PATCH /questions/:id - Update question (institution)
[InstitutionRoutes] DELETE /questions/:id - Delete question (institution)

Test Management:
[InstitutionRoutes] GET /tests - List tests (institution)
[InstitutionRoutes] GET /tests/:id - Get test (institution)
[InstitutionRoutes] POST /tests - Create test (institution)
[InstitutionRoutes] PUT /tests/:id - Update test (institution)
[InstitutionRoutes] DELETE /tests/:id - Delete test (institution)
[InstitutionRoutes] POST /tests/:id/assign - Assign test to batches (institution)

Student Test Participation:
[InstitutionRoutes] GET /student/tests - List available tests (student)
[InstitutionRoutes] GET /student/tests/:id - Get test (student)
[InstitutionRoutes] POST /student/tests/:id/start - Start test attempt (student)
[InstitutionRoutes] POST /student/tests/:id/submit - Submit test attempt (student)

Faculty Test Views:
[InstitutionRoutes] GET /faculty/tests - List assigned tests (faculty)
[InstitutionRoutes] GET /faculty/tests/:id/results - Get test results (faculty)
```

### Controller Actions (InstitutionControllers.js)

#### Faculty Login
- `[Institution.facultyLogin]` - Username provided
- Logs: ✗ missing credentials or faculty not found
- Logs: ✗ invalid password
- Logs: ✓ authenticated faculty - username, role

#### Student Login
- `[Institution.studentLogin]` - Username provided
- Logs: ✗ missing credentials or student not found
- Logs: ✗ invalid password
- Logs: ✓ authenticated student - username

#### Faculty Announcements
- `[Institution.listFacultyAnnouncements]` - Called by: faculty
- Logs: ✓ found X announcements (batches, tests)

#### Faculty Batches
- `[Institution.listFacultyBatches]` - Called by: faculty
- Logs: ✓ found X batches

#### Faculty CRUD Operations
- `[Institution.listFaculties]` - Institution name
  - Logs: ✓ found X faculties
  
- `[Institution.createFaculty]` - Institution name, payload (username, role)
  - Logs: ✗ missing fields or username taken
  - Logs: ✓ created - id, username, role
  
- `[Institution.updateFaculty]` - Institution name, target id
  - Logs: ✓ updated - id, username
  - Logs: ✗ faculty not found
  
- `[Institution.deleteFaculty]` - Institution name, target id
  - Logs: ✓ deleted - id, username
  - Logs: ✗ faculty not found

#### Student CRUD Operations
- `[Institution.listStudents]` - Institution name
  - Logs: ✓ found X students
  
- `[Institution.createStudent]` - Institution name, payload (username, name, dept, regno)
  - Logs: ✗ missing fields or username taken
  - Logs: ✓ created - id, username, name
  
- `[Institution.updateStudent]` - Institution name, target id
  - Logs: ✓ updated - id, username
  - Logs: ✗ student not found
  
- `[Institution.deleteStudent]` - Institution name, target id
  - Logs: ✓ deleted - id, username
  - Logs: ✗ student not found

#### Batch CRUD Operations
- `[Institution.listBatches]` - Institution name
  - Logs: ✓ found X batches
  
- `[Institution.createBatch]` - Institution name, payload (name, facultyId, studentCount)
  - Logs: ✗ missing name
  - Logs: ✓ created - id, name, studentCount
  
- `[Institution.updateBatch]` - Institution name, target id
  - Logs: ✓ updated - id, name
  - Logs: ✗ batch not found
  
- `[Institution.deleteBatch]` - Institution name, target id
  - Logs: ✓ deleted - id, name
  - Logs: ✗ batch not found

#### Question Library CRUD
- `[Institution.listQuestions]` - Institution name, optional category filter
  - Logs: ✓ found X questions
  
- `[Institution.createQuestion]` - Institution name, payload (category, difficulty, options count)
  - Logs: ✗ invalid payload or invalid category
  - Logs: ✓ created - id, category
  
- `[Institution.updateQuestion]` - Institution name, target id
  - Logs: ✓ updated - id
  - Logs: ✗ question not found
  
- `[Institution.deleteQuestion]` - Institution name, target id
  - Logs: ✓ deleted - id
  - Logs: ✗ question not found

#### Test CRUD Operations
- `[Institution.listTests]` - Institution name
  - Logs: ✓ found X tests
  
- `[Institution.getTest]` - Institution name, target id
  - Logs: ✓ found - id, name
  - Logs: ✗ test not found
  
- `[Institution.createTest]` - Institution name, payload (name, type, duration, batchCount)
  - Logs: ✗ invalid payload
  - Logs: ✗ no questions provided
  - Logs: ✓ created - id, name, question count
  
- `[Institution.updateTest]` - Institution name, target id
  - Logs: questions removed/added counts
  - Logs: ✓ updated - id, question count
  - Logs: ✗ test not found
  
- `[Institution.assignTestBatches]` - Institution name, test id, batch count
  - Logs: ✓ assigned X batches
  - Logs: ✗ test not found
  
- `[Institution.deleteTest]` - Institution name, target id
  - Logs: ✓ deleted test - id, name
  - Logs: also deleted X test attempts
  - Logs: ✗ test not found

#### Student Test Participation
- `[Institution.listStudentTests]` - Called by: student username
  - Logs: ✓ found X available tests (from Y batches)
  - Logs: ✗ unauthorized
  
- `[Institution.getStudentTest]` - Student username, test id
  - Logs: ✓ found - name, question count
  - Logs: ✗ test not found or not assigned
  
- `[Institution.startTestAttempt]` - Student username, test id
  - Logs: ✓ new attempt created - id OR existing attempt found
  - Logs: ✗ test not found
  - Logs: ✗ student not eligible
  
- `[Institution.submitTestAttempt]` - Student username, test id, response count
  - Logs: ✓ submitted - score, correct count
  - Logs: ✗ test not found
  - Logs: ✗ invalid response count

#### Faculty Test Views
- `[Institution.listAssignedTestsForFaculty]` - Faculty username
  - Logs: ✓ found X assigned tests
  
- `[Institution.getTestResultsForFaculty]` - Faculty username, test id
  - Logs: ✓ found results - total students, completed count
  - Logs: ✗ test not found
  - Logs: ✗ forbidden (test not assigned)

---

## Debug Format Standards

All debug statements follow these patterns:

### Success Logs
```javascript
console.log('[Module.action] ✓ description - details');
```

### Error Logs
```javascript
console.log('[Module.action] ✗ description - details');
console.error('[Module.action] ✗ error:', err.message);
```

### Info Logs
```javascript
console.log('[Module.action] description');
```

### Common Variables Logged
- `username` - Actor's username
- `id` - Resource ID (admin, institution, test, etc.)
- `name` - Resource name
- `count` - Number of items
- `role` - User role
- `category` - Question category
- `score` / `correct` - Test scores

---

## Usage for Debugging

When troubleshooting:
1. Check server console for timestamp and action logs
2. Look for `✗` symbols to identify failure points
3. Trace through action sequence by following username + action
4. Monitor payload changes through update operations
5. Check counts for batch operations (students, questions, etc.)

**Example flow:**
```
[Institution.createStudent] called by institution: "City University"
[Institution.createStudent] payload: { username: john_doe, name: John Doe, dept: CSE, regno: CS001 }
[Institution.createStudent] ✓ created - id: 60d5ec49c1234567890abc12, username: john_doe, name: John Doe
```

