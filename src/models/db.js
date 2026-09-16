const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      plan TEXT DEFAULT 'free',
      webhook_token UUID UNIQUE DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS broker_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      broker TEXT NOT NULL DEFAULT 'angel',
      api_key TEXT NOT NULL,
      client_id TEXT NOT NULL,
      password TEXT NOT NULL,
      totp_secret TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS trade_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      broker TEXT,
      symbol TEXT,
      action TEXT,
      qty INTEGER,
      order_type TEXT,
      price NUMERIC,
      status TEXT,
      broker_order_id TEXT,
      error TEXT,
      raw_payload JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('DB tables ready');
};

initDB().catch(console.error);

module.exports = pool;
