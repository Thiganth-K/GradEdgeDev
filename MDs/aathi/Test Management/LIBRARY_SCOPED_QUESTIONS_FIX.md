# Library-Scoped Questions Implementation

## Overview
This document describes the implementation of library-scoped question fetching for the Institution Test Management system. The changes ensure that institutions can only select questions from the Library model (contributor-created and approved) rather than all questions in the Question collection.

## Date: December 2024

## Problem Statement
Previously, the `listQuestions` endpoint was fetching questions directly from the Question collection filtered by `createdBy: institution.id`. This approach had several issues:
- Institutions could access all questions they created, regardless of approval status
- No quality control mechanism for question selection
- Questions weren't going through the contributor approval workflow
- Library model was not being utilized for test creation

## Solution Architecture

### Backend Changes

#### 1. Updated `listQuestions` Controller
**File:** `backend/src/controllers/Institution/InstitutionControllers.js`

**Previous Implementation:**
```javascript
const filter = { createdBy: req.institution?.id };
if (category) filter.category = category;
const items = await Question.find(filter).sort({ createdAt: -1 });
```

**New Implementation:**
```javascript
// Fetch from Library model (contributor-approved questions)
const libraryEntries = await Library.find().populate('qn_id').sort({ createdAt: -1 });
console.log('[Institution.listQuestions] found', libraryEntries.length, 'library entries');

// Extract actual question documents and filter by category
let items = libraryEntries
  .map(entry => entry.qn_id)
  .filter(q => q !== null && q !== undefined);

if (category) {
  items = items.filter(q => q.category === category);
}
```

**Key Changes:**
- Fetches from `Library` collection instead of `Question` collection
- Uses `.populate('qn_id')` to get full question documents
- Filters out null/undefined references
- Maintains category filtering functionality
- Added comprehensive logging

#### 2. Updated `createTest` Controller
**File:** `backend/src/controllers/Institution/InstitutionControllers.js`

**Previous Implementation:**
```javascript
const qs = await Question.find({ _id: { $in: questionIds }, category: type });
```

**New Implementation:**
```javascript
// Validate that questionIds are actually in the Library (contributor-approved)
const libraryEntries = await Library.find({ qn_id: { $in: questionIds } }).populate('qn_id');
console.log('[Institution.createTest] found', libraryEntries.length, 'library entries for provided question IDs');

for (const entry of libraryEntries) {
  const q = entry.qn_id;
  if (q && q.category === type) {
    libraryQuestionIds.push(q._id);
    legacyQuestions.push({
      questionId: q._id,
      text: q.text,
      options: (q.options || []).map((o) => o.text),
      correctIndex: q.correctIndex,
    });
  }
}

if (libraryQuestionIds.length < questionIds.length) {
  console.log('[Institution.createTest] ⚠ some question IDs were not in Library or didn\'t match category');
}
```

**Key Changes:**
- Validates question IDs against Library model
- Only accepts questions that exist in Library
- Warns if some provided IDs are not in Library
- Maintains backward compatibility with legacy format

#### 3. Added Library Model Import
**File:** `backend/src/controllers/Institution/InstitutionControllers.js`

```javascript
const Library = require('../../models/Library');
```

### Frontend Changes

#### Complete UI Restructure
**File:** `frontend/src/pages/Institution/TestManagement.tsx`

**Layout Structure:**
```
1. Test Configuration Card (Single Card)
   - Test Name
   - Test Type
   - Assigned Faculty
   - Duration
   - Start Time
   - End Time
   - Assign Batches

2. Library Questions Section (Separate Div)
   - Blue color theme (border-l-4 border-blue-500)
   - Filter by category
   - Checkbox selection from Library
   - Shows question details (text, options, difficulty, category)
   - Badge: "Reusable across tests"

3. Custom Questions Section (Separate Div)
   - Green color theme (border-l-4 border-green-500)
   - Form to add test-specific questions
   - Question text, options, correct answer
   - Preview of added custom questions
   - Badge: "Test-specific only"

4. Submit Button
   - Shows count of Library + Custom questions
   - Red color theme matching app branding

5. Add New Library Question Section (Separate Section)
   - Yellow color theme (border-l-4 border-yellow-500)
   - Form to add questions to Library
   - Category, text, options, correct answer
   - Badge: "Permanent & reusable"

6. Existing Tests Table
   - List of created tests
   - Edit and Delete actions
```

**Key UI Improvements:**
- Clear visual separation with colored borders
- Distinct color coding:
  - Blue: Library Questions (reusable)
  - Green: Custom Questions (test-specific)
  - Yellow: Add to Library (permanent)
- Informative badges explaining each section
- Better spacing and padding
- Responsive design with grid layouts
- Enhanced accessibility with proper labels

**Visual Indicators:**
```tsx
// Library Questions
<span className="text-xs font-normal text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
  Reusable across tests
</span>

// Custom Questions
<span className="text-xs font-normal text-gray-500 bg-green-50 px-3 py-1 rounded-full">
  Test-specific only
</span>

// Add to Library
<span className="text-xs font-normal text-gray-500 bg-yellow-50 px-3 py-1 rounded-full">
  Permanent & reusable
</span>
```

## Data Flow

### Question Selection Flow
```
1. Institution selects test type (aptitude/technical/psychometric)
   ↓
2. Frontend fetches: GET /institution/questions?category={type}
   ↓
3. Backend queries: Library.find().populate('qn_id')
   ↓
4. Backend filters by category
   ↓
5. Frontend displays approved library questions
   ↓
6. Institution selects library questions + creates custom questions
   ↓
7. Frontend submits: POST /institution/tests
   {
     questionIds: [/* library question IDs */],
     customQuestions: [/* test-specific questions */]
   }
   ↓
8. Backend validates questionIds against Library
   ↓
9. Backend creates test with:
   - libraryQuestionIds: [validated Library question IDs]
   - customQuestions: [embedded custom question documents]
```

### Library Model Structure
```javascript
{
  topic: String,
  subtopic: String,
  qn_id: { type: ObjectId, ref: 'Question', unique: true },
  createdAt: Date,
  updatedAt: Date
}
```

## Benefits

### Quality Control
- ✅ Only contributor-created and approved questions available
- ✅ Institutions can't use unapproved questions
- ✅ Central library management

### Separation of Concerns
- ✅ Library Questions: Reusable, quality-controlled
- ✅ Custom Questions: Test-specific, flexible
- ✅ Clear distinction in UI and data model

### Backward Compatibility
- ✅ Legacy `questions` array maintained for old tests
- ✅ New tests use `libraryQuestionIds` + `customQuestions`
- ✅ No breaking changes to existing functionality

### User Experience
- ✅ Clear visual separation with color coding
- ✅ Intuitive workflow with sections
- ✅ Informative badges and descriptions
- ✅ Better organization of functionality

## Testing Checklist

### Backend Testing
- [ ] Test `listQuestions` endpoint with no Library entries
- [ ] Test `listQuestions` endpoint with Library entries
- [ ] Test category filtering (aptitude, technical, psychometric)
- [ ] Test `createTest` with valid Library question IDs
- [ ] Test `createTest` with invalid/non-Library question IDs
- [ ] Test `createTest` with mix of library and custom questions
- [ ] Verify Library model population works correctly
- [ ] Check console logs for proper debugging information

### Frontend Testing
- [ ] Test Test Configuration card displays all fields
- [ ] Test Library Questions section loads correctly
- [ ] Test checkbox selection for library questions
- [ ] Test category filter refresh
- [ ] Test Custom Questions form submission
- [ ] Test custom question preview and removal
- [ ] Test "Add to Library" form submission
- [ ] Test final "Create Test" button with counts
- [ ] Verify color-coded visual separation
- [ ] Test responsive design on mobile/tablet
- [ ] Test Edit Test modal functionality
- [ ] Test Existing Tests table display

### Integration Testing
- [ ] Create test with only library questions
- [ ] Create test with only custom questions
- [ ] Create test with both library and custom questions
- [ ] Edit existing test and verify questions display
- [ ] Delete test and verify cleanup
- [ ] Add new question to library and verify it appears in selection
- [ ] Test with empty Library collection
- [ ] Test with large number of questions (100+)

