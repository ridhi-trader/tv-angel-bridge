const router = require('express').Router();
const pool = require('../models/db');
const auth = require('../middleware/auth');

// Save broker config
router.post('/save', auth, async (req, res) => {
  const { api_key, client_id, password, totp_secret } = req.body;
  if (!api_key || !client_id || !password) return res.status(400).json({ error: 'api_key, client_id, password required' });
  try {
    // Upsert — one config per user for now
    await pool.query(
      `INSERT INTO broker_configs (user_id, broker, api_key, client_id, password, totp_secret)
       VALUES ($1, 'angel', $2, $3, $4, $5)
       ON CONFLICT (user_id, broker) DO UPDATE SET api_key=$2, client_id=$3, password=$4, totp_secret=$5`,
      [req.user.id, api_key, client_id, password, totp_secret || null]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Save failed' });
  }
});

// Get broker config (masked)
router.get('/config', auth, async (req, res) => {
  const result = await pool.query(
    'SELECT id, broker, client_id, active, created_at FROM broker_configs WHERE user_id=$1',
    [req.user.id]
  );
  res.json(result.rows);
});

module.exports = router;
