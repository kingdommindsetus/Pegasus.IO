-- 008_memory_partitions.sql
-- Explicit trusted-memory partitions and retrieval indexes.

ALTER TABLE pegasus_core.memories
  ADD COLUMN IF NOT EXISTS memory_kind text NOT NULL DEFAULT 'episodic';

ALTER TABLE pegasus_core.memories
  ADD COLUMN IF NOT EXISTS importance numeric(4,3) NOT NULL DEFAULT 0.500;

ALTER TABLE pegasus_core.memories
  ADD COLUMN IF NOT EXISTS superseded_by uuid REFERENCES pegasus_core.memories(id);

ALTER TABLE pegasus_core.memories
  ADD COLUMN IF NOT EXISTS memory_partition text;

UPDATE pegasus_core.memories
SET memory_partition = CASE
  WHEN scope='company' THEN 'company_memory'
  WHEN scope='agent' THEN 'agent_role_memory'
  ELSE 'mission_run_memory'
END
WHERE memory_partition IS NULL;

ALTER TABLE pegasus_core.memories
  ALTER COLUMN memory_partition SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='memories_partition_check'
  ) THEN
    ALTER TABLE pegasus_core.memories
      ADD CONSTRAINT memories_partition_check
      CHECK (memory_partition IN ('company_memory','agent_role_memory','mission_run_memory'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_memories_partition_created
  ON pegasus_core.memories(memory_partition, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_agent_partition
  ON pegasus_core.memories(agent_id, memory_partition, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_project_partition
  ON pegasus_core.memories(project_id, memory_partition, created_at DESC);
