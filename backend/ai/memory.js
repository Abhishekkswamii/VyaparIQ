"use strict";

const TASK_LOG_TTL = 60 * 60 * 4;     // 4 hours — recent task context
const PENDING_TTL  = 60 * 5;           // 5 min  — disambiguation hold
const PREFS_TTL    = 60 * 60 * 24 * 7; // 7 days — user preferences

const taskKey   = (uid) => `vyra:tasks:${uid}`;
const pendingKey = (uid) => `vyra:pending:${uid}`;
const prefsKey  = (uid) => `vyra:prefs:${uid}`;

// ── Task log (NOT chat history — only meaningful agent actions) ──────────────

async function logTask(redis, userId, { intent, items = [], actions = [] }) {
  const key = taskKey(userId);
  try {
    const raw = await redis.get(key);
    const log = raw ? JSON.parse(raw) : [];
    log.unshift({ intent, items, actions, ts: Date.now() });
    await redis.set(key, JSON.stringify(log.slice(0, 10)), "EX", TASK_LOG_TTL);
  } catch {
    // non-fatal
  }
}

async function getRecentTasks(redis, userId, limit = 5) {
  try {
    const raw = await redis.get(taskKey(userId));
    const log = raw ? JSON.parse(raw) : [];
    return log.slice(0, limit);
  } catch {
    return [];
  }
}

// ── Pending disambiguation (e.g. multiple product matches) ───────────────────

async function setPending(redis, userId, data) {
  try {
    await redis.set(pendingKey(userId), JSON.stringify(data), "EX", PENDING_TTL);
  } catch {}
}

async function getPending(redis, userId) {
  try {
    const raw = await redis.get(pendingKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function clearPending(redis, userId) {
  try {
    await redis.del(pendingKey(userId));
  } catch {}
}

// ── User preferences (language, dietary, favourite categories) ───────────────

async function getPreferences(redis, userId) {
  try {
    const raw = await redis.get(prefsKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function setPreferences(redis, userId, prefs) {
  try {
    const existing = await getPreferences(redis, userId);
    await redis.set(prefsKey(userId), JSON.stringify({ ...existing, ...prefs }), "EX", PREFS_TTL);
  } catch {}
}

module.exports = {
  logTask,
  getRecentTasks,
  setPending,
  getPending,
  clearPending,
  getPreferences,
  setPreferences,
};