## Migration Notes

### For Existing Deployments
1. Existing tests continue to work with legacy `questions` array
2. New tests automatically use new structure
3. No database migration required
4. Library model must be populated with approved questions

### Library Population
If Library is empty, institutions won't see any questions to select. To populate:

```javascript
// Example: Add existing approved questions to Library
const approvedQuestions = await Question.find({ isApproved: true });
for (const q of approvedQuestions) {
  await Library.create({
    topic: q.topic || 'General',
    subtopic: q.subtopic || 'General',
    qn_id: q._id
  });
}
```

## API Endpoints

### GET /institution/questions
**Query Parameters:**
- `category` (optional): 'aptitude' | 'technical' | 'psychometric'

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "text": "Question text",
      "options": [
        { "text": "Option 1" },
        { "text": "Option 2" }
      ],
      "correctIndex": 0,
      "category": "aptitude",
      "difficulty": "medium"
    }
  ]
}
```

### POST /institution/tests
**Request Body:**
```json
{
  "name": "Test Name",
  "type": "aptitude",
  "questionIds": ["library_question_id_1", "library_question_id_2"],
  "customQuestions": [
    {
      "text": "Custom question",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "difficulty": "medium"
    }
  ],
  "assignedFacultyId": "...",
  "batchIds": ["..."],
  "durationMinutes": 30,
  "startTime": "2024-01-01T10:00:00",
  "endTime": "2024-01-01T11:00:00"
}
```

## Security Considerations

### Library Question Validation
- Backend validates all question IDs against Library model
- Prevents institutions from using non-approved questions
- Category matching enforced at both frontend and backend

### Custom Questions
- No validation against Library (by design)
- Embedded directly in Test document
- Can't be reused in other tests

## Performance Considerations

### Database Queries
- `Library.find().populate('qn_id')` - Single query with population
- Index on `Library.qn_id` for efficient lookups
- Category filtering done in-memory (acceptable for typical question counts)

### Optimization Opportunities
```javascript
// If Library grows very large, consider:
const libraryEntries = await Library.find()
  .populate({
    path: 'qn_id',
    match: category ? { category } : {}
  })
  .sort({ createdAt: -1 })
  .limit(100); // Pagination
```

## Future Enhancements

### Suggested Improvements
1. **Pagination**: Add pagination to Library Questions list
2. **Search**: Add search functionality for questions
3. **Bulk Selection**: Add "Select All" / "Deselect All" buttons
4. **Question Preview**: Add modal to preview full question details
5. **Difficulty Filter**: Add filter by difficulty level
6. **Tag Filter**: Add filter by tags/topics
7. **Question Stats**: Show usage count for library questions
8. **Favorites**: Allow institutions to bookmark frequently used questions

### Technical Debt
- Consider caching Library questions on frontend
- Add debouncing to category filter
- Implement virtual scrolling for large question lists
- Add question validation on backend (e.g., minimum options count)

## Related Files

### Backend
- `backend/src/controllers/Institution/InstitutionControllers.js`
- `backend/src/models/Library.js`
- `backend/src/models/Question.js`
- `backend/src/models/Test.js`

### Frontend
- `frontend/src/pages/Institution/TestManagement.tsx`
- `frontend/src/lib/api.ts`

### Documentation
- `MDs/TEST_MANAGEMENT_REFACTOR.md`
- `MDs/TEST_MANAGEMENT_ARCHITECTURE.md`
- `MDs/aathi/BULK_QUESTION_UPLOAD_IMPLEMENTATION.md`

## Conclusion

This implementation successfully:
- ✅ Implements library-scoped question fetching
- ✅ Validates question selection against Library model
- ✅ Separates Library and Custom questions in UI
- ✅ Maintains backward compatibility
- ✅ Provides clear visual distinction
- ✅ Enables quality control workflow

The system now ensures that institutions can only use contributor-approved questions from the Library, while still maintaining the flexibility to add test-specific custom questions.
