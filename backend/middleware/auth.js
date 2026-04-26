const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

/**
 * Verifies the Bearer JWT and checks that it hasn't been revoked
 * (via the Redis blacklist written by POST /api/auth/logout).
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  // Check Redis token blacklist (populated on logout)
  try {
    const redis = req.app.get("redis");
    if (redis) {
      const revoked = await redis.get(`bl:${token}`);
      if (revoked) {
        return res.status(401).json({ error: "Token revoked — please log in again" });
      }
    }
  } catch (redisErr) {
    // If Redis is down, log a warning but don't block the request —
    // the JWT signature + expiry are still valid proof of identity.
    console.warn("[auth] Redis blacklist check failed:", redisErr.message);
  }

  req.user = decoded; // { id, email, role, ... }
  next();
}

/**
 * Factory: requireRole("admin") — use after authenticateToken.
 * Returns 403 if req.user.role doesn't match.
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (req.user.role !== role) {
      return res.status(403).json({ error: `${role} access required` });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };
