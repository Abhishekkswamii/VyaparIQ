const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authenticateToken };
