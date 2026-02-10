## Contributor Question Feature — Technical Overview

Purpose
- Implement a Mongoose model and full CRUD flow for contributor-submitted questions, including optional images for both the question and its solutions. Images are uploaded to Cloudinary using Multer (memory storage) and stored with both public IDs and secure URLs. Multiple images per question and per solution are supported while keeping legacy single-image fields for backward compatibility.

Repository locations (backend)
- Model: `backend/src/models/ContributorQuestion.js`
- Controllers: `backend/src/controllers/Contributor/ContributorQuestionControllers.js`
- Routes: `backend/src/routes/Contributor/ContributorRoutes.js`
- Cloudinary helpers: `backend/src/utils/cloudinary.js`

Frontend locations
- Page: `frontend/src/pages/Contributor/PlacementReadyQuestions.tsx`
- API helpers: `frontend/src/lib/api.ts`, `frontend/src/lib/makeHeaders.ts`

Schema (key fields)
- `subject`, `questionType`, `questionNumber`, `questionText` (required basic fields)
- Options: `options` array of { text, isCorrect }
- Metadata: `metadata` object (difficulty, bloomTaxonomy)
- Tags, topic, subTopic, codeEditor flag, hints, courseOutcome, programOutcome
- Contributor reference: `contributor` (ObjectId)
- Images (backwards-compatible):
  - Legacy single-image: `imageUrl`, `imagePublicId`
  - Multi-image arrays: `imageUrls: [String]`, `imagePublicIds: [String]`
- Solutions: array of objects, each supporting
  - Legacy: `imageUrl`, `imagePublicId`
  - Multi-image arrays: `imageUrls: [String]`, `imagePublicIds: [String]`

API endpoints
- POST /contributor/contributions — Create a new contributed question (multipart/form-data)
  - Fields: `subject`, `questionType`, `questionText`, `options` (JSON), `metadata` (JSON), `tags` (JSON array), `solutions` (JSON array), etc.
  - File fields: `image` (one or more files), `solutionImages` (one or more files)
  - Mapping: `solutionImageSolutionIndex` (JSON array) — maps each `solutionImages` file to a solution index in `solutions`

- GET /contributor/contributions — List questions (supports filtering by subject, tag, contributor)
- GET /contributor/contributions/:id — Get by id
- PUT /contributor/contributions/:id — Update question (multipart/form-data) — supports replacing images (deletes old ones)
- DELETE /contributor/contributions/:id — Delete question and attempt to remove all associated Cloudinary images

Upload flow (backend)
- Multer configured with memory storage; route-level fields accepted are `image` and `solutionImages` (now allowing multiple files).
- Each file buffer is uploaded with a streaming helper `uploadBuffer(buffer, folder)` which returns `{ secure_url, public_id }`.
- On create: uploaded file URLs and public IDs are appended into `imageUrls` / `imagePublicIds` and per-solution `imageUrls`/`imagePublicIds` arrays. The first image (if present) is stored in the legacy `imageUrl`/`imagePublicId` fields for compatibility.
- On update: if new files are provided, controller deletes existing stored public IDs (and attempts to derive public IDs from stored URLs if public IDs are missing) before uploading replacements; then replaces the arrays in the document.

Deletion and cleanup
- On delete, the controller:
  1. Iterates `imagePublicIds` and calls `deletePublicId(publicId)` (Cloudinary destroy) for each.
  2. Also attempts to delete legacy `imagePublicId` and derives public IDs from `imageUrls`/`solutions[].imageUrls` when `public_id` was not stored.
  3. Repeats deletion for each solution's `imagePublicIds` and legacy fields.
  4. Collects `cloudErrors` and returns them in the response body if any deletions failed. The DB document is removed regardless; failures are surfaced as warnings.

Frontend behavior
- The contributor UI allows:
  - Multiple question images: multi-select input or one-by-one 'Add One' button.
  - Multiple images per solution: per-solution multi-select or 'Add One' button.
  - Previews of selected images before submit and ability to remove selected items prior to upload.
  - On submit, FormData includes:
    - `image` files (one entry per file)
    - `solutionImages` files (one entry per file)
    - `solutionImageSolutionIndex` JSON array mapping each `solutionImages` file to its solution index
    - `solutions` as JSON, plus other fields serialized as JSON or strings.

Validation and error handling
- Server-side validates required fields (subject, questionType, questionText) and returns 400 for missing fields.
- File-size and MIME type limits are enforced by Multer configuration on the routes (image types allowed: jpeg/png/webp/gif). Limits can be tuned in `ContributorRoutes.js`.
- Upload errors return 500 with a message like "question image upload failed" or "solution image upload failed".

Backward compatibility notes
- Existing records with `imageUrl`/`imagePublicId` remain readable; controllers will use the legacy fields when multi-image arrays are absent.
- New records include both array fields and legacy fields (first image copied to legacy fields) so older parts of the system continue to function.

Testing & diagnostics
- A small Node script `scripts/testCreateContributorQuestion.js` was used to insert a sample document and verify DB persistence.
- `scripts/showContributorQuestion.js <id>` prints a DB document for inspection.
- When troubleshooting Cloudinary deletions, the Cloudinary util logs destroy calls and responses. If deletes don't show in logs, verify env vars (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) in backend environment and ensure server process loads them.

Developer notes
- Keep `uploadBuffer` and `deletePublicId` centralized in `backend/src/utils/cloudinary.js` to simplify tracing and add logging.
- Mapping strategy (`solutionImageSolutionIndex`) is used so individual solution images can be attached to arbitrary solution indices in the `solutions` array.
- Consider a background job to retry deletes if Cloudinary returns transient errors.

How to manually exercise the feature
1. Start backend and frontend dev servers.
2. Open the contributor UI at the contributor dashboard and go to "Placement Ready Questions".
3. Create a new question with multiple question images and multiple per-solution images (use either the multi-select or "Add One" controls).
4. Submit and observe network request to POST `/contributor/contributions` — confirm 201 response and view stored DB document.
5. Update a question adding/removing images — server should delete replaced images and upload new ones.
6. Delete the question — server attempts to remove all associated Cloudinary assets and returns `cloudErrors` if any deletions failed.

Example FormData keys (create/update)
- `subject`, `questionType`, `questionText`, `options` (JSON), `solutions` (JSON)
- `image` -> may appear multiple times (each file)
- `solutionImages` -> may appear multiple times
- `solutionImageSolutionIndex` -> JSON array like `[0, 1, 1]` meaning the first `solutionImages` file maps to solution 0, next to solution 1, next to solution 1 again

Change log (high-level)
- Added `ContributorQuestion` model with arrays for images and legacy fields kept
- Added Cloudinary helper and upload/delete flows
- Implemented create/get/update/delete controllers with image handling and cleanup
- Extended contributor routes to accept multiple file uploads
- Updated frontend page for multi-file selection, previews, one-by-one add, and mapping

Contact
- For questions about the implementation, look at the controllers and cloudinary util; see inline logs printed by controllers during upload and deletion operations.
