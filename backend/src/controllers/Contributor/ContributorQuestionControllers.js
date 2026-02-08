const ContributorQuestion = require('../../models/ContributorQuestion');
const { uploadBuffer, deletePublicId, extractPublicIdFromUrl } = require('../../utils/cloudinary');

// multer setup (memory storage) used in routes; controller expects req.file

const createQuestion = async (req, res) => {
  try {
    const payload = req.body || {};
    // Basic validation
    if (!payload.subject) return res.status(400).json({ success: false, message: 'subject is required' });
    if (!payload.questionType) return res.status(400).json({ success: false, message: 'questionType is required' });
    if (!payload.questionText) return res.status(400).json({ success: false, message: 'questionText is required' });

    // parse options if passed as JSON string (from multipart/form-data)
    if (typeof payload.options === 'string') {
      try { payload.options = JSON.parse(payload.options); } catch (e) { payload.options = []; }
    }

    // handle image upload (support multiple question images and multiple solution images)
    if (req.files) {
      // QUESTION IMAGES: accept multiple files under 'image'
      if (req.files.image && Array.isArray(req.files.image) && req.files.image.length) {
        payload.imageUrls = payload.imageUrls || [];
        payload.imagePublicIds = payload.imagePublicIds || [];
        for (let i = 0; i < req.files.image.length; i++) {
          const f = req.files.image[i];
          if (f && f.buffer) {
            try {
              const r = await uploadBuffer(f.buffer, 'contributor_questions');
              if (r && r.secure_url) payload.imageUrls.push(r.secure_url);
              if (r && r.public_id) payload.imagePublicIds.push(r.public_id);
            } catch (err) {
              console.error('[createQuestion] question image upload failed', err && err.message);
              return res.status(500).json({ success: false, message: 'question image upload failed', error: err && err.message });
            }
          }
        }
        // keep legacy single-image fields for backward compatibility (first image)
        if (payload.imageUrls && payload.imageUrls.length) payload.imageUrl = payload.imageUrls[0];
        if (payload.imagePublicIds && payload.imagePublicIds.length) payload.imagePublicId = payload.imagePublicIds[0];
      }

      // SOLUTION IMAGES: accept multiple files under 'solutionImages' and map them to solutions
      if (req.files.solutionImages && Array.isArray(req.files.solutionImages) && req.files.solutionImages.length) {
        // ensure payload.solutions is an array (may be JSON string)
        if (typeof payload.solutions === 'string') {
          try { payload.solutions = JSON.parse(payload.solutions); } catch (e) { payload.solutions = []; }
        }
        payload.solutions = payload.solutions || [];

        // mapping indices: frontend may include 'solutionImageSolutionIndex' which is a JSON array parallel to files
        let mapping = null;
        if (payload.solutionImageSolutionIndex) {
          try { mapping = JSON.parse(payload.solutionImageSolutionIndex); } catch (e) { mapping = null; }
        }

        for (let i = 0; i < req.files.solutionImages.length; i++) {
          const f = req.files.solutionImages[i];
          const targetIndex = (Array.isArray(mapping) && typeof mapping[i] === 'number') ? mapping[i] : i;
          // ensure solution object exists
          if (!payload.solutions[targetIndex]) payload.solutions[targetIndex] = {};
          payload.solutions[targetIndex].imageUrls = payload.solutions[targetIndex].imageUrls || [];
          payload.solutions[targetIndex].imagePublicIds = payload.solutions[targetIndex].imagePublicIds || [];
          if (f && f.buffer) {
            try {
              const r = await uploadBuffer(f.buffer, 'contributor_solutions');
              if (r && r.secure_url) payload.solutions[targetIndex].imageUrls.push(r.secure_url);
              if (r && r.public_id) payload.solutions[targetIndex].imagePublicIds.push(r.public_id);
            } catch (err) {
              console.warn('[createQuestion] solution image upload failed', err && err.message);
            }
          }
          // keep legacy single-image fields on solution for compatibility
          if (payload.solutions[targetIndex].imageUrls && payload.solutions[targetIndex].imageUrls.length) payload.solutions[targetIndex].imageUrl = payload.solutions[targetIndex].imageUrls[0];
          if (payload.solutions[targetIndex].imagePublicIds && payload.solutions[targetIndex].imagePublicIds.length) payload.solutions[targetIndex].imagePublicId = payload.solutions[targetIndex].imagePublicIds[0];
        }
      }
    }

    // ensure options validation: array of {text, isCorrect}
    if (!Array.isArray(payload.options)) payload.options = [];
    // parse metadata/tags/hints if sent as JSON strings
    if (typeof payload.metadata === 'string') {
      try { payload.metadata = JSON.parse(payload.metadata); } catch (e) { payload.metadata = {}; }
    }
    if (typeof payload.tags === 'string') {
      try { payload.tags = JSON.parse(payload.tags); } catch (e) { payload.tags = []; }
    }
    if (typeof payload.hints === 'string') {
      try { payload.hints = JSON.parse(payload.hints); } catch (e) { payload.hints = []; }
    }

    const doc = new ContributorQuestion({
      subject: payload.subject,
      questionType: payload.questionType,
      questionNumber: payload.questionNumber,
      questionText: payload.questionText,
      imageUrl: payload.imageUrl,
      imagePublicId: payload.imagePublicId,
      imageUrls: Array.isArray(payload.imageUrls) ? payload.imageUrls : (payload.imageUrls ? JSON.parse(payload.imageUrls) : []),
      imagePublicIds: Array.isArray(payload.imagePublicIds) ? payload.imagePublicIds : (payload.imagePublicIds ? JSON.parse(payload.imagePublicIds) : []),
      options: payload.options,
      metadata: payload.metadata || {},
      tags: payload.tags || [],
      topic: payload.topic,
      subTopic: payload.subTopic,
      codeEditor: payload.codeEditor === 'true' || payload.codeEditor === true,
      solutions: Array.isArray(payload.solutions) ? payload.solutions : (payload.solutions ? JSON.parse(payload.solutions) : []),
      hints: Array.isArray(payload.hints) ? payload.hints : (payload.hints ? JSON.parse(payload.hints) : []),
      courseOutcome: payload.courseOutcome,
      programOutcome: payload.programOutcome,
      contributor: req.contributor && req.contributor.id
    });

    await doc.save();
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error('[createQuestion] error', err);
    return res.status(500).json({ success: false, message: 'server error', error: err.message });
  }
};

