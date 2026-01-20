# Contributor Feature - Testing Guide

## Prerequisites
- Backend server running on `http://localhost:5001`
- Frontend running on `http://localhost:5173` (Vite default)
- Database seeded with admin and contributor accounts

## Test Scenarios

### Contributor Workflow

#### 1. Login as Contributor
```
URL: http://localhost:5173/login
Credentials: Use contributor account from database
Token stored as: contributor_token in localStorage
```

#### 2. View Dashboard
```
URL: http://localhost:5173/contributor/dashboard
Expected:
- Stats cards (total requests, pending, completed, rejected)
- Unread message badge on "Chat with Admin" button
- Three action buttons: Chat, Submit Question, New Request
- Two tabs: My Requests, My Contributions
- Request list with status badges
- Contribution list with questions
```

#### 3. Create Contribution Request
```
URL: http://localhost:5173/contributor/requests/create
Steps:
1. Click "+ New Request" from dashboard
2. Fill in first question set:
   - Topic: "Array Algorithms"
   - Category: Technical
   - Difficulty: Medium
   - Count: 10
3. Click "+ Add Another Question Set"
4. Fill in second set:
   - Topic: "Logical Reasoning"
   - Category: Aptitude
   - Difficulty: Easy
   - Count: 5
5. Add notes (optional)
6. Click "Submit Request"

Expected:
- Success message
- Redirect to dashboard
- New request appears in "My Requests" tab
- Status shows "PENDING"

API Call:
POST http://localhost:5001/contributor/requests
Body: {
  "questionRequests": [
    { "topic": "Array Algorithms", "category": "technical", "difficulty": "medium", "count": 10 },
    { "topic": "Logical Reasoning", "category": "aptitude", "difficulty": "easy", "count": 5 }
  ],
  "notes": "Focus on practical problem-solving"
}
```

#### 4. Submit Individual Question
```
URL: http://localhost:5173/contributor/questions
Steps:
1. Click "Submit Question" from dashboard
2. Fill in question form:
   - Question Text: "What is the time complexity of binary search?"
   - Option 1: "O(n)"
   - Option 2: "O(log n)" (select as correct)
   - Option 3: "O(n^2)"
   - Option 4: "O(1)"
   - Category: Technical
   - Difficulty: Easy
   - Tags: "algorithms, binary search, complexity"
   - Details: "Binary search divides the search space in half each iteration..."
3. Click "Create Question"

Expected:
- Success message
- Form resets
- Question appears in "My Contributions" list
- Correct answer highlighted in green
- Details shown in blue box
- Tags displayed

API Call:
POST http://localhost:5001/contributor/contributions
Body: {
  "text": "What is the time complexity of binary search?",
  "options": [
    { "text": "O(n)" },
    { "text": "O(log n)" },
    { "text": "O(n^2)" },
    { "text": "O(1)" }
  ],
  "correctIndex": 1,
  "category": "technical",
  "difficulty": "easy",
  "tags": ["algorithms", "binary search", "complexity"],
  "details": "Binary search divides the search space in half..."
}
```

#### 5. Chat with Admin
```
URL: http://localhost:5173/contributor/chat
Steps:
1. Click "Chat with Admin" from dashboard
2. Type message: "I've submitted a request for array questions"
3. Click "Send"
4. Wait for admin reply (or use admin panel to reply)

Expected:
- Message appears on right (red background)
- Timestamp displayed
- Auto-scrolls to bottom
- Polls every 5 seconds for new messages
- Admin messages appear on left (gray background)
- Unread badge decrements after viewing

API Calls:
GET http://localhost:5001/contributor/chat (every 5s)
POST http://localhost:5001/contributor/chat/send
Body: { "text": "I've submitted a request for array questions" }
```

### Admin Workflow

#### 1. Login as Admin
```
URL: http://localhost:5173/login
Credentials: Use admin account from database
Token stored as: admin_token in localStorage
```

#### 2. View Admin Dashboard
```
URL: http://localhost:5173/admin/dashboard
Expected:
- Card: "Contributor Requests"
- Card: "Contributor Chats"
- Other existing admin cards
```

#### 3. Manage Contributor Requests
```
URL: http://localhost:5173/admin/contributor-requests
Steps:
1. Click "Contributor Requests" from dashboard
2. View stats: Total, Pending, In Progress, Completed, Rejected
3. Click filter: "Pending"
4. Select a request
5. Change status to "In Progress"
6. View request details in modal

Expected:
- Request list filtered by status
- Status updates reflect immediately
- Stats update after status change
- Request details show:
  - All question sets
  - Topic, category, difficulty, count
  - Notes
  - Timestamps

API Calls:
GET http://localhost:5001/admin/contributor-requests?status=pending
PUT http://localhost:5001/admin/contributor-requests/:id/status
Body: { "status": "in-progress" }
```

