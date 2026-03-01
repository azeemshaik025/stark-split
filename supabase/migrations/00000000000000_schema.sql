-- StarkSplit: Full Schema (single migration)
-- supabase db reset applies this. Canonical source: supabase/schema.sql

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups (type: 'split' = Splitwise-style, 'pool' = savings/staking)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '💰',
  created_by UUID REFERENCES users(id),
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  type TEXT NOT NULL DEFAULT 'split' CHECK (type IN ('split', 'pool')),
  total_staked NUMERIC DEFAULT 0,
  total_yield_earned NUMERIC DEFAULT 0,
  pool_liquid NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  paid_by UUID REFERENCES users(id),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'STRK',
  split_type TEXT DEFAULT 'equal',
  split_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settlements (on-chain transfers)
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id),
  from_user UUID REFERENCES users(id),
  to_user UUID REFERENCES users(id),
  amount NUMERIC NOT NULL,
  tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  from_treasury BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staking positions (per-user within a group)
CREATE TABLE staking_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id),
  user_id UUID NOT NULL REFERENCES users(id),
  validator_address TEXT,
  amount_staked NUMERIC NOT NULL,
  rewards_earned NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  exit_intent_at TIMESTAMPTZ,
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pool contributions (group treasury)
CREATE TABLE pool_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faucet rate limiting (one request per address per 24 hours)
CREATE TABLE faucet_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  last_requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_group ON expenses(group_id);
CREATE INDEX idx_settlements_group ON settlements(group_id);
CREATE INDEX idx_staking_group ON staking_positions(group_id);
CREATE UNIQUE INDEX idx_staking_positions_group_user ON staking_positions(group_id, user_id);
CREATE INDEX idx_staking_positions_user ON staking_positions(user_id);
CREATE INDEX idx_groups_type ON groups(type);
CREATE INDEX idx_pool_contributions_group ON pool_contributions(group_id);
CREATE INDEX idx_pool_contributions_user ON pool_contributions(user_id);
CREATE UNIQUE INDEX idx_faucet_requests_address ON faucet_requests(address);

-- RLS (permissive for anon key, no Supabase Auth)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faucet_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "groups_all" ON groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "group_members_all" ON group_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "expenses_all" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "settlements_all" ON settlements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "staking_positions_all" ON staking_positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "pool_contributions_all" ON pool_contributions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "faucet_requests_all" ON faucet_requests FOR ALL USING (true) WITH CHECK (true);
