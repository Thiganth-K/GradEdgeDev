const ContributorQuestion = require('../../models/ContributorQuestion');
const { uploadBuffer, deletePublicId, extractPublicIdFromUrl } = require('../../utils/cloudinary');

// Create a new contributor question (new schema)
const createQuestion = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.subTopic) return res.status(400).json({ success: false, message: 'subTopic is required' });
    if (!payload.difficulty) return res.status(400).json({ success: false, message: 'difficulty is required' });
    if (!payload.question) return res.status(400).json({ success: false, message: 'question is required' });

    if (typeof payload.options === 'string') {
      try { payload.options = JSON.parse(payload.options); } catch (e) { payload.options = []; }
    }
    if (typeof payload.solutions === 'string') {
      try { payload.solutions = JSON.parse(payload.solutions); } catch (e) { payload.solutions = []; }
    }

    // Question image (single)
    let questionImageUrl = null;
    let questionImagePublicId = null;
    if (req.files && req.files.image && Array.isArray(req.files.image) && req.files.image.length) {
      const f = req.files.image[0];
      if (f && f.buffer) {
        const r = await uploadBuffer(f.buffer, 'contributor_questions');
        if (r && r.secure_url) questionImageUrl = r.secure_url;
        if (r && r.public_id) questionImagePublicId = r.public_id;
      }
    }

    payload.solutions = payload.solutions || [];
    // Solution images (one image per solution, mapping optional)
    if (req.files && req.files.solutionImages && Array.isArray(req.files.solutionImages) && req.files.solutionImages.length) {
      let mapping = null;
      if (payload.solutionImageSolutionIndex) {
        try { mapping = JSON.parse(payload.solutionImageSolutionIndex); } catch (e) { mapping = null; }
      }
      for (let i = 0; i < req.files.solutionImages.length; i++) {
        const f = req.files.solutionImages[i];
        const targetIndex = (Array.isArray(mapping) && typeof mapping[i] === 'number') ? mapping[i] : i;
        if (!payload.solutions[targetIndex]) payload.solutions[targetIndex] = {};
        if (f && f.buffer) {
          try {
            const r = await uploadBuffer(f.buffer, 'contributor_solutions');
            if (r && r.secure_url) {
              payload.solutions[targetIndex].imageUrls = payload.solutions[targetIndex].imageUrls || [];
              payload.solutions[targetIndex].imageUrls.push(r.secure_url);
              // also set singular for backward compatibility (last image)
              payload.solutions[targetIndex].imageUrl = r.secure_url;
            }
            if (r && r.public_id) {
              payload.solutions[targetIndex].imagePublicIds = payload.solutions[targetIndex].imagePublicIds || [];
              payload.solutions[targetIndex].imagePublicIds.push(r.public_id);
              payload.solutions[targetIndex].imagePublicId = r.public_id;
            }
          } catch (err) {
            console.warn('[createQuestion] solution image upload failed', err && err.message);
          }
        }
      }
    }
    // Option images (one image per option, mapping optional) - process before validating options
    if (req.files && req.files.optionImages && Array.isArray(req.files.optionImages) && req.files.optionImages.length) {
      let mapping = null;
      if (payload.optionImageOptionIndex) {
        try { mapping = JSON.parse(payload.optionImageOptionIndex); } catch (e) { mapping = null; }
      }
      for (let i = 0; i < req.files.optionImages.length; i++) {
        const f = req.files.optionImages[i];
        const targetIndex = (Array.isArray(mapping) && typeof mapping[i] === 'number') ? mapping[i] : i;
        if (!payload.options) payload.options = [];
        if (!payload.options[targetIndex]) payload.options[targetIndex] = {};
        if (f && f.buffer) {
          try {
            const r = await uploadBuffer(f.buffer, 'contributor_options');
            if (r && r.secure_url) payload.options[targetIndex].imageUrl = r.secure_url;
            if (r && r.public_id) payload.options[targetIndex].imagePublicId = r.public_id;
          } catch (err) {
            console.warn('[createQuestion] option image upload failed', err && err.message);
          }
        }
      }
    }

    if (!Array.isArray(payload.options)) payload.options = [];

    // Validate options: at least 2, and each must have text or an image
    if (!Array.isArray(payload.options) || payload.options.length < 2) {
      return res.status(400).json({ success: false, message: 'Provide at least two options' });
    }
    for (let oi = 0; oi < payload.options.length; oi++) {
      const op = payload.options[oi] || {};
      const hasText = typeof op.text === 'string' && op.text.trim().length > 0;
      const hasImage = !!(op.imageUrl || op.imagePublicId);
      if (!hasText && !hasImage) {
        return res.status(400).json({ success: false, message: `Option ${oi + 1} must have text or an image` });
      }
    }

    const doc = new ContributorQuestion({
      subTopic: payload.subTopic,
      difficulty: payload.difficulty,
      question: payload.question,
      questionImageUrl,
      questionImagePublicId,
      options: payload.options,
      solutions: payload.solutions,
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

    const existing = await ContributorQuestion.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'not found' });

    if (typeof payload.options === 'string') {
      try { payload.options = JSON.parse(payload.options); } catch (e) { payload.options = []; }
    }
    if (typeof payload.solutions === 'string') {
      try { payload.solutions = JSON.parse(payload.solutions); } catch (e) { payload.solutions = []; }
    }

    if (req.files) {
      // replace question image
      if (req.files.image && Array.isArray(req.files.image) && req.files.image.length) {
        try {
          if (existing.questionImagePublicId) {
            try { await deletePublicId(existing.questionImagePublicId); } catch (err) { console.warn('[updateQuestion] failed to delete old question image', err && err.message); }
          }
        } catch (err) { console.warn('[updateQuestion] error deleting previous question image', err && err.message); }

        const f = req.files.image[0];
        if (f && f.buffer) {
          try {
            const r = await uploadBuffer(f.buffer, 'contributor_questions');
            payload.questionImageUrl = r && r.secure_url ? r.secure_url : undefined;
            payload.questionImagePublicId = r && r.public_id ? r.public_id : undefined;
          } catch (err) { console.error('[updateQuestion] question image upload failed', err && err.message); return res.status(500).json({ success: false, message: 'question image upload failed', error: err && err.message }); }
        }
      }

      // solution image replacements
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
            if (sExisting.imagePublicId) {
              try { await deletePublicId(sExisting.imagePublicId); } catch (err) { console.warn('[updateQuestion] failed to delete old solution image', err && err.message); }
            }
          } catch (err) { console.warn('[updateQuestion] error deleting existing solution images', err && err.message); }
        }

        // upload new images
        for (let i = 0; i < req.files.solutionImages.length; i++) {
          const f = req.files.solutionImages[i];
          const targetIndex = (Array.isArray(mapping) && typeof mapping[i] === 'number') ? mapping[i] : i;
          if (!payload.solutions[targetIndex]) payload.solutions[targetIndex] = {};
          if (f && f.buffer) {
            try {
              const r = await uploadBuffer(f.buffer, 'contributor_solutions');
              if (r && r.secure_url) {
                payload.solutions[targetIndex].imageUrls = payload.solutions[targetIndex].imageUrls || [];
                payload.solutions[targetIndex].imageUrls.push(r.secure_url);
                payload.solutions[targetIndex].imageUrl = r.secure_url;
              }
              if (r && r.public_id) {
                payload.solutions[targetIndex].imagePublicIds = payload.solutions[targetIndex].imagePublicIds || [];
                payload.solutions[targetIndex].imagePublicIds.push(r.public_id);
                payload.solutions[targetIndex].imagePublicId = r.public_id;
              }
            } catch (err) { console.warn('[updateQuestion] solution image upload failed', err && err.message); }
          }
        }
      }

      // option image replacements
      if (req.files.optionImages && Array.isArray(req.files.optionImages) && req.files.optionImages.length) {
        // ensure payload.options exists (use existing if not provided)
        if (payload.options === undefined) {
          payload.options = existing.options ? existing.options.map(o => ({ text: o.text, isCorrect: o.isCorrect, imageUrl: o.imageUrl, imagePublicId: o.imagePublicId })) : [];
        }

        let mapping = null;
        if (payload.optionImageOptionIndex) {
          try { mapping = JSON.parse(payload.optionImageOptionIndex); } catch (e) { mapping = null; }
        }

        const updatedOptionIndices = new Set();
        for (let i = 0; i < req.files.optionImages.length; i++) {
          const targ = (Array.isArray(mapping) && typeof mapping[i] === 'number') ? mapping[i] : i;
          updatedOptionIndices.add(targ);
        }

        // delete existing images for updated options
        for (const idx of updatedOptionIndices) {
          const oExisting = existing.options && existing.options[idx];
          if (!oExisting) continue;
          try {
            if (oExisting.imagePublicId) {
              try { await deletePublicId(oExisting.imagePublicId); } catch (err) { console.warn('[updateQuestion] failed to delete old option image', err && err.message); }
            }
          } catch (err) { console.warn('[updateQuestion] error deleting existing option images', err && err.message); }
        }

        // upload new option images
        for (let i = 0; i < req.files.optionImages.length; i++) {
          const f = req.files.optionImages[i];
          const targetIndex = (Array.isArray(mapping) && typeof mapping[i] === 'number') ? mapping[i] : i;
          if (!payload.options[targetIndex]) payload.options[targetIndex] = {};
          if (f && f.buffer) {
            try {
              const r = await uploadBuffer(f.buffer, 'contributor_options');
              if (r && r.secure_url) {
                payload.options[targetIndex].imageUrls = payload.options[targetIndex].imageUrls || [];
                payload.options[targetIndex].imageUrls.push(r.secure_url);
                payload.options[targetIndex].imageUrl = r.secure_url;
              }
              if (r && r.public_id) {
                payload.options[targetIndex].imagePublicIds = payload.options[targetIndex].imagePublicIds || [];
                payload.options[targetIndex].imagePublicIds.push(r.public_id);
                payload.options[targetIndex].imagePublicId = r.public_id;
              }
            } catch (err) { console.warn('[updateQuestion] option image upload failed', err && err.message); }
          }
        }
      }
    }

    // authorization
    if (existing.contributor && req.contributor && existing.contributor.toString() !== req.contributor.id) {
      return res.status(403).json({ success: false, message: 'forbidden' });
    }

    // apply updates
    const allowedArrays = ['options', 'solutions'];
    allowedArrays.forEach(k => { if (payload[k] !== undefined) existing[k] = payload[k]; });
    const allowedScalars = ['subTopic','difficulty','question','questionImageUrl','questionImagePublicId'];
    allowedScalars.forEach(k => { if (payload[k] !== undefined) existing[k] = payload[k]; });

    // If options were updated or created via images, validate they each have text or image
    if (existing.options && Array.isArray(existing.options)) {
      for (let oi = 0; oi < existing.options.length; oi++) {
        const op = existing.options[oi] || {};
        const hasText = typeof op.text === 'string' && op.text.trim().length > 0;
        const hasImage = !!(op.imageUrl || op.imagePublicId);
        if (!hasText && !hasImage) {
          return res.status(400).json({ success: false, message: `Option ${oi + 1} must have text or an image` });
        }
      }
    }

    await existing.save();
    return res.json({ success: true, data: existing });
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

    const cloudErrors = [];
    try {
      if (doc.questionImagePublicId) {
        try { const delRes = await deletePublicId(doc.questionImagePublicId); if (!delRes || (delRes.result && delRes.result !== 'ok')) cloudErrors.push({ id: doc.questionImagePublicId, result: delRes }); } catch (err) { cloudErrors.push({ id: doc.questionImagePublicId, error: err && err.message }); }
      }

      // legacy compatibility
      if (Array.isArray(doc.imagePublicIds) && doc.imagePublicIds.length) {
        for (const pid of doc.imagePublicIds) {
          try { const delRes = await deletePublicId(pid); if (!delRes || (delRes.result && delRes.result !== 'ok')) cloudErrors.push({ id: pid, result: delRes }); } catch (err) { cloudErrors.push({ id: pid, error: err && err.message }); }
        }
      }

      if (Array.isArray(doc.solutions)) {
        for (const s of doc.solutions) {
          if (!s) continue;
          if (s.imagePublicId) {
            try { const delRes = await deletePublicId(s.imagePublicId); if (!delRes || (delRes.result && delRes.result !== 'ok')) cloudErrors.push({ id: s.imagePublicId, result: delRes }); } catch (err) { cloudErrors.push({ id: s.imagePublicId, error: err && err.message }); }
          }
          if (Array.isArray(s.imagePublicIds) && s.imagePublicIds.length) {
            for (const pid of s.imagePublicIds) {
              try { const delRes = await deletePublicId(pid); if (!delRes || (delRes.result && delRes.result !== 'ok')) cloudErrors.push({ id: pid, result: delRes }); } catch (err) { cloudErrors.push({ id: pid, error: err && err.message }); }
            }
          }
        }
      }
      if (Array.isArray(doc.options)) {
        for (const o of doc.options) {
          if (!o) continue;
          if (o.imagePublicId) {
            try { const delRes = await deletePublicId(o.imagePublicId); if (!delRes || (delRes.result && delRes.result !== 'ok')) cloudErrors.push({ id: o.imagePublicId, result: delRes }); } catch (err) { cloudErrors.push({ id: o.imagePublicId, error: err && err.message }); }
          }
          if (Array.isArray(o.imagePublicIds) && o.imagePublicIds.length) {
            for (const pid of o.imagePublicIds) {
              try { const delRes = await deletePublicId(pid); if (!delRes || (delRes.result && delRes.result !== 'ok')) cloudErrors.push({ id: pid, result: delRes }); } catch (err) { cloudErrors.push({ id: pid, error: err && err.message }); }
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
    if (req.query.subTopic) q.subTopic = req.query.subTopic;
    if (req.query.difficulty) q.difficulty = req.query.difficulty;
    if (req.query.contributor) q.contributor = req.query.contributor;
    if (req.query.tag) q.tags = req.query.tag;

    const docs = await ContributorQuestion.find(q).sort({ questionNumber: 1 }).limit(100);
    return res.json({ success: true, data: docs });
  } catch (err) {
    console.error('[listQuestions] error', err);
    return res.status(500).json({ success: false, message: 'server error', error: err.message });
  }
};

module.exports = { createQuestion, getQuestion, updateQuestion, deleteQuestion, listQuestions };
