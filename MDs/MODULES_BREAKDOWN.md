# GradEdge — Modules Breakdown

> **Stack:** Node.js / Express (backend) · React + TypeScript + Tailwind CSS (frontend) · MongoDB / Mongoose (database)

---

## Table of Contents

1. [System Roles & Access Hierarchy](#1-system-roles--access-hierarchy)
2. [Backend Modules](#2-backend-modules)
   - 2.1 [SuperAdmin Module](#21-superadmin-module)
   - 2.2 [Admin Module](#22-admin-module)
   - 2.3 [Contributor Module](#23-contributor-module)
   - 2.4 [Institution Module](#24-institution-module)
   - 2.5 [Faculty Module](#25-faculty-module)
   - 2.6 [Student Module](#26-student-module)
   - 2.7 [Chat Module](#27-chat-module)
   - 2.8 [Coding Test Module](#28-coding-test-module)
   - 2.9 [Middleware](#29-middleware)
   - 2.10 [Shared Models](#210-shared-models)
3. [Frontend Modules](#3-frontend-modules)
   - 3.1 [SuperAdmin Portal](#31-superadmin-portal)
   - 3.2 [Admin Portal](#32-admin-portal)
   - 3.3 [Contributor Portal](#33-contributor-portal)
   - 3.4 [Institution Portal](#34-institution-portal)
   - 3.5 [Faculty Portal](#35-faculty-portal)
   - 3.6 [Student Portal](#36-student-portal)
   - 3.7 [Shared / Lib](#37-shared--lib)
4. [Data Flow: Question Lifecycle](#4-data-flow-question-lifecycle)
5. [API Endpoint Reference](#5-api-endpoint-reference)

---

## 1. System Roles & Access Hierarchy

```
SuperAdmin
  └── Admin
        ├── Contributor  (external question authors)
        └── Institution
              ├── Faculty
              └── Student
```

| Role | Auth Token Key | JWT Secret Env Var | Token Storage |
|---|---|---|---|
| SuperAdmin | `superadmin_token` | `SUPERADMIN_JWT_SECRET` | localStorage |
| Admin | `admin_token` | `ADMIN_JWT_SECRET` | localStorage |
| Contributor | `contributor_token` | (admin secret, separate claim) | localStorage |
| Institution | `institution_token` | `INSTITUTION_JWT_SECRET` | localStorage |
| Faculty | `faculty_token` | `INSTITUTION_JWT_SECRET` | localStorage |
| Student | `student_token` | `INSTITUTION_JWT_SECRET` | localStorage |

---

## 2. Backend Modules

### 2.1 SuperAdmin Module

**Route prefix:** `/superadmin`  
**Files:** `routes/SuperAdmin/SuperAdminRoutes.js` · `controllers/SuperAdmin/SuperAdminControllers.js`  
**Auth middleware:** `verifySuperAdmin`

| Responsibility | Endpoints |
|---|---|
| Authentication | `POST /superadmin/login` |
| Admin CRUD | `GET/POST /superadmin/admins`, `PUT/DELETE /superadmin/admins/:id` |
| Dashboard stats | `GET /superadmin/dashboard-stats` |
| System vitals | `GET /superadmin/system-vitals` |
| System logs | `GET /superadmin/logs` |
| Profile | `GET /superadmin/me` |
| Chat with admins | `GET/POST /superadmin/admin-chats`, `POST …/read`, `GET …/unread/count` |

**Model:** `Admin.js` (CRUD target), `SuperadminAdminChat.js` (chat)

---

### 2.2 Admin Module

**Route prefix:** `/admin`  
**Files:** `routes/Admin/AdminRoutes.js` · `controllers/Admin/AdminControllers.js` · `controllers/Admin/AdminLogController.js`  
**Auth middleware:** `verifyAdmin`

| Responsibility | Endpoints |
|---|---|
| Authentication | `POST /admin/login` |
| Institution CRUD | `GET/POST /admin/institutions`, `PUT/DELETE /admin/institutions/:id` |
| Institution batches | `GET /admin/institution/:id/batches` |
| Contributor CRUD | `GET/POST /admin/contributors`, `GET/PUT/DELETE /admin/contributors/:id` |
| Announcements | `GET/POST /admin/announcements` |
| Action logs | `GET /admin/logs`, `POST /admin/logs/clear` |
| Contributor request workflow | `GET /admin/contributor-requests`, `GET …/:id`, `PUT …/:id/status` |
| Contributor chat | `GET/POST /admin/contributor-chats`, `…/:id/message`, `…/:id/read`, `…/unread/count` |
| Admin ↔ Institution chat | `GET/POST /admin/institution/:id/chat`, `GET/POST /admin/institution/:id/admin-chat` |
| Admin ↔ SuperAdmin chat | `GET/POST /admin/superadmin-chats`, `…/:name/message`, `…/:name/read`, `…/unread/count` |
| Library management | `GET /admin/library/questions-by-contributor`, `GET …/contributor/:id`, `POST/DELETE …/questions/:id`, `GET …/structure` |
| Pending contributor question review | `GET /admin/contributor-questions/pending`, `PUT …/:id/approve`, `PUT …/:id/reject` |

**Models:** `Institution.js`, `Contributor.js`, `Announcement.js`, `AdminLog.js`, `ContributorRequest.js`, `AdminContributorChat.js`, `AdminInstitutionChat.js`, `SuperadminAdminChat.js`, `Library.js`, `ContributorQuestion.js`

---

### 2.3 Contributor Module

**Route prefix:** `/contributor`  
**Files:** `routes/Contributor/ContributorRoutes.js` · `controllers/Contributor/ContributorControllers.js` · `controllers/Contributor/ContributorQuestionControllers.js` · `controllers/Contributor/BulkQuestionControllers.js`  
**Auth middleware:** `verifyContributor`

| Responsibility | Endpoints |
|---|---|
| Authentication | `POST /contributor/login` |
| Dashboard | `GET /contributor/dashboard` |
| Contribution requests | `GET/POST /contributor/requests`, `GET /contributor/requests/:id` |
| Question CRUD (individual) | `GET/POST /contributor/contributions`, `GET/PUT/DELETE /contributor/contributions/:id` |
| Image uploads (question / options / solutions) | `POST /contributor/contributions` (multipart, Multer, Cloudinary) |
| Bulk question upload | `GET /contributor/bulk/template` · `POST /contributor/bulk/parse` (xlsx/csv, 50 MB limit) |
| Library view | `GET /contributor/library/my-questions`, `GET /contributor/library/structure` |
| Chat with admin | `GET/POST /contributor/chat`, `POST /contributor/chat/message`, `POST /contributor/chat/read`, `GET /contributor/chat/unread` |

**Models:** `ContributorQuestion.js`, `ContributorRequest.js`, `AdminContributorChat.js`, `Library.js`

---

### 2.4 Institution Module

**Route prefix:** `/institution`  
**Files:** `routes/Institution/InstitutionRoutes.js` · `controllers/Institution/InstitutionControllers.js`  
**Auth middleware:** `verifyInstitution` / `verifyFaculty` / `verifyStudent`

| Responsibility | Endpoints | Auth |
|---|---|---|
| Authentication | `POST /institution/login`, `POST /institution/faculty/login`, `POST /institution/student/login` | public |
| Faculty CRUD | `GET/POST /institution/faculties`, `PUT/DELETE /institution/faculties/:id` | institution |
| Student CRUD | `GET/POST /institution/students`, `PUT/DELETE /institution/students/:id` | institution |
| Batch CRUD | `GET/POST /institution/batches`, `PUT/DELETE /institution/batches/:id` | institution |
| Question library (read from global Library) | `GET /institution/questions` (`?category=aptitude\|technical\|psychometric\|coding`) | institution |
| Custom question CRUD | `POST/PATCH/DELETE /institution/questions` | institution |
| Test CRUD | `GET/POST /institution/tests`, `GET/PUT/DELETE /institution/tests/:id` | institution |
| Test assignment | `POST /institution/tests/:id/assign` | institution |
| Test preview (with answers) | `GET /institution/tests/:id/preview` | institution |
| Student: list / take test | `GET /institution/student/tests`, `GET /institution/student/tests/:id` | student |
| Student: start / submit | `POST /institution/student/tests/:id/start`, `POST /institution/student/tests/:id/submit` | student |
| Student: results | `GET /institution/student/results` | student |
| Student: run code | `POST /institution/student/run-code` | student |
| Faculty: test list & results | `GET /institution/faculty/tests`, `GET /institution/faculty/tests/:id/results` | faculty |
| Faculty: announcements & batches | `GET /institution/faculty/announcements`, `GET /institution/faculty/batches` | faculty |
| Announcements | `GET/POST /institution/announcements`, `POST …/:id/read` | institution |
| Announcements (faculty / student views) | `GET /institution/faculty/announcements/list`, `GET /institution/student/announcements` | faculty / student |
| Institution ↔ Admin chat | `GET/POST /institution/chat`, `GET/POST /institution/admin-chat` | institution |
| Faculty ↔ Admin chat | `GET/POST /institution/faculty/chat` | faculty |

**Models:** `Institution.js`, `Faculty.js`, `Student.js`, `Batch.js`, `Test.js`, `TestAttempt.js`, `Library.js`, `Question.js`, `InstitutionAnnouncement.js`, `AdminInstitutionChat.js`, `ChatMessage.js`

---

### 2.5 Faculty Module

**Route prefix:** `/faculty`  
**Files:** `routes/Faculty/FacultyRoutes.js` · `controllers/Faculty/FacultyControllers.js` · `controllers/Faculty/FacultyTestController.js`  
**Auth middleware:** `verifyFaculty`

| Responsibility | Endpoints |
|---|---|
| Faculty-created test CRUD | `GET/POST /faculty/tests`, `GET/PUT/DELETE /faculty/tests/:id` |
| Test evaluation (with correct answers) | `GET /faculty/tests/:id/evaluation` |
| Read question library | `GET /faculty/questions` |

**Models:** `FacultyTest.js`, `Library.js`

---

### 2.6 Student Module

Handled entirely within the Institution route prefix (`/institution/student/…`) — see §2.4.

**Models:** `Student.js`, `TestAttempt.js`

---

### 2.7 Chat Module

**Files:** `controllers/Chat/ChatControllers.js` · `controllers/Chat/AdminInstitutionChatControllers.js` · `controllers/Chat/SuperadminAdminChatControllers.js`

Three separate chat collections/controllers:

| Channel | Collection / Model | Parties |
|---|---|---|
| General (legacy) | `ChatMessage.js` | Admin ↔ Institution, Admin ↔ Faculty |
| Admin ↔ Institution private | `AdminInstitutionChat.js` | Admin ↔ Institution |
| Admin ↔ Contributor | `AdminContributorChat.js` | Admin ↔ Contributor |
| SuperAdmin ↔ Admin | `SuperadminAdminChat.js` | SuperAdmin ↔ Admin |

Features per channel: list messages, send message, mark as read, unread count.

---

### 2.8 Coding Test Module

**File:** `controllers/CodingTestController.js`  
**Endpoint:** `POST /institution/student/run-code` (student-protected)  
**External dependency:** Piston API (`PISTON_API_URL` env var, default `http://localhost:2000/api/v2/execute`)

Executes arbitrary code (30+ languages via Piston) against test cases and returns pass/fail per case with stdout/stderr.

---

### 2.9 Middleware

| File | Purpose |
|---|---|
| `verifyAdmin.js` | Verifies `ADMIN_JWT_SECRET` Bearer token |
| `verifySuperAdmin.js` | Verifies `SUPERADMIN_JWT_SECRET` Bearer token |
| `verifyInstitution.js` | Verifies `INSTITUTION_JWT_SECRET`, sets `req.institution` |
| `verifyFaculty.js` | Verifies `INSTITUTION_JWT_SECRET`, asserts `role=faculty`, sets `req.faculty` |
| `verifyStudent.js` | Verifies `INSTITUTION_JWT_SECRET`, asserts `role=student`, sets `req.student` |
| `verifyContributor.js` | Verifies contributor token, sets `req.contributor` |
| `actionLogger.js` | Logs every request to `AdminLog` collection (role + method + url + timestamp) |

---

### 2.10 Shared Models

| Model | Purpose | Key Fields |
|---|---|---|
| `Admin.js` | Admin accounts (created by SuperAdmin) | `username`, `email`, `password` (bcrypt), `institutionId` |
| `Institution.js` | Institution accounts | `name`, `email`, `password`, `address` |
| `Faculty.js` | Faculty accounts (under an institution) | `name`, `email`, `password`, `institutionId`, `assignedBatches` |
| `Student.js` | Student accounts | `name`, `email`, `password`, `institutionId`, `batchId`, `rollNumber` |
| `Batch.js` | Grouped students | `name`, `institutionId`, `students[]` |
| `Contributor.js` | External question authors | `name`, `email`, `password`, `expertise` |
| `ContributorQuestion.js` | Draft questions (pending review) | `question`, `options[]`, `subTopic`, `difficulty`, `questionType`, `status` (pending/approved/rejected) |
| `ContributorRequest.js` | Formal contribution request record | `contributorId`, `topic`, `questionCount`, `status` |
| `Library.js` | Approved master question bank | `question`, `options[]`, `topic` (Aptitude/Technical/Psychometric), `subtopic`, `difficulty`, `contributorId` |
| `Question.js` | Legacy question model (EmbeddedQuestion refs) | `text`, `options[{text, isCorrect}]`, `topic`, `difficulty` |
| `Test.js` | Institution tests | `name`, `type`, `libraryQuestionIds[]`, `customQuestions[]`, `questions[]` (legacy), `assignedBatches[]`, `assignedStudents[]`, `durationMinutes`, `startTime`, `endTime` |
| `FacultyTest.js` | Faculty-created tests | `name`, `facultyId`, `questions[]`, `durationMinutes` |
| `TestAttempt.js` | Student test submissions | `testId`, `studentId`, `answers[]`, `score`, `submittedAt`, `timeTakenSeconds` |
| `Announcement.js` | Global announcements (admin-created) | `title`, `content`, `createdBy` |
| `InstitutionAnnouncement.js` | Institution-scoped announcements | `title`, `content`, `institutionId`, `readBy[]` |
| `AdminLog.js` | Action audit log | `role`, `method`, `url`, `timestamp`, `body` |
| `ChatMessage.js` | Legacy chat messages | `senderId`, `senderRole`, `receiverId`, `content`, `createdAt` |
| `AdminInstitutionChat.js` | Admin ↔ Institution private chat | `adminId`, `institutionId`, `messages[]`, `unreadByAdmin`, `unreadByInstitution` |
| `AdminContributorChat.js` | Admin ↔ Contributor private chat | `adminId`, `contributorId`, `messages[]`, `unreadByAdmin`, `unreadByContributor` |
| `SuperadminAdminChat.js` | SuperAdmin ↔ Admin chat | `superadminName`, `adminId`, `messages[]`, `unreadBySuperAdmin`, `unreadByAdmin` |

---

## 3. Frontend Modules

### 3.1 SuperAdmin Portal

**Pages:** `src/pages/SuperAdmin/`  
**Sidebar:** `src/components/SuperAdmin/sidebar.tsx`

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/superadmin` | Stats cards (admins, institutions, etc.), recent activity |
| Admin Management | `/superadmin/admins` | CRUD for Admin accounts |
| Admin Chat | `/superadmin/admin-chats` | Chat with any admin |

---

### 3.2 Admin Portal

**Pages:** `src/pages/Admin/`  
**Sidebar:** `src/components/Admin/Sidebar.tsx`

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/admin` | Stats: institutions, contributors, pending questions, unread chats; quick actions |
| Institution Management | `/admin/institutions` | CRUD for institutions |
| Create Institution | `/admin/institutions/create` | New institution form |
| Faculty Management | `/admin/faculties` | View all faculties across institutions |
| Contributor Management | `/admin/contributors` | CRUD for contributor accounts |
| Create Contributor | `/admin/contributors/create` | New contributor form |
| Contributor Requests | `/admin/contributor-requests` | Review and approve/reject contribution channel requests |
| Pending Questions | `/admin/pending-questions` | Review individual contributor questions; **approve** (with topic selector) or **reject** (with reason) |
| Library Management | `/admin/library` | Browse approved Library questions grouped by contributor/topic |
| Announcements | `/admin/announcements` | Create and manage global announcements |
| Institution Chat | `/admin/institution-chat` | Chat with institutions |
| Contributor Chat | `/admin/contributor-chat` | Chat with contributors |
| SuperAdmin Chat | `/admin/superadmin-chat` | Chat with SuperAdmin |
| View Logs | `/admin/logs` | Browse action audit log |

---

### 3.3 Contributor Portal

**Pages:** `src/pages/Contributor/`

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/contributor` | Stats: approved questions, requests, library count |
| Contribution Request | `/contributor/request` | Create a formal contribution request (topic + question count) |
| My Questions | `/contributor/contributions` | List, create, edit, delete individual contributed questions |
| Placement-Ready Questions | `/contributor/placement-questions` | Subset view: filter by placement-ready type |
| Library | `/contributor/library` | View own questions that were approved into Library |
| Chat | `/contributor/chat` | Chat with admin |

---

### 3.4 Institution Portal

**Pages:** `src/pages/Institution/`  
**Sidebar:** `src/components/Institution/Sidebar.tsx`

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/institution` | Overview stats |
| Faculty Management | `/institution/faculties` | CRUD for Faculty accounts |
| Student Management | `/institution/students` | CRUD for Student accounts (bulk CSV import supported) |
| Batch Management | `/institution/batches` | Manage batches, assign students |
| Test Management | `/institution/tests` | List, create, edit, delete tests |
| Create Test – Details | `/institution/tests/create` | Step 1: name, type, duration, schedule |
| Create Test – Questions | `/institution/tests/create/questions` | Step 2: pick library questions + add custom questions |
| Library | `/institution/library` | Browse approved Library questions (read-only) |
| Announcements | `/institution/announcements` | View global announcements from admin |
| Create Announcement | `/institution/announcements/create` | Create institution-scoped announcement for faculty/students |
| Chat with Admin | `/institution/chat` | Chat with admin |

---

### 3.5 Faculty Portal

**Pages:** `src/pages/Faculty/`  
**Sidebar:** `src/components/Faculty/Sidebar.tsx`

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/faculty` | Overview: assigned tests, batches, announcements |
| Assigned Tests | `/faculty/tests` | Tests assigned to this faculty for supervision |
| Faculty Tests | `/faculty/my-tests` | Tests created by the faculty themselves |
| Create Test | `/faculty/tests/create` | Create a faculty-scoped test |
| Test Edit | `/faculty/tests/:id/edit` | Edit a faculty test |
| Test Results | `/faculty/tests/:id/results` | View student results for a test |
| Announcements | `/faculty/announcements` | View institution + global announcements |
| Chat | `/faculty/chat` | Chat with admin (via institution chat system) |

---

### 3.6 Student Portal

**Pages:** `src/pages/Student/`  
**Sidebar:** `src/components/Student/Sidebar.tsx`

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/student` | Upcoming tests, recent results |
| Tests | `/student/tests` | Available tests with question count, duration, schedule |
| Take Test | `/student/tests/:id` | MCQ/Placement test attempt (timer, progress, submit) |
| Coding Test | `/student/coding-test/:id` | Full coding sandbox with editor, test cases, run/submit |
| Sandbox | `/student/sandbox` | Free-play coding sandbox (Piston code execution, no grading) |
| Results | `/student/results` | Past test attempt history and scores |
| Announcements | `/student/announcements` | Announcements from institution and admin |
| Profile | `/student/profile` | View/edit student profile |

---

### 3.7 Shared / Lib

| File | Purpose |
|---|---|
| `src/lib/api.ts` | `apiFetch` wrapper — prepends API base URL, handles JSON |
| `src/lib/makeHeaders.ts` | Builds `Authorization: Bearer <token>` headers from localStorage by token key; accepts optional `contentType` |
| `src/components/CodingSandbox/Editor.tsx` | Monaco-based code editor component (language selector, theme, font-size) |
| `src/App.tsx` | Root router — maps all `/superadmin/*`, `/admin/*`, `/contributor/*`, `/institution/*`, `/faculty/*`, `/student/*` paths |

---

## 4. Data Flow: Question Lifecycle

```
Contributor
  │
  ├─ Creates ContributorQuestion (status: "pending")
  │    └─ Optionally uploads images → Cloudinary → stores URLs
  │
  └─ Optionally bulk-uploads via XLSX/CSV → same ContributorQuestion records
         │
         ▼
Admin
  ├─ Reviews PendingContributorQuestions page
  ├─ Assign Topic (Aptitude / Technical / Psychometric) + optional Subtopic
  ├─ Approve  → Library.createFromContributorQuestion(doc, topic, subtopic)
  │               ContributorQuestion.status = "approved"
  │               Library entry created with topic, subtopic, options, difficulty
  │
  └─ Reject   → ContributorQuestion.status = "rejected", reason stored
         │
         ▼
Institution
  ├─ GET /institution/questions?category=aptitude
  │    → queries Library { topic: "Aptitude" } (+ null/missing topic for legacy)
  │
  ├─ Test Creation (Step 2):
  │    ├─ libraryQuestionIds[]  → references Library entries by _id
  │    └─ customQuestions[]     → fully embedded, test-specific (difficulty normalised to lowercase)
  │
  └─ Test.getAllQuestions() merges both lists for student delivery
         │
         ▼
Student
  ├─ GET /institution/student/tests/:id
  │    → Test.getAllQuestions() → merged array served to frontend
  │
  ├─ POST /institution/student/tests/:id/start  → creates TestAttempt (in-progress)
  └─ POST /institution/student/tests/:id/submit → scores attempt, stores results
```

---

## 5. API Endpoint Reference

### SuperAdmin  `/superadmin`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | — | Login |
| GET | `/admins` | — | List admins |
| POST | `/admins` | — | Create admin |
| PUT | `/admins/:id` | — | Update admin |
| DELETE | `/admins/:id` | — | Delete admin |
| GET | `/dashboard-stats` | — | Dashboard stats |
| GET | `/system-vitals` | — | System vitals |
| GET | `/logs` | — | System logs |
| GET | `/me` | SA | Profile |
| GET | `/admin-chats` | SA | List admin chats |
| GET | `/admin-chats/:adminId` | SA | Chat with admin |
| POST | `/admin-chats/:adminId/message` | SA | Send message |
| POST | `/admin-chats/:adminId/read` | SA | Mark as read |
| GET | `/admin-chats/unread/count` | SA | Unread count |

### Admin  `/admin`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | — | Login |
| GET | `/institutions` | A | List institutions |
| POST | `/institutions` | A | Create institution |
| PUT | `/institutions/:id` | A | Update institution |
| DELETE | `/institutions/:id` | A | Delete institution |
| GET | `/institution/:id/batches` | A | Get batches |
| GET | `/contributors` | A | List contributors |
| POST | `/contributors` | A | Create contributor |
| GET | `/contributors/:id` | A | Get contributor |
| PUT | `/contributors/:id` | A | Update contributor |
| DELETE | `/contributors/:id` | A | Delete contributor |
| GET | `/announcements` | A | List announcements |
| POST | `/announcements` | A | Create announcement |
| GET | `/logs` | A | Action logs |
| POST | `/logs/clear` | A | Archive & clear logs |
| GET | `/contributor-requests` | A | List requests |
| GET | `/contributor-requests/:id` | A | Get request |
| PUT | `/contributor-requests/:id/status` | A | Update status |
| GET | `/contributor-chats` | A | List contributor chats |
| GET | `/contributor-chats/:id` | A | Chat with contributor |
| POST | `/contributor-chats/:id/message` | A | Send message |
| POST | `/contributor-chats/:id/read` | A | Mark as read |
| GET | `/contributor-chats/unread/count` | A | Unread count |
| GET | `/institution/:id/admin-chat` | A | Admin-Institution chat |
| POST | `/institution/:id/admin-chat` | A | Send admin-inst message |
| GET | `/superadmin-chats` | A | List SA chats |
| POST | `/superadmin-chats/:name/message` | A | Send message to SA |
| GET | `/library/questions-by-contributor` | A | Library by contributor |
| POST | `/library/questions/:id` | A | Add to library |
| DELETE | `/library/questions/:id` | A | Remove from library |
| GET | `/library/structure` | A | Library structure |
| GET | `/contributor-questions/pending` | A | Pending questions |
| PUT | `/contributor-questions/:id/approve` | A | Approve question |
| PUT | `/contributor-questions/:id/reject` | A | Reject question |

### Contributor  `/contributor`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | — | Login |
| GET | `/dashboard` | C | Dashboard |
| GET | `/requests` | C | My requests |
| POST | `/requests` | C | Create request |
| GET | `/requests/:id` | C | Get request |
| GET | `/contributions` | C | My questions |
| POST | `/contributions` | C | Create question (multipart) |
| GET | `/contributions/:id` | C | Get question |
| PUT | `/contributions/:id` | C | Update question |
| DELETE | `/contributions/:id` | C | Delete question |
| GET | `/bulk/template` | C | Download template |
| POST | `/bulk/parse` | C | Parse Excel/CSV upload |
| GET | `/library/my-questions` | C | My library questions |
| GET | `/library/structure` | C | Library structure |
| GET | `/chat` | C | Chat thread |
| POST | `/chat/message` | C | Send message |
| POST | `/chat/read` | C | Mark read |
| GET | `/chat/unread` | C | Unread count |

### Institution  `/institution`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | — | Institution login |
| POST | `/faculty/login` | — | Faculty login |
| POST | `/student/login` | — | Student login |
| GET/POST | `/faculties` | I | Faculty CRUD |
| PUT/DELETE | `/faculties/:id` | I | Faculty CRUD |
| GET/POST | `/students` | I | Student CRUD |
| PUT/DELETE | `/students/:id` | I | Student CRUD |
| GET/POST | `/batches` | I | Batch CRUD |
| PUT/DELETE | `/batches/:id` | I | Batch CRUD |
| GET | `/questions` | I | Library questions |
| POST | `/questions` | I | Create custom question |
| PATCH/DELETE | `/questions/:id` | I | Edit/delete question |
| GET/POST | `/tests` | I | Test CRUD |
| GET/PUT/DELETE | `/tests/:id` | I | Test CRUD |
| POST | `/tests/:id/assign` | I | Assign to batches |
| GET | `/tests/:id/preview` | I | Answer-sheet preview |
| GET | `/student/tests` | S | Available tests |
| GET | `/student/tests/:id` | S | Get test |
| POST | `/student/tests/:id/start` | S | Start attempt |
| POST | `/student/tests/:id/submit` | S | Submit attempt |
| POST | `/student/run-code` | S | Execute code |
| GET | `/student/results` | S | My results |
| GET | `/faculty/tests` | F | Assigned tests |
| GET | `/faculty/tests/:id/results` | F | Test results |
| GET | `/faculty/announcements` | F | Announcements |
| GET | `/faculty/batches` | F | Assigned batches |
| GET/POST | `/announcements` | I | Inst. announcements |
| POST | `/announcements/:id/read` | I | Mark as read |
| GET | `/student/announcements` | S | Student announcements |
| GET | `/faculty/announcements/list` | F | Faculty announcements |
| GET/POST | `/chat` | I | Inst ↔ Admin chat |
| GET/POST | `/admin-chat` | I | Inst ↔ Admin private chat |
| GET/POST | `/faculty/chat` | F | Faculty ↔ Admin chat |

### Faculty  `/faculty`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/tests` | F | Create faculty test |
| GET | `/tests` | F | List faculty tests |
| GET | `/tests/:id` | F | Get test |
| PUT | `/tests/:id` | F | Update test |
| DELETE | `/tests/:id` | F | Delete test |
| GET | `/tests/:id/evaluation` | F | Test with answers |
| GET | `/questions` | F | Library questions |

**Auth keys:** SA = SuperAdmin · A = Admin · C = Contributor · I = Institution · F = Faculty · S = Student
