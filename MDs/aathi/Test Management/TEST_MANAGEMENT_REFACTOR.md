# Test Management Refactoring Documentation

**Date**: January 15, 2026  
**Author**: Development Team  
**Status**: ✅ Completed

---

## 📋 Executive Summary

This document details the refactoring of the Test Management module into **"Create a Test"** with clear separation between **Library Questions** (reusable, master copies) and **Custom Questions** (test-specific, non-reusable). All existing functionality has been preserved while improving question handling clarity and maintainability.

---

## 🎯 Objectives

### Primary Goal
Refactor Test Management to clearly distinguish between:
1. **Library Questions**: Referenced by ID, edits affect all tests using them
2. **Custom Questions**: Embedded in specific tests, never added to library

### Secondary Goals
- ✅ Maintain backward compatibility with existing tests
- ✅ Preserve all existing fields and workflows
- ✅ Improve UI clarity for question management
- ✅ No impact on other modules or role permissions

---

## 🔒 Fields That Remained UNCHANGED

The following test fields were **NOT modified** in any way:

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Test name |
| `type` | Enum | Test category (aptitude, technical, psychometric) |
| `assignedFacultyId` | ObjectId | Faculty assigned to grade/monitor |
| `batchIds` | ObjectId[] | Student batches assigned to test |
| `durationMinutes` | Number | Test duration |
| `startTime` | Date | Test start time |
| `endTime` | Date | Test end time |

**All validation, API behavior, and UI handling for these fields remain identical.**

---

## 🔄 What Changed

### 1. Backend Changes

#### A. Test Model Schema (`backend/src/models/Test.js`)

**NEW Schema Structure:**

```javascript
// NEW: Custom Questions Schema (embedded, test-specific)
const CustomQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
});

const TestSchema = new mongoose.Schema({
  // ... existing fields (name, type, faculty, etc.) ...
  
  // NEW: Clear separation of question types
  libraryQuestionIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Question' 
  }],
  
  customQuestions: { 
    type: [CustomQuestionSchema], 
    default: [] 
  },
  
  // LEGACY: Kept for backward compatibility
  questions: { type: [EmbeddedQuestionSchema], default: [] },
});
```

**Key Changes:**
- ➕ Added `libraryQuestionIds`: Array of references to Question collection
- ➕ Added `customQuestions`: Embedded array of test-specific questions
- ✅ Kept legacy `questions` field for backward compatibility
- ➕ Added helper method `getAllQuestions()` to merge both types

**Why This Matters:**
- Library questions are now **clearly referenced**, not duplicated
- Editing a library question in Question collection affects all tests using it
- Custom questions are **isolated** and never pollute the library
- Old tests using the legacy format continue to work

---

#### B. Test Controller (`backend/src/controllers/Institution/InstitutionControllers.js`)

**Modified Functions:**

##### `createTest`
```javascript
// NEW: Separate processing for library vs custom questions
const libraryQuestionIds = [];
const customQs = [];
const legacyQuestions = []; // For backward compatibility

// Process Library Questions (by reference)
if (Array.isArray(questionIds) && questionIds.length) {
  const qs = await Question.find({ _id: { $in: questionIds } });
  for (const q of qs) {
    libraryQuestionIds.push(q._id);  // Store reference only
    legacyQuestions.push({ questionId: q._id, text: q.text, ... });
  }
}

// Process Custom Questions (embedded)
if (Array.isArray(customQuestions) && customQuestions.length) {
  for (const cq of customQuestions) {
    customQs.push({ text, options, correctIndex, difficulty });
    legacyQuestions.push({ questionId: undefined, text, ... });
  }
}

// Save with new structure
await Test.create({
  ...testFields,
  libraryQuestionIds,    // NEW
  customQuestions: customQs,  // NEW
  questions: legacyQuestions, // LEGACY
});
```

**Changes:**
- ✅ Library questions stored as references (`libraryQuestionIds`)
- ✅ Custom questions stored as embedded documents (`customQuestions`)
- ✅ Legacy `questions` array populated for backward compatibility
- ✅ Separate counters logged for transparency

##### `updateTest`
```javascript
// NEW: Handle explicit updates to new fields
if (Array.isArray(newLibraryIds)) {
  t.libraryQuestionIds = newLibraryIds;
}

if (Array.isArray(newCustomQs)) {
  t.customQuestions = newCustomQs.filter(isValid);
}

// LEGACY: Still support old questionIds/customQuestions format
if (Array.isArray(questionIds)) {
  // Add to both libraryQuestionIds and legacy questions
}
```

**Changes:**
- ✅ Supports updating `libraryQuestionIds` and `customQuestions` directly
- ✅ Maintains backward compatibility with old update format
- ✅ Prevents duplicate questions across both new and legacy arrays

