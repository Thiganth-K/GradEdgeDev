# Bulk Question Upload - Testing Guide

## Prerequisites
1. Backend server running (`npm start` in backend directory)
2. Frontend server running (`npm run dev` in frontend directory)
3. Logged in as a Contributor

## Test Scenarios

### 1. Template Download
**Steps:**
1. Navigate to Contributor Dashboard
2. Click "Create Contribution Request"
3. Scroll to "Bulk Question Upload" section
4. Click "Download Excel Template"

**Expected Result:**
- `question_template.xlsx` file downloads
- File opens in Excel/Sheets
- Contains instruction row and sample row
- Has columns: text, option1_text, option1_isCorrect, option2_text, option2_isCorrect, option3_text, option3_isCorrect, option4_text, option4_isCorrect, category, subtopic, difficulty, tags, details

### 2. Valid File Upload
**Steps:**
1. Fill template with 3-5 valid questions
2. Save the file
3. In the "Bulk Question Upload" section, click "Upload Filled Template"
4. Select your filled template
5. Wait for processing

**Expected Result:**
- File uploads successfully
- Success message shows: "Successfully parsed X question(s)!"
- File name displayed with green checkmark
- Preview shows first 3 questions with details
- No errors displayed

### 3. File with Errors
**Steps:**
1. Create a template with some invalid data:
   - Row with missing question text
   - Row with only 1 option
   - Row with no correct answer
   - Row with invalid category (e.g., "invalid")
2. Upload the file

**Expected Result:**
- File uploads and processes
- Error message shows: "File parsed with X error(s)"
- Errors section displays specific error messages with row numbers
- Valid questions still parsed and shown in preview

### 4. Request Submission with Bulk Questions
**Steps:**
1. Fill request metadata (topic, category, count)
2. Upload a valid template with questions
3. Optionally add notes
4. Click "Submit Request"

**Expected Result:**
- Request submitted successfully
- Redirects to dashboard
- Request visible in "My Requests" list
- When viewing request details, bulk uploaded questions appear in drafted questions

### 5. Large File Handling
**Steps:**
1. Create a template with 50-100 questions
2. Upload the file

**Expected Result:**
- File processes without hanging
- Loading indicator shows during processing
- All valid questions parsed
- Preview shows first 3 questions
- UI remains responsive

### 6. File Type Validation
**Steps:**
1. Try uploading a .txt file
2. Try uploading a .pdf file
3. Try uploading a .png file

**Expected Result:**
- Alert: "Please upload a valid Excel file (.xlsx, .xls, or .csv)"
- File not accepted
- No processing occurs

### 7. File Size Limit
**Steps:**
1. Create or find a file larger than 10MB
2. Try to upload it

**Expected Result:**
- Alert: "File size must be less than 10MB"
- File not accepted

### 8. Clear/Remove Upload
**Steps:**
1. Upload a valid file
2. Click "Remove" button on the uploaded file display

**Expected Result:**
- Uploaded file removed
- Parsed questions cleared
- Preview hidden
- Can upload a different file

### 9. Mixed Manual and Bulk Entry
**Steps:**
1. Upload bulk questions from Excel
2. Also manually draft 1-2 questions using "Draft a New Question"
3. Submit request

**Expected Result:**
- Both bulk and manual questions included in submission
- All questions visible in request preview
- Request created successfully

### 10. UnifiedContributionRequest Page
**Steps:**
1. Navigate to `/contributor/unified-contribution-request` (or the main contribution page)
2. Test all bulk upload features there

**Expected Result:**
- Same functionality as in modal
- Bulk uploaded questions appear in drafted questions list
- Can edit or remove bulk uploaded questions

## Sample Test Data

### Valid Question Example:
```
text: What is the capital of France?
option1_text: London
option1_isCorrect: false
option2_text: Paris
option2_isCorrect: true
option3_text: Berlin
option3_isCorrect: false
option4_text: Madrid
option4_isCorrect: false
category: aptitude
subtopic: Geography
difficulty: easy
tags: geography, capitals, europe
details: Basic geography question about European capitals
```

### Invalid Question Examples:
**Missing Required Field:**
```
text: 
option1_text: Yes
option1_isCorrect: true
option2_text: No
option2_isCorrect: false
category: aptitude
subtopic: Test
difficulty: easy
```

**Insufficient Options:**
```
text: True or False?
option1_text: True
option1_isCorrect: true
category: aptitude
subtopic: Test
difficulty: easy
```

**No Correct Answer:**
```
text: Which is correct?
option1_text: A
option1_isCorrect: false
option2_text: B
option2_isCorrect: false
category: aptitude
subtopic: Test
difficulty: easy
```

**Invalid Category:**
```
text: Test question
option1_text: A
option1_isCorrect: true
option2_text: B
option2_isCorrect: false
category: invalid_category
subtopic: Test
difficulty: easy
```

## API Testing

### Template Download Endpoint
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/contributor/bulk/template \
  --output template.xlsx
```

### Parse File Endpoint
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@path/to/your/template.xlsx" \
  http://localhost:3000/api/contributor/bulk/parse
```

## Common Issues & Solutions

### Issue: Template download fails
**Solution:** Check that backend server is running and contributor is authenticated

### Issue: File upload shows "Failed to parse file"
**Solution:** Check file format, ensure it's a valid Excel file (.xlsx)

### Issue: All rows show errors
**Solution:** Ensure you didn't delete the header row and that data starts after the instruction row

### Issue: Questions not appearing after upload
**Solution:** Check browser console for errors, verify API response

### Issue: Preview not showing
**Solution:** Check that `showPreview` state is true, verify questions were parsed successfully

## Performance Benchmarks

- **Small files (1-10 questions):** < 1 second
- **Medium files (11-50 questions):** 1-3 seconds
- **Large files (51-100 questions):** 3-5 seconds
- **Very large files (100+ questions):** May take 5-10 seconds

## Browser Compatibility

Tested and working in:
- Chrome 120+
- Firefox 115+
- Edge 120+
- Safari 17+

## Security Checks

✅ File size validation (10MB limit)
✅ File type validation
✅ Authentication required
✅ Input sanitization
✅ No files saved to disk
✅ Memory-based processing

---

**Last Updated:** January 14, 2026
