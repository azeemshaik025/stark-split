-- StarkSplit: Full Database Reset
-- Run in Supabase SQL Editor or: psql $DATABASE_URL -f supabase/scripts/cleanup.sql
-- WARNING: Drops ALL tables and data. Use for local dev only.
--
-- After running cleanup, apply the schema:
--   supabase db reset
--   or: psql $DATABASE_URL -f supabase/schema.sql

DROP TABLE IF EXISTS faucet_requests CASCADE;
DROP TABLE IF EXISTS pool_contributions CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS staking_positions CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;