#### 4. Chat with Contributors
```
URL: http://localhost:5173/admin/contributor-chats
Steps:
1. Click "Contributor Chats" from dashboard
2. View list of contributors with unread counts
3. Select a contributor
4. View message history
5. Type reply: "I've approved your request. Please start working on it."
6. Click "Send"

Expected:
- Contributor list shows unread badges
- Selected chat loads in right panel
- Message history displayed
- Auto-scroll to bottom
- Messages marked as read on selection
- Polls every 5 seconds

API Calls:
GET http://localhost:5001/admin/contributor-chats (every 5s)
POST http://localhost:5001/admin/contributor-chats/:contributorId/send
Body: { "text": "I've approved your request..." }
POST http://localhost:5001/admin/contributor-chats/:chatId/mark-read
```

## Edge Cases to Test

### Validation
1. **Empty Question Text**: Should show error
2. **Less than 2 Options**: Should show error
3. **Empty Request**: Should require at least 1 question set
4. **Empty Message**: Send button disabled

### Navigation
1. **Back to Dashboard**: All pages have back button
2. **Route Protection**: Verify auth tokens required
3. **Invalid Routes**: Should show 404

### Real-Time Updates
1. **Unread Count**: Should update every 10s in dashboard
2. **Chat Polling**: New messages appear within 5s
3. **Request Status**: Changes reflect in dashboard tabs

### Data Integrity
1. **Question Details**: Optional field saves correctly
2. **Tags Array**: Comma-separated parsing works
3. **Atomic Updates**: Concurrent messages don't lose data
4. **Request Status**: Only valid transitions allowed

## API Testing with cURL

### Create Request
```bash
curl -X POST http://localhost:5001/contributor/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <contributor_token>" \
  -d '{
    "questionRequests": [
      {
        "topic": "Data Structures",
        "category": "technical",
        "difficulty": "hard",
        "count": 15
      }
    ],
    "notes": "Focus on trees and graphs"
  }'
```

### Create Question
```bash
curl -X POST http://localhost:5001/contributor/contributions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <contributor_token>" \
  -d '{
    "text": "Which data structure uses LIFO?",
    "options": [
      {"text": "Queue"},
      {"text": "Stack"},
      {"text": "Array"},
      {"text": "Tree"}
    ],
    "correctIndex": 1,
    "category": "technical",
    "difficulty": "easy",
    "tags": ["data structures", "stack"],
    "details": "Stack follows Last In First Out principle"
  }'
```

### Update Request Status (Admin)
```bash
curl -X PUT http://localhost:5001/admin/contributor-requests/<request_id>/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"status": "completed"}'
```

### Send Message (Contributor)
```bash
curl -X POST http://localhost:5001/contributor/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <contributor_token>" \
  -d '{"text": "When will my request be approved?"}'
```

### Send Message (Admin)
```bash
curl -X POST http://localhost:5001/admin/contributor-chats/<contributor_id>/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"text": "Your request has been approved"}'
```

## Browser Console Testing

### Check Tokens
```javascript
console.log('Contributor Token:', localStorage.getItem('contributor_token'));
console.log('Admin Token:', localStorage.getItem('admin_token'));
```

### Check API Base
```javascript
console.log('API Base:', import.meta.env.VITE_API_URL);
```

### Monitor Network Requests
1. Open DevTools → Network tab
2. Filter by: Fetch/XHR
3. Watch for:
   - `/contributor/*` endpoints (contributor token)
   - `/admin/*` endpoints (admin token)
   - Response codes: 200, 201, 400, 401, 500

## Expected Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Request created successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation error: Question text is required"
}
```

## Troubleshooting

### 404 Errors
- Check backend routes in `backend/src/server.js`
- Verify routes are mounted at `/contributor` and `/admin` (NOT `/api/*`)

### 401 Unauthorized
- Verify token exists: `localStorage.getItem('contributor_token')`
- Check token format in request headers
- Verify middleware is applied to routes

### 500 Errors
- Check server logs for stack trace
- Verify MongoDB connection
- Check for destructuring errors (should be guarded)

### Chat Not Updating
- Check polling intervals (5s for chat, 10s for unread)
- Verify WebSocket not required (using polling)
- Check network tab for failed requests

### Styling Issues
- Verify Tailwind CSS is configured
- Check red-black-white color classes
- Inspect element for applied styles

## Success Criteria

✅ Contributor can create requests with multiple question sets
✅ Contributor can submit individual questions with details
✅ Contributor can chat with admin
✅ Admin can view and manage all requests
✅ Admin can update request status
✅ Admin can chat with all contributors
✅ Unread counts update automatically
✅ Red-black-white theme applied consistently
✅ All navigation uses pages (not modals)
✅ All forms validate correctly
✅ All API endpoints return correct responses