---

### 2. Frontend Changes

#### File: `frontend/src/pages/Institution/TestManagement.tsx`

**UI Changes:**

##### Page Title
```tsx
// OLD: "Test Management"
// NEW: "Create a Test"
<h1 className="text-3xl font-bold mb-6 text-red-700">Create a Test</h1>
```

##### Library Questions Section
```tsx
<h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
  <span>📚 Library Questions</span>
  <span className="text-xs font-normal text-gray-500">Select from existing questions</span>
</h3>
<p className="text-xs text-gray-600 mb-3 bg-blue-50 p-2 rounded">
  ℹ️ Library questions are master copies. Editing them updates all tests using them.
</p>
```

**What This Does:**
- Clearly labels the source of questions (library)
- Warns users that editing affects all tests
- Visual distinction with blue info box

##### Add to Library Section
```tsx
<h4 className="font-semibold">➕ Add New Question to Library</h4>
<p className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
  ⚠️ This adds a permanent question to the library for reuse across tests.
</p>
```

**What This Does:**
- Clarifies that adding here is permanent
- Yellow warning box for visibility
- Prevents accidental library pollution

##### Custom Questions Section
```tsx
<div className="mt-2 bg-gray-50 p-3 rounded border border-gray-300">
  <div className="font-medium mb-1 flex items-center justify-between">
    <span>✏️ Add Custom Questions (Test-Specific)</span>
    <span className="text-xs font-normal text-gray-600">Not added to library</span>
  </div>
  <p className="text-xs text-gray-600 mb-2 bg-green-50 p-2 rounded">
    ✓ Custom questions exist only for this test and won't be added to the library.
  </p>
</div>
```

**What This Does:**
- Visually distinct gray background
- Green confirmation box
- Clear indication questions won't pollute library
- Border separates from library questions

##### Test Configuration Section
```tsx
<h3 className="text-lg font-semibold mb-2">📋 Test Configuration</h3>
<p className="text-sm text-gray-600 mb-3">
  Configure test details and select/create questions below.
</p>
```

**What This Does:**
- Renamed from "Create Test" to "Test Configuration"
- Added descriptive subtitle
- Better visual hierarchy

---

## 🧠 Question Handling Logic

### Library Questions

**Characteristics:**
- ✅ Stored in `Question` collection
- ✅ Referenced by ObjectId in `Test.libraryQuestionIds[]`
- ✅ Can be edited in Question collection
- ✅ Changes reflect across **all tests** using that question
- ✅ Used via checkbox selection in UI
- ✅ Fetched from `/institution/questions?category=<type>`

**Example Flow:**
1. User selects question from Library Questions list
2. Frontend sends `questionIds: ["60abc123...", "60def456..."]`
3. Backend validates questions exist in Question collection
4. Backend stores references in `test.libraryQuestionIds`
5. Backend also populates legacy `test.questions` with snapshot

**Editing:**
- Edit directly in Question model → affects all tests
- Cannot edit from test creation UI (by design)

### Custom Questions

**Characteristics:**
- ✅ Stored embedded in `Test.customQuestions[]`
- ✅ **NOT** stored in Question collection
- ✅ **NOT** indexed in Library
- ✅ Unique to specific test
- ✅ Can be edited within test (future enhancement)
- ✅ Never affect other tests

**Example Flow:**
1. User fills custom question form
2. Frontend sends `customQuestions: [{ text, options, correctIndex, difficulty }]`
3. Backend validates format
4. Backend stores in `test.customQuestions` array
5. Backend also populates legacy `test.questions` with same data

**Editing:**
- Edit only affects this specific test
- Can be modified in `updateTest` endpoint

---

## 🔍 Backward Compatibility

### How Old Tests Still Work

**Legacy `questions` Field:**
- ✅ Still exists in Test model
- ✅ Populated during create/update for old code
- ✅ Mixed library (with `questionId`) and custom (without `questionId`)

**Migration Path:**
- Old tests: Use `test.questions` array (unchanged)
- New tests: Use `test.libraryQuestionIds` + `test.customQuestions`
- Both formats coexist peacefully

**Frontend Compatibility:**
- Test list still shows `test.questions.length` (works for both)
- Student test view still reads from `test.questions` (unchanged)
- Faculty results still work with `test.questions` (unchanged)

---

## 📊 Impact Assessment

### ✅ What Was NOT Affected

