const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Contributor = require('../../models/Contributor');
const ContributorRequest = require('../../models/ContributorRequest');
const AdminContributorChat = require('../../models/AdminContributorChat');
const Question = require('../../models/Question');
const Library = require('../../models/Library');

const login = async (req, res) => {
  const { username, password } = req.body || {};
  console.log('[Contributor.login] called', { username });
  if (!username || !password) {
    console.log('[Contributor.login] missing credentials');
    return res.status(400).json({ success: false, message: 'username and password required' });
  }

  try {
    const user = await Contributor.findOne({ username });
    if (!user) {
      console.log('[Contributor.login] user not found', username);
      return res.status(401).json({ success: false, message: 'invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.log('[Contributor.login] invalid password for', username);
      return res.status(401).json({ success: false, message: 'invalid credentials' });
    }

    const secret = process.env.CONTRIBUTOR_JWT_SECRET || process.env.ADMIN_JWT_SECRET || process.env.SUPERADMIN_JWT_SECRET;
    if (!secret) {
      console.error('[Contributor.login] jwt secret not configured');
      return res.status(500).json({ success: false, message: 'server jwt secret not configured' });
    }

    const token = jwt.sign({ role: 'contributor', id: user._id, username: user.username }, secret, { expiresIn: '6h' });
    console.log('[Contributor.login] authenticated', username);
    return res.json({ success: true, role: 'contributor', token, data: { id: user._id, username: user.username, fname: user.fname, lname: user.lname } });
  } catch (err) {
    console.error('[Contributor.login] error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// simple protected endpoint to verify contributor token and return a welcome message
const dashboard = async (req, res) => {
  try {
    const contributor = req.contributor || {};
    console.log('[Contributor.dashboard] called by', contributor.username || contributor.id);
    return res.json({ success: true, message: `Welcome, ${contributor.username || 'contributor'}` });
  } catch (err) {
    console.error('[Contributor.dashboard] error', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Create a new contribution request
const createRequest = async (req, res) => {
  try {
    const contributor = req.contributor || {};
    const { questionRequests, notes, draftedQuestions } = req.body || {};

    console.log('[Contributor.createRequest] called by', contributor.username);
    
    if (!questionRequests || !Array.isArray(questionRequests) || questionRequests.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'questionRequests array is required and must not be empty' 
      });
    }

    // Validate each question request (no longer requires difficulty)
    for (const qr of questionRequests) {
      if (!qr.topic || !qr.category || !qr.count) {
        return res.status(400).json({ 
          success: false, 
          message: 'Each question request must have topic, category, and count' 
        });
      }
      if (!['aptitude', 'technical', 'psychometric'].includes(qr.category)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid category. Must be aptitude, technical, or psychometric' 
        });
      }
      if (qr.count < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Question count must be at least 1' 
        });
      }
    }

    // Validate drafted questions if provided
    const topics = Array.isArray(questionRequests) ? questionRequests.map(qr => qr.topic) : [];
    if (Array.isArray(draftedQuestions) && draftedQuestions.length > 0) {
      for (const q of draftedQuestions) {
          // Check basic fields
          if (!q.text || !q.options || q.options.length < 2 || !q.topic || !q.difficulty) {
          return res.status(400).json({ 
            success: false, 
            message: 'Each drafted question must have text, at least 2 options, category, and difficulty' 
          });
        }
        
        // Validate correct answers - support both old (correctIndex) and new (isCorrect) formats
        const hasCorrectIndex = q.correctIndex !== undefined && q.correctIndex !== null;
        const hasIsCorrect = Array.isArray(q.options) && q.options.some(opt => opt.isCorrect === true);
        
        if (!hasCorrectIndex && !hasIsCorrect) {
          return res.status(400).json({ 
            success: false, 
            message: 'Each drafted question must have at least one correct answer (either correctIndex or isCorrect in options)' 
          });
        }
        
          if (!topics.includes(q.topic)) {
            return res.status(400).json({ success: false, message: `Drafted question topic '${q.topic}' does not match any request topic` });
          }
      }
    }

    const newRequest = new ContributorRequest({
      contributorId: contributor.id,
      contributorName: contributor.username,
      questionRequests,
        draftedQuestions: draftedQuestions || [],
      notes
    });

    await newRequest.save();

    console.log('[Contributor.createRequest] ✓ created request - id:', newRequest._id.toString());
    return res.status(201).json({ success: true, data: newRequest });
  } catch (err) {
    console.error('[Contributor.createRequest] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all requests by this contributor
const getMyRequests = async (req, res) => {
  try {
    const contributor = req.contributor || {};
    console.log('[Contributor.getMyRequests] called by', contributor.username);

    const requests = await ContributorRequest.find({ 
      contributorId: contributor.id 
    }).sort({ submittedAt: -1 });

    return res.json({ 
      success: true, 
      data: requests
    });
  } catch (err) {
    console.error('[Contributor.getMyRequests] error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get a single request by ID
const getRequestById = async (req, res) => {
  try {
    const contributor = req.contributor || {};
    const { id } = req.params;

    console.log('[Contributor.getRequestById] called by', contributor.username, 'for request', id);

    const request = await ContributorRequest.findOne({ 
      _id: id,
      contributorId: contributor.id 
    });

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }

    return res.json({ 
      success: true, 
      data: request
    });
  } catch (err) {
    console.error('[Contributor.getRequestById] error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all questions contributed by this contributor
const getMyContributions = async (req, res) => {
  try {
    const contributor = req.contributor || {};
    console.log('[Contributor.getMyContributions] called by', contributor.username);

    // Support questions created by contributors (`createdByContributor`) or older `createdBy` reference
    const questions = await Question.find({
      $or: [ { createdByContributor: contributor.id }, { createdBy: contributor.id } ]
    }).sort({ createdAt: -1 });

    return res.json({ 
      success: true, 
      data: questions
    });
  } catch (err) {
    console.error('[Contributor.getMyContributions] error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Create a single question contribution
const createQuestion = async (req, res) => {
  try {
    const contributor = req.contributor || {};
    const payload = req.body || {};
    console.log('[Contributor.createQuestion] called by', contributor.username);

    const { text, options, correctIndex, category, difficulty, tags, details } = payload;

    if (!text || !Array.isArray(options) || options.length < 2 || typeof correctIndex !== 'number') {
      return res.status(400).json({ success: false, message: 'text, options (>=2) and correctIndex are required' });
    }

    if (!['aptitude', 'technical', 'psychometric'].includes((category || '').toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Invalid or missing category' });
    }

    if (!['easy', 'medium', 'hard'].includes((difficulty || 'medium').toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Invalid difficulty' });
    }

    const q = new Question({
      text: text.trim(),
      options: options.map(o => ({ text: (o && o.text) ? o.text : String(o) })),
      correctIndex,
      category: category.toLowerCase(),
      difficulty: difficulty.toLowerCase(),
      tags: Array.isArray(tags) ? tags : [],
      details: details || undefined,
      createdByContributor: contributor.id
    });

    await q.save();
    console.log('[Contributor.createQuestion] saved question', q._id);

    return res.json({ success: true, data: q });
  } catch (err) {
    console.error('[Contributor.createQuestion] error', err && err.stack || err);
    return res.status(500).json({ success: false, message: err.message || 'internal error' });
  }
};

// Get or create chat with admin
const getOrCreateChat = async (req, res) => {
  try {
    const contributor = req.contributor || {};
    console.log('[Contributor.getOrCreateChat] called by', contributor.username);

    let chat = await AdminContributorChat.findOne({ 
      contributorId: contributor.id 
    });

    if (!chat) {
      chat = new AdminContributorChat({
        contributorId: contributor.id,
        contributorName: contributor.username,
        messages: []
      });
      await chat.save();
      console.log('[Contributor.getOrCreateChat] new chat created');
    }

    return res.json({ 
      success: true, 
      data: chat
    });
  } catch (err) {
    console.error('[Contributor.getOrCreateChat] error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Send a message to admin
const sendMessage = async (req, res) => {
  try {
    const contributor = req.contributor || {};
    const { message } = req.body;

    console.log('[Contributor.sendMessage] called by', contributor.username, 'id=', contributor.id);

    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Message cannot be empty' 
      });
    }

    const mongoose = require('mongoose');
    if (!contributor.id || !mongoose.Types.ObjectId.isValid(contributor.id)) {
      console.error('[Contributor.sendMessage] invalid contributor id:', contributor.id);
      return res.status(400).json({ success: false, message: 'invalid contributor id' });
    }

    const msg = {
      senderRole: 'contributor',
      senderId: new mongoose.Types.ObjectId(contributor.id),
      senderModel: 'Contributor',
      senderName: contributor.username || 'contributor',
      message: message.trim(),
      timestamp: new Date(),
      read: false
    };

    // Atomically create or update chat, push message and increment unread count
    const update = {
      $setOnInsert: {
        contributorId: new mongoose.Types.ObjectId(contributor.id),
        contributorName: contributor.username || 'contributor',
        createdAt: new Date()
      },
      $push: { messages: msg },
      $inc: { unreadCountAdmin: 1 },
      $set: { lastMessageAt: new Date() }
    };

    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    const chat = await AdminContributorChat.findOneAndUpdate({ contributorId: contributor.id }, update, options).exec();

    console.log('[Contributor.sendMessage] message saved to chat id=', chat && chat._id);

    return res.json({ success: true, data: chat });
  } catch (err) {
    console.error('[Contributor.sendMessage] error', err && err.stack || err);
    return res.status(500).json({ success: false, message: err.message || 'internal error' });
  }
};

// Mark messages as read by contributor
const markMessagesAsRead = async (req, res) => {
  try {
    const contributor = req.contributor || {};
    console.log('[Contributor.markMessagesAsRead] called by', contributor.username);

    const chat = await AdminContributorChat.findOne({ 
      contributorId: contributor.id 
    });

    if (!chat) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chat not found' 
      });
    }

    // Mark all admin messages as read
    let updated = false;
    chat.messages.forEach(msg => {
      if (msg.senderRole === 'admin' && !msg.read) {
        msg.read = true;
        updated = true;
      }
    });

    if (updated) {
      chat.unreadCountContributor = 0;
      await chat.save();
    }

    return res.json({ 
      success: true, 
      data: chat
    });
  } catch (err) {
    console.error('[Contributor.markMessagesAsRead] error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const contributor = req.contributor || {};
    console.log('[Contributor.getUnreadCount] called by', contributor.username);

    const chat = await AdminContributorChat.findOne({ 
      contributorId: contributor.id 
    });

    const unreadCount = chat ? chat.unreadCountContributor : 0;

    return res.json({ 
      success: true, 
      data: { unreadCount }
    });
  } catch (err) {
    console.error('[Contributor.getUnreadCount] error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get library questions contributed by this contributor
// Organized by topic and subtopic
const getMyLibraryQuestions = async (req, res) => {
  try {
    const contributor = req.contributor || {};
    console.log('[Contributor.getMyLibraryQuestions] called by', contributor.username);

    // Use Library model's helper method to get organized questions
    const organized = await Library.getAllQuestionsByContributor(contributor.id);

    return res.json({ 
      success: true, 
      data: organized
    });
  } catch (err) {
    console.error('[Contributor.getMyLibraryQuestions] error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get library structure (topics and subtopics)
const getLibraryStructure = async (req, res) => {
  try {
    console.log('[Contributor.getLibraryStructure] called');

    const library = await Library.getLibraryStructure();

    return res.json({ 
      success: true, 
      data: library
    });
  } catch (err) {
    console.error('[Contributor.getLibraryStructure] error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  login, 
  dashboard,
  createRequest,
  getMyRequests,
  getRequestById,
  getMyContributions,
  createQuestion,
  getOrCreateChat,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  getMyLibraryQuestions,
  getLibraryStructure
};

