# Question Library Fix - Documentation

## Problem
Institution admins were getting an error when trying to assign faculty and batch to create tests:
```
Error: Not enough questions available to generate the test. Please contact administrator.
Failed to load resource: the server responded with a status of 400 (Bad Request)
```

## Root Cause
The system has two ways to track questions that are available for tests:
1. **Question Model**: Has an `inLibrary` flag (boolean)
2. **Library Collection**: Contains entries that reference questions

The issue was that:
- The FRI test generation function (`generateQuestionsForFRITest`) searches for questions with `inLibrary: true`
- However, seeded questions were not being marked with `inLibrary: true`
- Questions were also not being added to the Library collection
- Result: No questions were found when trying to create tests

## Solution

### 1. Updated Seed Scripts
Both seed scripts now properly set the `inLibrary` flag and add questions to the Library collection:

**Files Modified:**
- `backend/src/scripts/seedQuestions.js`
- `backend/src/scripts/seedQuestionsEnhanced.js`

**Changes:**
- Added `inLibrary: true` to all seeded questions
- Added code to insert questions into the Library collection
- Ensured all questions have required `subtopic` field
- Added proper topic mapping (aptitude → Aptitude, technical → Technical, psychometric → Psychometric)

### 2. Created Migration Script
A new migration script was created to fix existing questions in the database:

**File:** `backend/src/scripts/migrateQuestionsToLibrary.js`

**What it does:**
1. Finds all questions in the database
2. Sets `inLibrary: true` for questions that don't have it
3. Adds default subtopics for questions missing them
4. Adds all questions to the Library collection
5. Provides detailed summary of the migration

### 3. Added NPM Script
Added a convenient script to run the migration:

**Command:**
```bash
cd backend
npm run migrate:library
```

## Migration Results
Successfully migrated 246 questions:
- ✅ Updated `inLibrary` flag: 55 questions
- ✅ Added to Library collection: 246 questions

Breakdown by category:
- 📚 Aptitude: 82 questions
- 💻 Technical: 93 questions
- 🧠 Psychometric: 71 questions

## How to Use

### For New Projects
1. Run the enhanced seed script:
   ```bash
   cd backend
   npm run seed:questions:enhanced
   ```
   This will automatically set `inLibrary: true` and add questions to the Library collection.

### For Existing Projects
1. Run the migration script:
   ```bash
   cd backend
   npm run migrate:library
   ```
   This will fix all existing questions in the database.

## Testing
After running the migration, institution admins should now be able to:
1. Create tests and assign them to faculty and batches
2. Schedule FRI tests with the required question distributions
3. See questions appear in the library

## Technical Details

### Question Model Fields
- `inLibrary`: Boolean flag indicating the question is available in the library
- `subtopic`: Required string field for organizing questions (e.g., "General Aptitude", "Web Technologies")
- `category`: Enum field ('aptitude', 'technical', 'psychometric')

### Library Model
- Stores references to questions (`qn_id`)
- Organizes by `topic` (Aptitude, Technical, Psychometric) and `subtopic`
- Used for browsing and filtering questions in the library UI

### FRI Test Generation
The `generateQuestionsForFRITest` function queries:
```javascript
Question.aggregate([
  { $match: { category, difficulty: 'easy', inLibrary: true } },
  { $sample: { size: easyCount } }
])
```

Without `inLibrary: true`, no questions are found, resulting in the error.

## Files Changed
1. `backend/src/scripts/seedQuestions.js` - Updated to set inLibrary flag
2. `backend/src/scripts/seedQuestionsEnhanced.js` - Updated to set inLibrary flag
3. `backend/src/scripts/migrateQuestionsToLibrary.js` - New migration script
4. `backend/package.json` - Added migrate:library script

## Future Considerations
- When contributors submit new questions, ensure they are added to the Library after approval
- When admins create questions, mark them as `inLibrary: true` by default
- Consider adding a UI indicator showing which questions are in the library