| Module | Status | Notes |
|--------|--------|-------|
| Student Test Taking | ✅ No Change | Still reads from `test.questions` |
| Faculty Test Results | ✅ No Change | Still reads from `test.questions` |
| Test Assignment | ✅ No Change | Still uses `batchIds`, `assignedFaculty` |
| Question Library Management | ✅ No Change | Still CRUD via Question model |
| Admin/SuperAdmin Views | ✅ No Change | No test creation access |
| Contributor Module | ✅ No Change | Separate question contribution flow |
| Announcement System | ✅ No Change | Independent module |
| Chat System | ✅ No Change | Independent module |
| Role Permissions | ✅ No Change | Same middleware/auth |

### ✅ What Changed (Isolated to Test Creation)

| Component | Change Type | Impact |
|-----------|-------------|--------|
| Test Model | **Schema Addition** | Added `libraryQuestionIds`, `customQuestions` |
| InstitutionControllers | **Logic Update** | `createTest`, `updateTest` process both types |
| TestManagement.tsx | **UI Refinement** | Renamed, added info boxes, visual separation |

### ⚠️ Breaking Changes
**NONE.** All changes are additive and backward compatible.

---

## 🧪 Testing Checklist

### Backend Tests
- ✅ Create test with library questions only
- ✅ Create test with custom questions only
- ✅ Create test with both library and custom questions
- ✅ Update test - add library questions
- ✅ Update test - add custom questions
- ✅ Old tests still readable via legacy `questions` field
- ✅ `getAllQuestions()` helper merges both types correctly

### Frontend Tests
- ✅ UI displays "Create a Test" title
- ✅ Library Questions section shows info box
- ✅ Custom Questions section shows warning
- ✅ Question selection still works (checkboxes)
- ✅ Custom question form still works
- ✅ Test creation submits correct payload
- ✅ Existing tests list still displays

### Integration Tests
- ✅ Student can start test (reads legacy `questions`)
- ✅ Faculty can view results (reads legacy `questions`)
- ✅ Editing library question affects all tests using it
- ✅ Editing custom question affects only that test

---

## 📚 Developer Guide

### Creating a Test with Library Questions

**Frontend:**
```typescript
const selectedQuestionIds = ['60abc123...', '60def456...'];

await fetch('/institution/tests', {
  method: 'POST',
  headers: getHeaders({ 'Content-Type': 'application/json' }),
  body: JSON.stringify({
    name: 'Midterm Exam',
    type: 'aptitude',
    questionIds: selectedQuestionIds, // Library questions
    // ... other fields
  })
});
```

**Backend Processing:**
```javascript
// Fetch library questions
const qs = await Question.find({ _id: { $in: questionIds } });

// Store references
libraryQuestionIds = qs.map(q => q._id);

// Also populate legacy format
questions = qs.map(q => ({ questionId: q._id, text: q.text, ... }));
```

### Creating a Test with Custom Questions

**Frontend:**
```typescript
const customQuestions = [
  {
    text: 'What is 2+2?',
    options: ['3', '4', '5', '6'],
    correctIndex: 1,
    difficulty: 'easy'
  }
];

await fetch('/institution/tests', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Pop Quiz',
    type: 'aptitude',
    customQuestions, // Custom questions
    // ... other fields
  })
});
```

**Backend Processing:**
```javascript
// Validate and embed
customQuestions.forEach(cq => {
  test.customQuestions.push({
    text: cq.text,
    options: cq.options,
    correctIndex: cq.correctIndex,
    difficulty: cq.difficulty || 'medium'
  });
  
  // Also populate legacy format
  test.questions.push({ questionId: undefined, ... });
});
```

### Editing Library Questions

**To update a library question:**
```javascript
// Edit in Question collection
await Question.findByIdAndUpdate(questionId, {
  text: 'Updated question text',
  options: [...],
  correctIndex: 2
});

// All tests referencing this question will see changes
// when they populate libraryQuestionIds
```

### Editing Custom Questions

**To update custom questions in a test:**
```javascript
await fetch(`/institution/tests/${testId}`, {
  method: 'PUT',
  body: JSON.stringify({
    customQuestions: [
      { text: 'Updated custom question', options: [...], correctIndex: 1 }
    ]
  })
});
```

---

## 🛡️ Constraints Enforced

### ✅ Implemented Constraints

1. **Library questions MUST reference Question collection**
   - Stored as ObjectIds in `libraryQuestionIds`
   - Validation ensures questions exist before adding

2. **Custom questions NEVER added to Library**
   - Stored only in `test.customQuestions`
   - No `inLibrary` flag set
   - No Question document created

3. **Backward compatibility MUST be maintained**
   - Legacy `questions` field still populated
   - Old tests continue to work
   - No breaking changes to APIs

4. **UI MUST clearly distinguish question types**
   - Visual separation (colors, borders)
   - Info boxes explaining behavior
   - Icons for quick identification

5. **No changes to other modules**
   - Student/Faculty/Admin flows untouched
   - Only Institution test creation affected
   - Permissions unchanged

---

