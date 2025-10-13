// src/routes/githubAuth.js
import express from 'express';

const router = express.Router();

const FRONTEND_URL = process.env.APP_BASE_URL || 'http://localhost:5173';
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'sid';
const COOKIE_MAX = Number(process.env.SESSION_EXPIRES_MS) || 7 * 24 * 60 * 60 * 1000; // default 7 days

// Redirect user to GitHub authorize page
router.get('/auth/github/login', (req, res) => {
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  if (!CLIENT_ID) {
    console.error('[github/login] Missing GITHUB_CLIENT_ID env at request time');
    return res.status(500).send('Server misconfigured (missing GITHUB_CLIENT_ID)');
  }

  const redirectUri = encodeURIComponent('http://localhost:3000/api/auth/github/callback');
  const scope = encodeURIComponent('user:email');
  const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;

  console.log('[github/login] redirecting to GitHub authorize:', url);
  res.redirect(url);
});

// Callback endpoint GitHub -> backend
router.get('/auth/github/callback', async (req, res) => {
  console.log('[github/callback] Received callback, query:', req.query);
  const code = req.query.code;
  if (!code || typeof code !== 'string') {
    console.warn('[github/callback] Missing code in query');
    return res.status(400).send('Missing code');
  }

  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('[github/callback] Missing GitHub client credentials in env at request time');
    return res.status(500).send('Server misconfigured (missing GitHub credentials)');
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      }),
    });

    const tokenJson = await tokenRes.json();
    if (tokenJson.error) {
      console.error('[github/callback] Token exchange error:', tokenJson);
      return res.status(500).send('Failed to exchange code for token');
    }

    const accessToken = tokenJson.access_token;
    console.log('[github/callback] Received access token (masked):', accessToken ? `${accessToken.slice(0,8)}...` : null);

    // Optional: fetch basic user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}`, 'User-Agent': 'miya-bhai-app' },
    });
    const user = await userRes.json();
    console.log('[github/callback] GitHub user fetched:', user && user.login ? user.login : user);

    // For dev: set a simple cookie containing the access token (httpOnly)
    res.cookie(COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX,
      path: '/',
    });
    console.log(`[github/callback] Set cookie ${COOKIE_NAME} attrs: httpOnly=true, secure=${process.env.NODE_ENV === 'production'}, sameSite=lax, maxAge=${COOKIE_MAX}`);

    // Redirect back to frontend
    console.log('[github/callback] Redirecting to frontend:', FRONTEND_URL);
    return res.redirect(FRONTEND_URL);
  } catch (err) {
    console.error('[github/callback] Unexpected error:', err);
    return res.status(500).send('Internal error');
  }
});

export default router;
