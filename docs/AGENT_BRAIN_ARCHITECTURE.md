# Pegasus Agent Brain Architecture v1

Each agent runtime must be assembled from:

CORE COMPANY TRUTH
+ SERVER-RESOLVED ROLE
+ CURRENT MISSION
+ RELEVANT AUTHORIZED MEMORY
+ VERIFIED LIVE SOURCE CONTEXT

## Trust Order
Founder-approved > official document > internal operational record > reputable external source > inference > unverified.

## Runtime Rule
The browser may request an agent by ID, but it must not define the agent's authoritative role, permissions, company facts or tool authority.

## Mission Contract
Recommended fields:
- missionId
- assignedBy
- assignedTo
- objective
- offer
- audience
- knownFacts
- unknowns
- constraints
- requiredOutputs
- approvalRequired

## Result Contract
Recommended fields:
- agent
- missionId
- status
- confidence
- summary
- findings
- actions
- unknowns
- risks
- evidence
- nextAgent
- approvalRequired

## Next Integration Step
Wire api/chat.js through loadAgentBrain() so client-supplied agent names/roles cannot override server definitions. Then connect persistent mission/memory retrieval and, after that, Neon-backed searchable knowledge documents.
