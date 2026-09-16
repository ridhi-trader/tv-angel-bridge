const router = require('express').Router();
const pool = require('../models/db');
const { placeOrder } = require('../services/angelone');

/*
  TradingView Alert Message (JSON):
  {
    "token": "YOUR_WEBHOOK_TOKEN",
    "symbol": "NIFTY-EQ",
    "action": "BUY",
    "qty": 50,
    "order_type": "MARKET",
    "exchange": "NSE",
    "product": "INTRADAY",
    "price": 0,
    "symbol_token": "99926000"   (optional — Angel requires this)
  }
*/

router.post('/:webhookToken', async (req, res) => {
  const { webhookToken } = req.params;
  const payload = req.body;

  // Find user by webhook token
  const userResult = await pool.query('SELECT id, plan FROM users WHERE webhook_token = $1', [webhookToken]);
  if (!userResult.rows.length) return res.status(404).json({ error: 'Invalid webhook token' });
  const user = userResult.rows[0];

  // Get broker config
  const brokerResult = await pool.query(
    'SELECT * FROM broker_configs WHERE user_id = $1 AND active = true LIMIT 1',
    [user.id]
  );

  // Paper trade mode if no broker configured or plan = free
  const isPaper = !brokerResult.rows.length || user.plan === 'free';

  let status = 'success';
  let brokerOrderId = null;
  let errorMsg = null;

  if (!isPaper) {
    const cfg = brokerResult.rows[0];
    try {
      const result = await placeOrder(
        { apiKey: cfg.api_key, clientId: cfg.client_id, password: cfg.password, totpSecret: cfg.totp_secret },
        {
          symbol: payload.symbol,
          action: payload.action,
          qty: payload.qty,
          order_type: payload.order_type || 'MARKET',
          exchange: payload.exchange || 'NSE',
          product: payload.product || 'INTRADAY',
          price: payload.price || 0,
          token: payload.symbol_token || ''
        }
      );
      brokerOrderId = result?.orderid;
    } catch (e) {
      status = 'failed';
      errorMsg = e.message;
    }
  } else {
    status = 'paper';
  }

  // Log trade
  await pool.query(
    `INSERT INTO trade_logs (user_id, broker, symbol, action, qty, order_type, price, status, broker_order_id, error, raw_payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      user.id,
      isPaper ? 'paper' : 'angel',
      payload.symbol,
      payload.action,
      payload.qty,
      payload.order_type || 'MARKET',
      payload.price || 0,
      status,
      brokerOrderId,
      errorMsg,
      payload
    ]
  );

  res.json({ status, order_id: brokerOrderId, paper: isPaper, error: errorMsg });
});

module.exports = router;
