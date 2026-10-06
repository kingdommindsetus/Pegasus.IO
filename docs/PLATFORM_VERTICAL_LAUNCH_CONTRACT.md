# Pegasus Platform / Vertical Launch Contract

## Canonical model

Pegasus.io is the reusable AI business operating system.

A business deployed on Pegasus is an organization-scoped vertical implementation, not a fork of the platform.

KMCE is the flagship reference deployment used to prove the complete operating model in production before Pegasus is generalized and commercialized for additional businesses.

## Capability ownership

### PEGASUS_CORE

Reusable across industries:

- executive and specialist agent runtime
- orchestration, delegation, handoffs, and task ownership
- second-brain / memory retrieval
- approvals and auditability
- CRM and lead-state primitives
- territory intelligence and geospatial primitives
- Market Atlas infrastructure
- map/search/list/detail/drilldown patterns
- normalized organization/entity records
- analytics, conversion, attribution, revenue, and reporting primitives
- commerce, scheduling, campaign, storefront, and operations primitives
- connector/provider abstraction
- organization/tenant isolation

### VERTICAL_PACK

Industry or organization-specific:

- terminology and branding
- industry data sources
- regulated-domain constraints
- domain qualification logic
- domain entities and extensions
- offer catalog and policies
- domain-specific marketing context

## KMCE reference vertical

KMCE provides the first production vertical pack.

KMCE-specific examples:

- dental / CE terminology
- educator and faculty workflows
- courses, events, enrollments, CE completion, certificates
- CMS/NPPES dental discovery
- dental-office enrichment
- Dental Atlas
- dental campaign qualification
- KMCE brand, offers, operating rules, and verified organization memory

## Market Atlas abstraction

Pegasus Core owns **Market Atlas**.

Market Atlas pipeline:

1. Discover organizations from one or more source adapters.
2. Normalize source data into canonical organization/entity records.
3. Store persistent geospatial coordinates and provenance.
4. Render searchable map/list/detail views.
5. Enrich records through optional adapters.
6. Score / qualify using vertical policy.
7. Promote records into CRM / lead workflows.
8. Assign agent ownership.
9. Measure territory, conversion, and revenue outcomes.

KMCE implements this as **Dental Atlas**.

Other verticals should reuse Market Atlas with different source and qualification adapters rather than fork the feature.

## Launch doctrine

1. **Finish KMCE first.** It is the production proving ground.
2. **Prove every workflow with real records and auditable actions.**
3. **Systemize proven patterns into Pegasus Core.**
4. **Keep KMCE-specific business data and dental assumptions scoped to the KMCE vertical.**
5. **Commercialize Pegasus only from reusable primitives that survived the KMCE proving cycle.**
6. **Every new feature must be labeled PEGASUS_CORE, VERTICAL_PACK, SHARED_ADAPTER, or EXPERIMENTAL before it is generalized.**

## Product positioning

KMCE and Pegasus are complementary products.

- KMCE is a business running on Pegasus.
- Pegasus is the reusable operating platform demonstrated by KMCE.
- KMCE may be marketed and sold independently.
- Pegasus may be marketed and sold as the system powering KMCE and future businesses.
- Neither product should become a duplicate CRM or duplicate source of truth.

## Brain rule

Pegasus agents must understand this platform boundary.

When operating inside KMCE, they may use verified KMCE memory and data.
When operating in public/template mode, they must not assume KMCE facts.
When a KMCE capability is reusable, agents should describe the generic Pegasus capability plus the KMCE adapter rather than treating the dental implementation as the universal platform model.
