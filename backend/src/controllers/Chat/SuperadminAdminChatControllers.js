const SuperadminAdminChat = require('../../models/SuperadminAdminChat');
const Admin = require('../../models/Admin');

// Admin-side handlers (admin talking to superadmin)
const listForAdmin = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    console.log('[SuperadminAdminChat.listForAdmin] called by', adminUser);

    let chats = await SuperadminAdminChat.find({})
      .sort({ lastMessageAt: -1 })
      .lean();

    // Deduplicate chats by normalized superadmin name to avoid duplicate SA entries
    const normalize = (s) => (s || '').toString().trim().toLowerCase();
    const seenSA = new Set();
    const unique = [];
    for (const c of chats) {
      const key = normalize(c.superadminName) || '';
      if (!seenSA.has(key)) {
        unique.push(c);
        seenSA.add(key);
      }
    }

    // Ensure at least one entry for the configured superadmin exists so admin can start a chat
    const saName = (process.env.SUPERADMIN_USERNAME || 'superadmin').toString();
    const saKey = normalize(saName);
    if (!seenSA.has(saKey)) {
      unique.unshift({
        _id: `sa-${saName}`,
        superadminName: saName,
        superadminId: null,
        adminId: req.admin && req.admin.id,
        adminName: adminUser,
        messages: [],
        lastMessageAt: null,
        unreadCountAdmin: 0,
        unreadCountSuperadmin: 0
      });
    }

    return res.json({ success: true, data: unique });
  } catch (err) {
    console.error('[SuperadminAdminChat.listForAdmin] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getChatWithSuperadmin = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const superadminName = (req.params.superadminName || '').toString() || process.env.SUPERADMIN_USERNAME || 'superadmin';
    console.log('[SuperadminAdminChat.getChatWithSuperadmin] called by', adminUser, 'for', superadminName);

    const chat = await SuperadminAdminChat.findOne({ superadminName }).lean();
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    return res.json({ success: true, data: chat });
  } catch (err) {
    console.error('[SuperadminAdminChat.getChatWithSuperadmin] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const sendMessageToSuperadmin = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const adminId = req.admin && req.admin.id;
    const superadminName = (req.params.superadminName || '').toString() || process.env.SUPERADMIN_USERNAME || 'superadmin';
    const { message } = req.body || {};

    console.log('[SuperadminAdminChat.sendMessageToSuperadmin] called by', adminUser, 'to', superadminName);

    if (!message || message.trim() === '') return res.status(400).json({ success: false, message: 'Message cannot be empty' });

    let chat = await SuperadminAdminChat.findOne({ superadminName });
    if (!chat) {
      chat = new SuperadminAdminChat({
        superadminName,
        adminId,
        adminName: adminUser,
        messages: []
      });
    }

    if (!chat.adminId) {
      chat.adminId = adminId;
      chat.adminName = adminUser;
    }

    chat.messages.push({
      senderRole: 'admin',
      senderId: adminId,
      senderModel: 'Admin',
      senderName: adminUser,
      message: message.trim(),
      timestamp: new Date(),
      read: false
    });

    chat.unreadCountSuperadmin = (chat.unreadCountSuperadmin || 0) + 1;
    chat.lastMessageAt = new Date();

    await chat.save();
    return res.json({ success: true, data: chat });
  } catch (err) {
    console.error('[SuperadminAdminChat.sendMessageToSuperadmin] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const markSuperadminMessagesRead = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const superadminName = (req.params.superadminName || '').toString() || process.env.SUPERADMIN_USERNAME || 'superadmin';
    console.log('[SuperadminAdminChat.markSuperadminMessagesRead] called by', adminUser, 'for', superadminName);

    const chat = await SuperadminAdminChat.findOne({ superadminName });
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    let updated = false;
    chat.messages.forEach(msg => {
      if (msg.senderRole === 'superadmin' && !msg.read) {
        msg.read = true;
        updated = true;
      }
    });

    if (updated) {
      chat.unreadCountAdmin = 0;
      await chat.save();
    }

    return res.json({ success: true, data: chat });
  } catch (err) {
    console.error('[SuperadminAdminChat.markSuperadminMessagesRead] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// SuperAdmin-side handlers (superadmin talking to admin)
const listForSuperAdmin = async (req, res) => {
  try {
    const superUser = req.superadmin && req.superadmin.username;
    console.log('[SuperadminAdminChat.listForSuperAdmin] called by', superUser);

    // Get existing chats
    let chats = await SuperadminAdminChat.find({})
      .sort({ lastMessageAt: -1 })
      .lean();

    // Also fetch all admins so superadmin can start chats even if none exist yet
    const admins = await Admin.find({}, { passwordHash: 0 }).lean();

    // Create placeholders for admins without chats
    const existingAdminIds = new Set(chats.map(c => c.adminId && c.adminId.toString()));
    const placeholders = admins
      .filter(a => !existingAdminIds.has(a._id.toString()))
      .map(a => ({
        _id: `admin-${a._id}`,
        superadminName: superUser || (process.env.SUPERADMIN_USERNAME || 'superadmin'),
        superadminId: null,
        adminId: a._id,
        adminName: a.username,
        messages: [],
        lastMessageAt: null,
        unreadCountAdmin: 0,
        unreadCountSuperadmin: 0
      }));

    // Prepend placeholders so admins appear in list
    chats = [...placeholders, ...chats];

    return res.json({ success: true, data: chats });
  } catch (err) {
    console.error('[SuperadminAdminChat.listForSuperAdmin] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getChatWithAdmin = async (req, res) => {
  try {
    const superUser = req.superadmin && req.superadmin.username;
    const adminId = req.params.adminId;
    console.log('[SuperadminAdminChat.getChatWithAdmin] called by', superUser, 'for admin', adminId);

    const chat = await SuperadminAdminChat.findOne({ adminId }).lean();
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    return res.json({ success: true, data: chat });
  } catch (err) {
    console.error('[SuperadminAdminChat.getChatWithAdmin] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const sendMessageToAdmin = async (req, res) => {
  try {
    const superUser = req.superadmin && req.superadmin.username;
    const adminId = req.params.adminId;
    const { message } = req.body || {};

    console.log('[SuperadminAdminChat.sendMessageToAdmin] called by', superUser, 'to admin', adminId);

    if (!message || message.trim() === '') return res.status(400).json({ success: false, message: 'Message cannot be empty' });

    let chat = await SuperadminAdminChat.findOne({ adminId });
    if (!chat) {
      const admin = await Admin.findById(adminId);
      if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

      chat = new SuperadminAdminChat({
        superadminName: superUser || process.env.SUPERADMIN_USERNAME || 'superadmin',
        adminId: admin._id,
        adminName: admin.username,
        messages: []
      });
    }

    chat.messages.push({
      senderRole: 'superadmin',
      senderId: superUser || (process.env.SUPERADMIN_USERNAME || 'superadmin'),
      senderModel: 'SuperAdmin',
      senderName: superUser || (process.env.SUPERADMIN_USERNAME || 'superadmin'),
      message: message.trim(),
      timestamp: new Date(),
      read: false
    });

    chat.unreadCountAdmin = (chat.unreadCountAdmin || 0) + 1;
    chat.lastMessageAt = new Date();

    await chat.save();
    return res.json({ success: true, data: chat });
  } catch (err) {
    console.error('[SuperadminAdminChat.sendMessageToAdmin] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const markAdminMessagesRead = async (req, res) => {
  try {
    const superUser = req.superadmin && req.superadmin.username;
    const adminId = req.params.adminId;
    console.log('[SuperadminAdminChat.markAdminMessagesRead] called by', superUser, 'for admin', adminId);

    const chat = await SuperadminAdminChat.findOne({ adminId });
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    let updated = false;
    chat.messages.forEach(msg => {
      if (msg.senderRole === 'admin' && !msg.read) {
        msg.read = true;
        updated = true;
      }
    });

    if (updated) {
      chat.unreadCountSuperadmin = 0;
      await chat.save();
    }

    return res.json({ success: true, data: chat });
  } catch (err) {
    console.error('[SuperadminAdminChat.markAdminMessagesRead] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getUnreadMessagesCount = async (req, res) => {
  try {
    const user = req.admin ? (req.admin.username || 'admin') : (req.superadmin ? req.superadmin.username : 'super');
    console.log('[SuperadminAdminChat.getUnreadMessagesCount] called by', user);

    const chats = await SuperadminAdminChat.find({});
    const totalUnreadForAdmin = chats.reduce((sum, c) => sum + (c.unreadCountAdmin || 0), 0);
    const totalUnreadForSuperadmin = chats.reduce((sum, c) => sum + (c.unreadCountSuperadmin || 0), 0);

    return res.json({ success: true, data: { unreadCountAdmin: totalUnreadForAdmin, unreadCountSuperadmin: totalUnreadForSuperadmin } });
  } catch (err) {
    console.error('[SuperadminAdminChat.getUnreadMessagesCount] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  // admin side
  listForAdmin,
  getChatWithSuperadmin,
  sendMessageToSuperadmin,
  markSuperadminMessagesRead,
  // superadmin side
  listForSuperAdmin,
  getChatWithAdmin,
  sendMessageToAdmin,
  markAdminMessagesRead,
  // utility
  getUnreadMessagesCount
};
