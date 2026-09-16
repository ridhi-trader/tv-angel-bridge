const router = require('express').Router();
const pool = require('../models/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const result = await pool.query(
    'SELECT id, broker, symbol, action, qty, order_type, price, status, broker_order_id, error, created_at FROM trade_logs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',
    [req.user.id]
  );
  res.json(result.rows);
});

module.exports = router;