const getQuestion = async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await ContributorQuestion.findById(id).populate('contributor', 'name email');
    if (!doc) return res.status(404).json({ success: false, message: 'not found' });
    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error('[getQuestion] error', err);
    return res.status(500).json({ success: false, message: 'server error', error: err.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body || {};

    // load existing doc early so we can cleanup replaced images
    const existing = await ContributorQuestion.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'not found' });

    if (typeof payload.options === 'string') {
      try { payload.options = JSON.parse(payload.options); } catch (e) { payload.options = []; }
    }

    // handle uploaded files (support multiple question images and multiple solution images)
    if (req.files) {
      // QUESTION IMAGES: if provided, delete existing ones then upload and replace
      if (req.files.image && Array.isArray(req.files.image) && req.files.image.length) {
        try {
          if (existing.imagePublicIds && Array.isArray(existing.imagePublicIds)) {
            for (const pid of existing.imagePublicIds) {
              try {
                const delRes = await deletePublicId(pid);
                if (!delRes || (delRes.result && delRes.result !== 'ok')) console.warn('[updateQuestion] deletePublicId returned non-ok for', pid, delRes);
              } catch (err) { console.warn('[updateQuestion] failed to delete old question image', err && err.message); }
            }
          }
          if (existing.imagePublicId) {
            try {
              const delRes = await deletePublicId(existing.imagePublicId);
              if (!delRes || (delRes.result && delRes.result !== 'ok')) console.warn('[updateQuestion] deletePublicId returned non-ok for legacy', existing.imagePublicId, delRes);
            } catch (err) { console.warn('[updateQuestion] failed to delete old legacy question image', err && err.message); }
          }
          if (existing.imageUrls && Array.isArray(existing.imageUrls)) {
            for (const url of existing.imageUrls) {
              const derived = extractPublicIdFromUrl(url);
              if (derived) {
                try {
                  const delRes = await deletePublicId(derived);
                  if (!delRes || (delRes.result && delRes.result !== 'ok')) console.warn('[updateQuestion] deletePublicId returned non-ok for derived', derived, delRes);
                } catch (err) { console.warn('[updateQuestion] failed to delete old question image (derived)', err && err.message); }
              }
            }
          }
        } catch (err) { console.warn('[updateQuestion] error deleting previous question images', err && err.message); }

        payload.imageUrls = [];
        payload.imagePublicIds = [];
        for (let i = 0; i < req.files.image.length; i++) {
          const f = req.files.image[i];
          if (f && f.buffer) {
            try {
              const r = await uploadBuffer(f.buffer, 'contributor_questions');
              if (r && r.secure_url) payload.imageUrls.push(r.secure_url);
              if (r && r.public_id) payload.imagePublicIds.push(r.public_id);
            } catch (err) { console.error('[updateQuestion] question image upload failed', err && err.message); return res.status(500).json({ success: false, message: 'question image upload failed', error: err && err.message }); }
          }
        }
        if (payload.imageUrls.length) payload.imageUrl = payload.imageUrls[0];
        if (payload.imagePublicIds.length) payload.imagePublicId = payload.imagePublicIds[0];
      }

      // SOLUTION IMAGES: support multiple per-solution via mapping array
      if (req.files.solutionImages && Array.isArray(req.files.solutionImages) && req.files.solutionImages.length) {
        if (typeof payload.solutions === 'string') {
          try { payload.solutions = JSON.parse(payload.solutions); } catch (e) { payload.solutions = []; }
        }
        payload.solutions = payload.solutions || [];

        let mapping = null;
        if (payload.solutionImageSolutionIndex) {
          try { mapping = JSON.parse(payload.solutionImageSolutionIndex); } catch (e) { mapping = null; }
        }

        const updatedSolutionIndices = new Set();
        for (let i = 0; i < req.files.solutionImages.length; i++) {
          const targ = (Array.isArray(mapping) && typeof mapping[i] === 'number') ? mapping[i] : i;
          updatedSolutionIndices.add(targ);
        }

        // delete existing images for updated solutions
        for (const idx of updatedSolutionIndices) {
          const sExisting = existing.solutions && existing.solutions[idx];
          if (!sExisting) continue;
          try {
            if (Array.isArray(sExisting.imagePublicIds)) {
              for (const pid of sExisting.imagePublicIds) {
                try { await deletePublicId(pid); } catch (err) { console.warn('[updateQuestion] failed to delete solution image', err && err.message); }
              }
            }
            if (sExisting.imagePublicId) {
              try { await deletePublicId(sExisting.imagePublicId); } catch (err) { console.warn('[updateQuestion] failed to delete legacy solution image', err && err.message); }
            }
            if (Array.isArray(sExisting.imageUrls)) {
              for (const url of sExisting.imageUrls) {
                const derived = extractPublicIdFromUrl(url);
                if (derived) { try { await deletePublicId(derived); } catch (err) { console.warn('[updateQuestion] failed to delete derived solution image', err && err.message); } }
              }
            }
          } catch (err) { console.warn('[updateQuestion] error deleting existing solution images', err && err.message); }
        }

        // upload and attach new solution images
        for (let i = 0; i < req.files.solutionImages.length; i++) {
          const f = req.files.solutionImages[i];
          const targetIndex = (Array.isArray(mapping) && typeof mapping[i] === 'number') ? mapping[i] : i;
          if (!payload.solutions[targetIndex]) payload.solutions[targetIndex] = {};
          payload.solutions[targetIndex].imageUrls = payload.solutions[targetIndex].imageUrls || [];
          payload.solutions[targetIndex].imagePublicIds = payload.solutions[targetIndex].imagePublicIds || [];
          if (f && f.buffer) {
            try {
              const r = await uploadBuffer(f.buffer, 'contributor_solutions');
              if (r && r.secure_url) payload.solutions[targetIndex].imageUrls.push(r.secure_url);
              if (r && r.public_id) payload.solutions[targetIndex].imagePublicIds.push(r.public_id);
            } catch (err) { console.warn('[updateQuestion] solution image upload failed', err && err.message); }
          }
          if (payload.solutions[targetIndex].imageUrls && payload.solutions[targetIndex].imageUrls.length) payload.solutions[targetIndex].imageUrl = payload.solutions[targetIndex].imageUrls[0];
          if (payload.solutions[targetIndex].imagePublicIds && payload.solutions[targetIndex].imagePublicIds.length) payload.solutions[targetIndex].imagePublicId = payload.solutions[targetIndex].imagePublicIds[0];
        }
      }
    }

    if (payload.solutions && typeof payload.solutions === 'string') {
      try { payload.solutions = JSON.parse(payload.solutions); } catch (e) { payload.solutions = []; }
    }

    // parse metadata/tags/hints if sent as JSON strings
    if (typeof payload.metadata === 'string') {
      try { payload.metadata = JSON.parse(payload.metadata); } catch (e) { payload.metadata = {}; }
    }
    if (typeof payload.tags === 'string') {
      try { payload.tags = JSON.parse(payload.tags); } catch (e) { payload.tags = []; }
    }
    if (typeof payload.hints === 'string') {
      try { payload.hints = JSON.parse(payload.hints); } catch (e) { payload.hints = []; }
    }

    const doc = existing; // reuse loaded document

    // allow only owner contributor or keep open for admin (verifyContributor ensures contributor)
    if (doc.contributor && req.contributor && doc.contributor.toString() !== req.contributor.id) {
      return res.status(403).json({ success: false, message: 'forbidden' });
    }

    Object.keys(payload).forEach(k => {
      if (k === 'options' || k === 'solutions' || k === 'hints' || k === 'tags' || k === 'metadata') {
        doc[k] = payload[k];
      } else if (['subject','questionType','questionNumber','questionText','imageUrl','imagePublicId','imageUrls','imagePublicIds','topic','subTopic','codeEditor','courseOutcome','programOutcome'].includes(k)) {
        doc[k] = payload[k];
      }
    });

    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error('[updateQuestion] error', err);
    return res.status(500).json({ success: false, message: 'server error', error: err.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await ContributorQuestion.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'not found' });
    if (doc.contributor && req.contributor && doc.contributor.toString() !== req.contributor.id) {
      return res.status(403).json({ success: false, message: 'forbidden' });
    }
    // attempt to delete cloudinary images (question image arrays and solution image arrays)
    const cloudErrors = [];
    try {
      // delete imagePublicIds array if present
      if (Array.isArray(doc.imagePublicIds) && doc.imagePublicIds.length) {
        for (const pid of doc.imagePublicIds) {
          try {
            const delRes = await deletePublicId(pid);
            if (!delRes || (delRes.result && delRes.result !== 'ok')) cloudErrors.push({ id: pid, result: delRes });
          } catch (err) { cloudErrors.push({ id: pid, error: err && err.message }); }
        }
      }
      // legacy single public id
      if (doc.imagePublicId) {
        try {
          const delRes = await deletePublicId(doc.imagePublicId);
          if (!delRes || (delRes.result && delRes.result !== 'ok')) cloudErrors.push({ id: doc.imagePublicId, result: delRes });
        } catch (err) { cloudErrors.push({ id: doc.imagePublicId, error: err && err.message }); }
      }
      // try derived ids from URLs
      if (Array.isArray(doc.imageUrls)) {
        for (const url of doc.imageUrls) {
          const derived = extractPublicIdFromUrl(url);
          if (derived) {
            try {
              const delRes = await deletePublicId(derived);
              if (!delRes || (delRes.result && delRes.result !== 'ok')) cloudErrors.push({ id: derived, result: delRes });
            } catch (err) { cloudErrors.push({ id: derived, error: err && err.message }); }
          }
        }
      }

      // solutions: each solution may have imagePublicIds array or legacy fields
      if (Array.isArray(doc.solutions)) {
        for (let i = 0; i < doc.solutions.length; i++) {
          const s = doc.solutions[i];
          if (!s) continue;
          if (Array.isArray(s.imagePublicIds) && s.imagePublicIds.length) {
            for (const pid of s.imagePublicIds) {
              try {
                const delRes = await deletePublicId(pid);
                if (!delRes || (delRes.result && delRes.result !== 'ok')) cloudErrors.push({ id: pid, result: delRes });
              } catch (err) { cloudErrors.push({ id: pid, error: err && err.message }); }
            }
          }
          if (s.imagePublicId) {
            try {
              const delRes = await deletePublicId(s.imagePublicId);
              if (!delRes || (delRes.result && delRes.result !== 'ok')) cloudErrors.push({ id: s.imagePublicId, result: delRes });
            } catch (err) { cloudErrors.push({ id: s.imagePublicId, error: err && err.message }); }
          }
          if (Array.isArray(s.imageUrls)) {
            for (const url of s.imageUrls) {
              const derived = extractPublicIdFromUrl(url);
              if (derived) {
                try {
                  const delRes = await deletePublicId(derived);
                  if (!delRes || (delRes.result && delRes.result !== 'ok')) cloudErrors.push({ id: derived, result: delRes });
                } catch (err) { cloudErrors.push({ id: derived, error: err && err.message }); }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('[deleteQuestion] error while deleting cloud images', err && err.message);
    }

    await doc.deleteOne();
    const resBody = { success: true, message: 'deleted' };
    if (cloudErrors.length) resBody.cloudErrors = cloudErrors;
    return res.json(resBody);
  } catch (err) {
    console.error('[deleteQuestion] error', err);
    return res.status(500).json({ success: false, message: 'server error', error: err.message });
  }
};

const listQuestions = async (req, res) => {
  try {
    const q = {};
    // allow filtering by subject, tags, contributor
    if (req.query.subject) q.subject = req.query.subject;
    if (req.query.contributor) q.contributor = req.query.contributor;
    if (req.query.tag) q.tags = req.query.tag;

    const docs = await ContributorQuestion.find(q).sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, data: docs });
  } catch (err) {
    console.error('[listQuestions] error', err);
    return res.status(500).json({ success: false, message: 'server error', error: err.message });
  }
};

module.exports = { createQuestion, getQuestion, updateQuestion, deleteQuestion, listQuestions };
