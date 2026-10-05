-- Pegasus Core v2 namespace isolation.
-- Existing public tables remain untouched.
CREATE SCHEMA IF NOT EXISTS pegasus_core;
SET search_path TO pegasus_core, public;
