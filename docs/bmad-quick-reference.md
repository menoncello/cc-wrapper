# BMad Method v6 - Quick Reference: Level 3-4

Essential command sequences for Level 3-4 projects (12+ stories, 2+ epics).

---

## Command Format

```bash
/bmad:module:agents:name     # Load agent (once per session)
*workflow-name               # Execute workflow
```

**Tip**: Agent stays loaded until you switch to another agent.

---

## Level 3-4: Complete Flow

### Project Initialization (Once)

```bash
# PHASE 1: ANALYSIS
/bmad:bmm:agents:analyst
*workflow-status             # Check status and plan approach
*brainstorm-project          # Ideation with multiple methodologies
*research                    # Comprehensive market/technical research
*product-brief               # Strategic planning document

# PHASE 2: PLANNING
/bmad:bmm:agents:pm
*prd                         # Creates PRD.md + epics.md + bmm-workflow-status.md

/bmad:bmm:agents:ux-expert
*ux-spec                     # UI/UX specification (optional)

# PHASE 3: ARCHITECTURE (Once)
/bmad:bmm:agents:architect
*solution-architecture       # Complete system architecture with ADRs

/bmad:bmm:agents:sm
*assess-project-ready        # Validate ready for Phase 4
```

---

## Epic Loop (JIT - Repeat for Each Epic)

### Epic N: Solutioning (JIT)

```bash
/bmad:bmm:agents:architect
*tech-spec                   # Epic-specific technical specification

/bmad:bmm:agents:tea
*test-design                 # Epic-specific test strategy (risk assessment, P0-P3)
```

### Epic N: Story Loop (Repeat for Each Story)

```bash
# 1. Story Creation
/bmad:bmm:agents:sm
*create-story                # Draft story from BACKLOG
# [User reviews]
*story-ready                 # Approve story (TODO → IN PROGRESS)
*story-context               # Generate context XML (recommended)

# 2. Testing (ATDD - recommended for P0/P1)
/bmad:bmm:agents:tea
*atdd                        # Generate E2E tests FIRST (red phase)

# 3. Implementation
/bmad:bmm:agents:dev
*develop                     # Implement story (make tests pass)

# 4. Quality Checks
/bmad:bmm:agents:tea
*test-review                 # Review test quality

# 5. Quality Gate (P0/P1 stories)
*trace                       # Traceability + gate decision
*nfr-assess                  # NFR validation

# 6. If have some issue, back to 3 (Implementation)

# 7. Finish
/bmad:bmm:agents:dev
*review                      # Code review

# If have some issue, back to 3 (Implementation)

# [User verifies DoD]
*story-approved              # Mark done (IN PROGRESS → DONE)
```

### Epic N: Epic-Level Validation

```bash
# After all stories in epic complete
/bmad:bmm:agents:tea
*trace                       # Epic-level traceability
*nfr-assess                  # Epic-level NFR assessment

/bmad:bmm:agents:architect
*validate-tech-spec          # Validate tech-spec was followed

/bmad:bmm:agents:sm
*retrospective               # Epic learnings
```

**Repeat epic loop for all remaining epics**

---

## Project-Level Validation (Before Release)

```bash
# After all epics complete
/bmad:bmm:agents:tea
*trace                       # Project-level traceability
*nfr-assess                  # Final NFR assessment

/bmad:bmm:agents:architect
*validate-architecture       # Architecture integrity

/bmad:bmm:agents:pm
*validate                    # PRD completion

/bmad:bmm:agents:sm
*retrospective               # Project-level lessons learned
```

---

## Optional: Initial Setup (Once per Project)

```bash
# Test framework setup
/bmad:bmm:agents:tea
*framework                   # Initialize test framework (Playwright/Cypress)
*ci                          # Scaffold CI/CD pipeline

# Brownfield projects
/bmad:bmm:agents:analyst
*document-project            # Generate documentation of existing codebase
```

---

## Extra Commands

### Universal (All Agents)

```bash
*workflow-status             # Check status and get recommendations
*help                        # Show agent menu
*exit                        # Exit agent
```

