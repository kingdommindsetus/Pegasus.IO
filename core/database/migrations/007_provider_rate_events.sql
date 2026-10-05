-- 007_provider_rate_events.sql
-- Shared provider quota ledger for server-side free-tier throttling.

CREATE TABLE IF NOT EXISTS pegasus_core.provider_rate_events (
  provider text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_rate_events_provider_time_idx
  ON pegasus_core.provider_rate_events(provider, occurred_at);

CREATE INDEX IF NOT EXISTS provider_rate_events_occurred_at_idx
  ON pegasus_core.provider_rate_events(occurred_at);