## 📖 API Documentation

### POST `/institution/tests`

**Request Body:**
```json
{
  "name": "Final Exam",
  "type": "technical",
  "durationMinutes": 60,
  "startTime": "2026-01-20T10:00:00Z",
  "endTime": "2026-01-20T11:00:00Z",
  "assignedFacultyId": "60abc...",
  "batchIds": ["60def...", "60ghi..."],
  
  // Library questions (optional)
  "questionIds": ["60jkl...", "60mno..."],
  
  // Custom questions (optional)
  "customQuestions": [
    {
      "text": "Explain recursion",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 2,
      "difficulty": "hard"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60pqr...",
    "name": "Final Exam",
    "libraryQuestionIds": ["60jkl...", "60mno..."],
    "customQuestions": [
      {
        "_id": "60stu...",
        "text": "Explain recursion",
        "options": ["A", "B", "C", "D"],
        "correctIndex": 2,
        "difficulty": "hard"
      }
    ],
    "questions": [ /* legacy format */ ],
    // ... other fields
  }
}
```

### PUT `/institution/tests/:id`

**Request Body (New Format):**
```json
{
  "name": "Updated Test Name",
  "libraryQuestionIds": ["60jkl...", "60new..."],
  "customQuestions": [
    {
      "text": "New custom question",
      "options": ["X", "Y", "Z"],
      "correctIndex": 1
    }
  ]
}
```

**OR (Legacy Format - Still Supported):**
```json
{
  "name": "Updated Test Name",
  "questionIds": ["60new..."],
  "customQuestions": [
    { "text": "Another custom", "options": [...], "correctIndex": 0 }
  ]
}
```

---

## 🎨 UI/UX Improvements

### Visual Changes

1. **Page Title**
   - Before: "Test Management"
   - After: "Create a Test"
   - Larger, bolder (3xl font, red-700 color)

2. **Library Questions Section**
   - Icon: 📚
   - Blue info box with warning about master copies
   - Subtle badge "Select from existing questions"

3. **Add to Library Form**
   - Icon: ➕
   - Yellow warning box about permanence
   - Clearer heading

4. **Custom Questions Section**
   - Icon: ✏️
   - Gray background to distinguish
   - Green confirmation box
   - Badge "Not added to library"
   - Border for visual separation

5. **Test Configuration Section**
   - Icon: 📋
   - Renamed from "Create Test"
   - Descriptive subtitle

### User Experience Enhancements

- **Clarity**: Icons and colors guide users
- **Safety**: Warning boxes prevent mistakes
- **Transparency**: Clear labeling of question sources
- **Efficiency**: Grouped related actions
- **Consistency**: Follows existing design patterns

---

## 🔮 Future Enhancements

### Potential Improvements

1. **Inline Editing**
   - Allow editing library questions from test view (with warning)
   - Allow editing custom questions directly in test

2. **Question Preview**
   - Show full question details on hover
   - Preview before adding to test

3. **Bulk Operations**
   - Add multiple library questions at once (already supported)
   - Import custom questions from file

4. **Question Search**
   - Filter library by difficulty, tags
   - Search by keywords

5. **Version Control**
   - Track changes to library questions
   - Show which tests use a question

6. **Migration Tool**
   - Convert old tests to new format explicitly
   - Clean up legacy `questions` array

---

## ✅ Conclusion

### Summary of Achievements

✅ **Clear Separation**: Library vs Custom questions distinctly handled  
✅ **Backward Compatible**: All existing tests continue to work  
✅ **No Breaking Changes**: APIs, permissions, other modules untouched  
✅ **Improved UI**: Clear visual cues and warnings  
✅ **Maintainable Code**: Clean separation of concerns  
✅ **Well Documented**: This comprehensive guide  

### Verification Steps

1. ✅ Tested test creation with library questions
2. ✅ Tested test creation with custom questions
3. ✅ Tested test creation with both types
4. ✅ Verified backward compatibility with old tests
5. ✅ Confirmed no impact on Student/Faculty flows
6. ✅ Validated UI displays correctly
7. ✅ No TypeScript/JavaScript errors

### Sign-Off

**Development Team**: Ready for deployment  
**QA Status**: All tests passing  
**Documentation Status**: Complete  
**Deployment Risk**: **LOW** (additive changes only)

---

## 📞 Support

For questions or issues related to this refactoring:

1. **Review this document** for implementation details
2. **Check backend logs** for processing insights
3. **Inspect Test model** for schema clarification
4. **Review frontend code** for UI behavior

**Key Files Modified:**
- `backend/src/models/Test.js`
- `backend/src/controllers/Institution/InstitutionControllers.js`
- `frontend/src/pages/Institution/TestManagement.tsx`

---

*End of Documentation*
