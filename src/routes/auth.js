// src/routes/auth.js
// ensure env vars are loaded before anything else by the main server.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import requireAuth from '../middleware/requireAuth.js';
import crypto from 'crypto';

const router = express.Router();

// Robust env handling (accept either SERVICE_KEY name)
const SUPABASE_URL = process.env.SUPABASE_URL?.trim() || '';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[auth routes] WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. Endpoints will fail until these env vars are provided.'
  );
}

// Create server-side supabase client (service role)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Existing token used by your username/password login flow
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET || 'changeme', { expiresIn: '3d' });
};

/* -----------------------------
   Magic link / session settings
   ----------------------------- */
const MAGIC_LINK_JWT_SECRET = process.env.MAGIC_LINK_JWT_SECRET || process.env.JWT_SECRET || 'magic-secret';
const SESSION_JWT_SECRET = process.env.SESSION_JWT_SECRET || process.env.JWT_SECRET || 'session-secret';
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.FRONTEND_ORIGIN || '';
const FRONTEND_AFTER_LOGIN = process.env.FRONTEND_AFTER_LOGIN || '/app';
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'sid';
const MAGIC_LINK_EXPIRES = process.env.MAGIC_LINK_EXPIRES || '15m'; // token lifetime
const SESSION_EXPIRES_MS = Number(process.env.SESSION_EXPIRES_MS) || 7 * 24 * 60 * 60 * 1000; // 7 days

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

let transporter = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT || 587,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn('[auth routes] SMTP is not fully configured. Magic link emails will fail until SMTP_* env vars are provided.');
}

/* -----------------------------
   Feature flag check
   ----------------------------- */
router.use((req, res, next) => {
  if (process.env.FEATURE_USER_ACCOUNTS !== 'true') {
    return res.status(404).json({ error: 'Not Found' });
  }
  next();
});

/* -----------------------------
   Helper functions
   ----------------------------- */
async function createUserAndProfile(email, name = null) {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{ email, name }])
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return { user: null, error: userError };
    }

    try {
      await supabase
        .from('profiles')
        .insert([{ user_id: user.id, full_name: name }]);
    } catch (profileError) {
      console.error('Error creating profile:', profileError);
      // not fatal — keep user
    }

    return { user, error: null };
  } catch (e) {
    console.error('createUserAndProfile unexpected error', e);
    return { user: null, error: e };
  }
}

function createMagicToken(email, jti) {
  const payload = { sub: email, jti };
  return jwt.sign(payload, MAGIC_LINK_JWT_SECRET, { expiresIn: MAGIC_LINK_EXPIRES });
}

function createSessionToken(email, userId) {
  return jwt.sign({ sub: email, userId }, SESSION_JWT_SECRET, { expiresIn: '7d' });
}

function genJti() {
  return crypto.randomBytes(16).toString('hex');
}



/* -----------------------------
   Existing endpoints (kept as-is, minimal edits)
   ----------------------------- */

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const { user, error } = await createUserAndProfile(email, name);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { error: credError } = await supabase
      .from('user_credentials')
      .insert([{ user_id: user.id, password_hash }]);

    if (credError) {
      return res.status(500).json({ error: 'Failed to save user credentials' });
    }

    res.status(200).json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new Error('Incorrect email or password');
  }

  const { data: creds, error: credsError } = await supabase
    .from('user_credentials')
    .select('password_hash')
    .eq('user_id', user.id)
    .single();

  if (credsError || !creds) {
    throw new Error('Incorrect email or password');
  }

  const match = await bcrypt.compare(password, creds.password_hash);
  if (!match) {
    throw new Error('Incorrect email or password');
  }

  // Create a token
  const token = createToken(user.id);

  res.status(200).json({ email, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/logout
router.post('/auth/logout', (req, res) => {
  try {
    const cookieName = process.env.SESSION_COOKIE_NAME || 'sid';
    const isProduction = process.env.NODE_ENV === 'production';

    // Base options that MUST match the cookie being cleared.
    // IMPORTANT: do NOT force a domain on localhost — browsers typically
    // store the cookie with no Domain attribute for localhost, so clearing
    // must *not* include Domain. Include domain only in production when
    // APP_DOMAIN is set.
    const baseOptions = {
      path: '/',
      sameSite: 'lax',
      secure: isProduction,
    };
    if (isProduction && process.env.APP_DOMAIN) {
      baseOptions.domain = process.env.APP_DOMAIN;
    }

    // 1. Clear the HttpOnly cookie
    res.cookie(cookieName, '', {
      ...baseOptions,
      httpOnly: true,
      expires: new Date(0),
    });

    // 2. Defensively clear non-HttpOnly variant (if it ever existed)
    res.cookie(cookieName, '', {
      ...baseOptions,
      httpOnly: false,
      expires: new Date(0),
    });
    
    console.log(`[auth.logout] Cleared cookie '${cookieName}'${baseOptions.domain ? ` for domain '${baseOptions.domain}'` : ' (no domain)'} `);

    return res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    console.error('[auth/logout] error while clearing cookie', err);
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me
router.get('/auth/me', requireAuth, async (req, res) => {
  const { _id } = req.user;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, email_verified_at')
    .eq('id', _id)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.status(200).json(user);
});

// POST /api/auth/resend-verification
router.post('/auth/resend-verification', requireAuth, async (req, res) => {
  res.status(200).json({ message: 'Verification email sent.' });
});

// POST /api/auth/change-password
router.post('/auth/change-password', requireAuth, async (req, res) => {
  const { _id } = req.user;
  const { oldPassword, newPassword } = req.body;

  const { data: creds, error: credsError } = await supabase
    .from('user_credentials')
    .select('password_hash')
    .eq('user_id', _id)
    .single();

  if (credsError || !creds) {
    return res.status(404).json({ error: 'User not found' });
  }

  const match = await bcrypt.compare(oldPassword, creds.password_hash);
  if (!match) {
    return res.status(400).json({ error: 'Incorrect old password' });
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(newPassword, salt);

  const { error: updateError } = await supabase
    .from('user_credentials')
    .update({ password_hash })
    .eq('user_id', _id);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update password' });
  }

  res.status(200).json({ message: 'Password changed successfully' });
});

// POST /api/auth/claim-guest
router.post('/auth/claim-guest', requireAuth, async (req, res) => {
  const { _id } = req.user;
  const { guestCustomerId } = req.body;

  if (!guestCustomerId) {
    return res.status(400).json({ error: 'Guest customer ID is required' });
  }

  const { error } = await supabase
    .from('orders')
    .update({ user_id: _id })
    .eq('customer_id', guestCustomerId);

  if (error) {
    return res.status(500).json({ error: 'Failed to claim guest orders' });
  }

  res.status(200).json({ message: 'Guest orders claimed successfully' });
});

export default router;
