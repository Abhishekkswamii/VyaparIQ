"use strict";
/**
 * Passport Google OAuth strategy.
 * Call configurePassport(pool) once in server.js after the DB pool is ready.
 *
 * Required environment variables:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_CALLBACK_URL  (e.g. http://localhost:5001/api/auth/google/callback)
 */

const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");

const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  "http://localhost:5001/api/auth/google/callback";

/**
 * Minimal serialize / deserialize — sessions are used only for the
 * short-lived OAuth handshake, not for regular API requests (those use JWT).
 */
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

function configurePassport(db) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn(
      "⚠️  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google OAuth disabled"
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("Google did not return an email address"), null);

          // Check for existing user (any provider)
          const { rows } = await db.query(
            `SELECT id, first_name, last_name, email, role, provider
               FROM users WHERE email = $1`,
            [email]
          );

          if (rows.length > 0) {
            // Return existing user — preserves admin role if set
            return done(null, rows[0]);
          }

          // New Google user — role is always "user"
          const firstName =
            profile.name?.givenName ||
            profile.displayName.split(" ")[0] ||
            "";
          const lastName =
            profile.name?.familyName ||
            profile.displayName.split(" ").slice(1).join(" ") ||
            "";

          const result = await db.query(
            `INSERT INTO users (name, first_name, last_name, email, provider, role)
               VALUES ($1, $2, $3, $4, 'google', 'user')
             RETURNING id, first_name, last_name, email, role, provider`,
            [`${firstName} ${lastName}`.trim(), firstName, lastName, email]
          );

          return done(null, result.rows[0]);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  console.log("✓ Google OAuth strategy registered");
}

module.exports = { configurePassport };
