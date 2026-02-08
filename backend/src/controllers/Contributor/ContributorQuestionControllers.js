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

    // handle image upload (question image and solution images)
    if (req.files) {
      // question image may be in req.files.image as array
      if (req.files.image && req.files.image[0] && req.files.image[0].buffer) {
        try {
          const result = await uploadBuffer(req.files.image[0].buffer, 'contributor_questions');
          payload.imageUrl = result && result.secure_url;
          payload.imagePublicId = result && result.public_id;
        } catch (err) {
          console.error('[createQuestion] question image upload failed', err && err.message);
          return res.status(500).json({ success: false, message: 'question image upload failed', error: err && err.message });
        }
      }
      // solution images may be uploaded as req.files.solutionImages (array)
      if (req.files.solutionImages && Array.isArray(req.files.solutionImages)) {
        // ensure payload.solutions is an array (may be JSON string)
        if (typeof payload.solutions === 'string') {
          try { payload.solutions = JSON.parse(payload.solutions); } catch (e) { payload.solutions = []; }
        }
        payload.solutions = payload.solutions || [];
        // upload each solution image and attach imageUrl to corresponding solution entry (or create)
        for (let i = 0; i < req.files.solutionImages.length; i++) {
          const f = req.files.solutionImages[i];
          if (f && f.buffer) {
            try {
              const r = await uploadBuffer(f.buffer, 'contributor_solutions');
              if (!payload.solutions[i]) payload.solutions[i] = {};
              payload.solutions[i].imageUrl = r.secure_url;
              payload.solutions[i].imagePublicId = r.public_id;
            } catch (err) {
              console.warn('[createQuestion] solution image upload failed', err && err.message);
            }
          }
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

    // handle uploaded files (question image and solution images)
    if (req.files) {
      // QUESTION IMAGE
      if (req.files.image && req.files.image[0] && req.files.image[0].buffer) {
        let result;
        try {
          result = await uploadBuffer(req.files.image[0].buffer, 'contributor_questions');
        } catch (err) {
          console.error('[updateQuestion] question image upload failed', err && err.message);
          return res.status(500).json({ success: false, message: 'question image upload failed', error: err && err.message });
        }

        // delete previous image if present
        try {
          if (existing.imagePublicId) {
            const delRes = await deletePublicId(existing.imagePublicId);
            if (!delRes || (delRes.result && delRes.result !== 'ok')) {
              console.warn('[updateQuestion] deletePublicId returned non-ok for', existing.imagePublicId, delRes);
            }
          } else if (existing.imageUrl) {
            const derived = extractPublicIdFromUrl(existing.imageUrl);
            if (derived) {
              const delRes = await deletePublicId(derived);
              if (!delRes || (delRes.result && delRes.result !== 'ok')) {
                console.warn('[updateQuestion] deletePublicId returned non-ok for derived', derived, delRes);
              }
            }
          }
        } catch (err) {
          console.warn('[updateQuestion] failed to delete old question image', err && err.message);
        }

        payload.imageUrl = result && result.secure_url;
        payload.imagePublicId = result && result.public_id;
      }

      // SOLUTION IMAGES
      if (req.files.solutionImages && Array.isArray(req.files.solutionImages)) {
        if (typeof payload.solutions === 'string') {
          try { payload.solutions = JSON.parse(payload.solutions); } catch (e) { payload.solutions = []; }
        }
        payload.solutions = payload.solutions || [];

        for (let i = 0; i < req.files.solutionImages.length; i++) {
          const f = req.files.solutionImages[i];

          // delete previous solution image if present
          try {
            if (existing.solutions && existing.solutions[i] && existing.solutions[i].imagePublicId) {
              const delRes = await deletePublicId(existing.solutions[i].imagePublicId);
              if (!delRes || (delRes.result && delRes.result !== 'ok')) {
                console.warn('[updateQuestion] deletePublicId returned non-ok for', existing.solutions[i].imagePublicId, delRes);
              }
            } else if (existing.solutions && existing.solutions[i] && existing.solutions[i].imageUrl) {
              const derived = extractPublicIdFromUrl(existing.solutions[i].imageUrl);
              if (derived) {
                const delRes = await deletePublicId(derived);
                if (!delRes || (delRes.result && delRes.result !== 'ok')) {
                  console.warn('[updateQuestion] deletePublicId returned non-ok for derived', derived, delRes);
                }
              }
            }
          } catch (err) {
            console.warn('[updateQuestion] failed to delete old solution image', err && err.message);
          }

          if (f && f.buffer) {
            try {
              const r = await uploadBuffer(f.buffer, 'contributor_solutions');
              if (!payload.solutions[i]) payload.solutions[i] = {};
              payload.solutions[i].imageUrl = r.secure_url;
              payload.solutions[i].imagePublicId = r.public_id;
            } catch (err) {
              console.warn('[updateQuestion] solution image upload failed', err && err.message);
            }
          }
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
      } else if (['subject','questionType','questionNumber','questionText','imageUrl','imagePublicId','topic','subTopic','codeEditor','courseOutcome','programOutcome'].includes(k)) {
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
    // attempt to delete cloudinary images (question image and solution images)
    const cloudErrors = [];
    try {
      if (doc.imagePublicId) {
        try {
          const delRes = await deletePublicId(doc.imagePublicId);
          if (!delRes || (delRes.result && delRes.result !== 'ok')) {
            cloudErrors.push({ id: doc.imagePublicId, result: delRes });
          }
        } catch (err) { cloudErrors.push({ id: doc.imagePublicId, error: err && err.message }); }
      } else if (doc.imageUrl) {
        const derived = extractPublicIdFromUrl(doc.imageUrl);
        if (derived) {
          try {
            const delRes = await deletePublicId(derived);
            if (!delRes || (delRes.result && delRes.result !== 'ok')) {
              cloudErrors.push({ id: derived, result: delRes });
            }
          } catch (err) { cloudErrors.push({ id: derived, error: err && err.message }); }
        }
      }
      if (Array.isArray(doc.solutions)) {
        for (let i = 0; i < doc.solutions.length; i++) {
          const s = doc.solutions[i];
          if (s && s.imagePublicId) {
            try {
              const delRes = await deletePublicId(s.imagePublicId);
              if (!delRes || (delRes.result && delRes.result !== 'ok')) {
                cloudErrors.push({ id: s.imagePublicId, result: delRes });
              }
            } catch (err) { cloudErrors.push({ id: s.imagePublicId, error: err && err.message }); }
          } else if (s && s.imageUrl) {
            const derived = extractPublicIdFromUrl(s.imageUrl);
            if (derived) {
              try {
                const delRes = await deletePublicId(derived);
                if (!delRes || (delRes.result && delRes.result !== 'ok')) {
                  cloudErrors.push({ id: derived, result: delRes });
                }
              } catch (err) { cloudErrors.push({ id: derived, error: err && err.message }); }
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
