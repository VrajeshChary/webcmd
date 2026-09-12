---
name: lifeos-apply
description: Adaptive browser agent for job applications, form completion, UI drift recovery, and self-learning resilience.
allowed-tools: Bash(webcmd:*), Read, Write, Edit
---

# lifeos-apply — Apply Anywhere Agent

The `lifeos-apply` agent provides autonomous, adaptive browser workflows for job applications across ATS portals (Greenhouse, Lever, Ashby, Workday, SmartRecruiters) and custom career sites.

## Capabilities

1. **Natural Language Goals**: Specify goals like `"Apply for Senior Frontend Engineer on Greenhouse with my resume"` or pass a direct career portal URL.
2. **Autonomous Form Mapping**: Intelligently binds candidate profile attributes (contact, experience, education, portfolio links, custom Q&A answers) to diverse form elements.
3. **UI Change Detection**: Identifies dynamic layout shifts, multi-step stepper changes, modal overlays, and validation error banners.
4. **Adaptive Failure Recovery**: Diagnoses failure causes (e.g. `MODAL_BLOCKER`, `SELECTOR_DRIFT`, `HIDDEN_FILE_INPUT`, `FORM_VALIDATION_ERROR`) and synthesizes targeted recovery actions.
5. **Self-Learning Memory**: Saves proven recovery tactics into Webcmd's native `site-memory` candidate store so subsequent applications to the same domain avoid repeating failures.
6. **Auditable Action Logs**: Maintains detailed timeline reports in `~/.webcmd/lifeos/logs/`.

---

## Quick Start

### 1. View or Initialize Applicant Profile

```bash
# View active applicant profile
webcmd lifeos profile show

# Scaffold a fresh profile
webcmd lifeos profile init
```

The profile is stored in `~/.webcmd/lifeos/profile.json`. You can customize contact information, resume location, education, skills, and screening question answers.

### 2. Apply with Natural Language Goal

```bash
# Dry run to preview field mapping without submitting
webcmd lifeos apply "Apply for Fullstack Developer on https://boards.greenhouse.io/example/jobs/123" --dry-run

# Auto-submit once verified
webcmd lifeos apply --url https://jobs.lever.co/company/abc --auto-submit
```

### 3. Review Learned Strategies & Action Logs

```bash
# Inspect strategies learned from previous UI recovery events
webcmd lifeos strategies list

# View execution audit logs
webcmd lifeos logs list
webcmd lifeos logs show <runId>
```

### 4. AI Reasoning Engine (OpenRouter & NVIDIA Nemotron)

```bash
# Check active model and OpenRouter connectivity
webcmd lifeos llm status

# Probe live model latency and response
webcmd lifeos llm test
```

