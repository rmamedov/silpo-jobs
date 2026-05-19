const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// POST /admin/api/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (username !== process.env.ADMIN_USER) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, process.env.ADMIN_PASS_HASH);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.user = { username };
    res.json({ ok: true, username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/api/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// GET /admin/api/me
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json(req.session.user);
  }
  res.status(401).json({ error: 'Not authenticated' });
});

module.exports = router;
