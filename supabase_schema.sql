-- ==========================================================
-- KALSS DONATE PLATFORM - SUPABASE SQL SCHEMA
-- Jalankan SQL ini di Supabase SQL Editor
-- ==========================================================

CREATE TABLE IF NOT EXISTS kalss_keys (
  key TEXT PRIMARY KEY,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  roblox_user_id TEXT,
  roblox_username TEXT,
  avatar_url TEXT,
  universe_id TEXT,
  place_id TEXT,
  place_name TEXT,
  creator_type TEXT,
  creator_id TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount BIGINT NOT NULL DEFAULT 0,
  donation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kalss_donations (
  id TEXT PRIMARY KEY,
  api_key TEXT NOT NULL,
  amount BIGINT NOT NULL,
  donor_name TEXT NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  target_name TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'real',
  status TEXT NOT NULL DEFAULT 'pending',
  lease_token TEXT,
  claimed_at BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS kalss_game_state (
  api_key TEXT PRIMARY KEY,
  synced_config JSONB,
  synced_donors JSONB NOT NULL DEFAULT '[]'::jsonb,
  pending_donor_sync JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kalss_keys_user ON kalss_keys (roblox_user_id);
CREATE INDEX IF NOT EXISTS idx_kalss_keys_universe ON kalss_keys (universe_id);
CREATE INDEX IF NOT EXISTS idx_kalss_donations_key_status ON kalss_donations (api_key, status, created_at DESC);

ALTER TABLE kalss_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE kalss_donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE kalss_game_state DISABLE ROW LEVEL SECURITY;
