const AdminLog = require('../../models/AdminLog');
const fs = require('fs');
const os = require('os');
const path = require('path');

const createLog = async ({ actorId, actorUsername, role, actionType, message, refs }) => {
  try {
    const doc = await AdminLog.create({ actorId, actorUsername, role, actionType, message, refs: refs || {}, timestamp: new Date() });
    return doc;
  } catch (err) {
    console.error('[AdminLog.createLog] error', err && err.message);
    // don't throw to avoid breaking caller flows
    return null;
  }
};

// GET /admin/logs
const getLogs = async (req, res) => {
  try {
    const { role, actionType, q, actorUsername, startTime, endTime, page = 1, limit = 200 } = req.query || {};
    const query = {};
    if (role) query.role = role;
    if (actionType) query.actionType = actionType;
    if (actorUsername) query.actorUsername = { $regex: actorUsername, $options: 'i' };
    if (q) query.message = { $regex: q, $options: 'i' };
    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = new Date(startTime);
      if (endTime) query.timestamp.$lte = new Date(endTime);
    }

    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(1000, Math.max(1, Number(limit) || 200));

    const docs = await AdminLog.find(query).sort({ timestamp: -1 }).skip((p - 1) * l).limit(l).lean();
    const total = await AdminLog.countDocuments(query);
    return res.json({ success: true, data: docs, meta: { total, page: p, limit: l } });
  } catch (err) {
    console.error('[AdminLog.getLogs] error', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /admin/logs/clear
// Archives logs for a given range (or all if not provided) into a JSON file and clears collection
const clearLogs = async (req, res) => {
  try {
    const { startTime, endTime } = req.body || {};
    const query = {};
    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = new Date(startTime);
      if (endTime) query.timestamp.$lte = new Date(endTime);
    }

    const logs = await AdminLog.find(query).sort({ timestamp: 1 }).lean();

    const startMs = logs.length ? new Date(logs[0].timestamp).getTime() : Date.now();
    const endMs = logs.length ? new Date(logs[logs.length - 1].timestamp).getTime() : Date.now();
    const filename = `(${startMs}_${endMs})_adminLogs.json`;

    // Ensure archive directory exists inside backend folder
    const archiveDir = path.resolve(__dirname, '../../..', 'archives');
    try {
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
    } catch (e) {
      console.error('[AdminLog.clearLogs] failed to create archive dir', e && e.message);
    }

    const archivePath = path.join(archiveDir, filename);
    fs.writeFileSync(archivePath, JSON.stringify({ exportedAt: new Date().toISOString(), count: logs.length, logs }, null, 2), 'utf8');

    // Do NOT delete logs from DB; frontend will reflect cleared view without removing DB records

    // Send file as download (file is retained on server)
    res.download(archivePath, filename, (err) => {
      if (err) {
        console.error('[AdminLog.clearLogs] send error', err && err.message);
      }
    });
  } catch (err) {
    console.error('[AdminLog.clearLogs] error', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createLog, getLogs, clearLogs };