### BMad Master

```bash
/bmad:core:agents:bmad-master
*list-tasks                  # List all available tasks
*list-workflows              # List all available workflows
*party-mode                  # Group chat with all agents
```

### Course Correction (Any Phase)

```bash
/bmad:bmm:agents:sm
*correct-course              # Handle scope changes, blockers

/bmad:bmm:agents:pm
*correct-course              # PM perspective on changes

/bmad:bmm:agents:architect
*correct-course              # Technical perspective on changes
```

### Validation Commands

```bash
# Validate Architecture
/bmad:bmm:agents:architect
*validate-architecture       # Validate solution-architecture.md
*validate-tech-spec          # Validate tech-spec.md

# Validate Planning
/bmad:bmm:agents:pm
*validate                    # Validate any document against checklist

# Validate Story Context
/bmad:bmm:agents:sm
*validate-story-context      # Validate story context XML
```

### Alternative TEA Workflows

```bash
/bmad:bmm:agents:tea
*automate                    # Comprehensive test automation (alternative to atdd)
```

### Alternative Command Names

```bash
# Same workflow, different trigger names:
*develop         = *dev-story
*review          = *review-story
*retrospective   = *retro
*solution-architecture = *solutioning
```

---

## Game Development (Level 3-4)

```bash
# PHASE 1
/bmad:bmm:agents:game-designer
*brainstorm-game             # Game ideation
*game-brief                  # Game design foundation

# PHASE 2
/bmad:bmm:agents:game-designer
*gdd                         # Game Design Document
*narrative                   # Narrative design (optional)

# Then follow same epic loop as above
```

---

## Quick Agent Reference

### Core

- `/bmad:core:agents:bmad-master` - Universal orchestrator

### BMM (Software Development)

- `/bmad:bmm:agents:analyst` - Analysis & research
- `/bmad:bmm:agents:pm` - Planning & PRD
- `/bmad:bmm:agents:architect` - Architecture & design
- `/bmad:bmm:agents:ux-expert` - UX/UI design
- `/bmad:bmm:agents:sm` - Story management
- `/bmad:bmm:agents:dev` - Implementation
- `/bmad:bmm:agents:tea` - Test architecture & quality

### BMM (Game Development)

- `/bmad:bmm:agents:game-designer` - Game design & GDD

### BMB (Meta)

- `/bmad:bmb:agents:bmad-builder` - Build BMad components

---

## Tips for Efficiency

### 1. Stay in Agent Session

```bash
/bmad:bmm:agents:sm          # Load once
*create-story
*story-ready
*story-context               # All in same session
```

### 2. Follow State Machine

Trust `bmm-workflow-status.md`:

- BACKLOG → TODO → IN PROGRESS → DONE
- Agents read from it automatically

### 3. JIT Principle

- Create tech-spec when epic starts (not all upfront)
- Create test-design when epic starts
- Create stories one at a time

### 4. Quality Gates

- **Story-level**: P0/P1 stories
- **Epic-level**: After all stories
- **Project-level**: Before release

### 5. ATDD for Critical Paths

```bash
/bmad:bmm:agents:tea
*atdd                        # Tests first (red phase)

/bmad:bmm:agents:dev
*develop                     # Make tests pass (green phase)
```

---

## Typical Timeline (Level 3-4)

- **Week 1**: Analysis (3 days)
- **Week 1**: Planning (2 days)
- **Week 2**: Architecture (3 days)
- **Week 2-5**: Epic 1 (3 weeks)
- **Week 6+**: Epic 2+...

**Per Story**: 1-3 days (depending on complexity)

---

## Related Documentation

- [Complete Workflow Commands](./complete-workflow-commands.md) - All levels detailed
- [Agent Commands Reference](./agents-commands-reference.md) - All agent commands
- [Agent Workflow Mapping](./agents-workflow-mapping.mermaid.md) - Visual mapping
- [Complete Workflow Overview](./complete-workflow-overview.mermaid.md) - 4-phase diagram
