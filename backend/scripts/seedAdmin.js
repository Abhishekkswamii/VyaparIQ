"use strict";
/**
 * Seed admin user.
 *
 * Usage (from project root):
 *   ADMIN_EMAIL=admin@vyapariq.com ADMIN_PASSWORD=Secret@123 \
 *     node backend/scripts/seedAdmin.js
 *
 * Or set variables in .env and run from the backend directory:
 *   node scripts/seedAdmin.js
 */

const path = require("path");

// Load .env from project root or backend directory
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME     = process.env.ADMIN_NAME || "Admin";

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.\n" +
    "Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret node scripts/seedAdmin.js"
  );
  process.exit(1);
}

async function seedAdmin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows } = await pool.query(
      "SELECT id, role FROM users WHERE email = $1",
      [ADMIN_EMAIL]
    );

    if (rows.length > 0) {
      // Always update password + ensure role=admin
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await pool.query(
        "UPDATE users SET role='admin', password_hash=$1, provider='local' WHERE email=$2",
        [hash, ADMIN_EMAIL]
      );
      console.log(`✓ Admin password updated: ${ADMIN_EMAIL}`);
      return;
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const nameParts = ADMIN_NAME.trim().split(" ");
    const firstName = nameParts[0] || "Admin";
    const lastName  = nameParts.slice(1).join(" ") || "";
    const result = await pool.query(
      `INSERT INTO users (name, first_name, last_name, email, password_hash, provider, role)
         VALUES ($1, $2, $3, $4, $5, 'local', 'admin')
       RETURNING id, email`,
      [ADMIN_NAME, firstName, lastName, ADMIN_EMAIL, hash]
    );

    console.log(`✓ Admin user created: ${result.rows[0].email} (id=${result.rows[0].id})`);
  } finally {
    await pool.end();
  }
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
