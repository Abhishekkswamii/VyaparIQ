"use strict";

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

/**
 * Express middleware — allows only valid JWTs whose payload contains role = 'admin'.
 * Usage: router.use(requireAdmin) or per-route.
 */
async function requireAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Admin privileges required" });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

module.exports = { requireAdmin };
