---
title: Spec-Kit Commands
description: Structured specification workflow for AI-assisted development using GitHub's spec-kit methodology.
icon: file-text
---

Spec-Kit is a structured specification workflow from [GitHub's spec-kit project](https://github.com/github/spec-kit) that helps teams create clear, actionable specifications before implementation. Maestro bundles these commands and keeps them updated automatically.

![Spec-Kit Commands in Settings](./screenshots/speckit-commands.png)

## Spec-Kit vs. Wizard

Maestro offers two paths to structured development:

| Feature | Spec-Kit | Onboarding Wizard |
|---------|----------|-------------------|
| **Approach** | Manual, command-driven workflow | Guided, conversational flow |
| **Best For** | Experienced users, complex projects | New users, quick setup |
| **Output** | Constitution, specs, tasks → Auto Run docs | Phase 1 Auto Run document |
| **Control** | Full control at each step | Streamlined, opinionated |
| **Learning Curve** | Moderate | Low |

**Use Spec-Kit when:**
- You want fine-grained control over specification phases
- You're working on complex features requiring detailed planning
- You prefer explicit command-driven workflows
- You want to create reusable constitutions and specifications

**Use the Wizard when:**
- You're starting a new project from scratch
- You want to get up and running quickly
- You prefer conversational, guided experiences

Both approaches ultimately produce markdown documents for Auto Run execution.

## Viewing & Managing Commands

Access Spec-Kit commands via **Settings → AI Commands** tab. Here you can:

- **View all commands** with descriptions
- **Check for Updates** to pull the latest prompts from GitHub
- **Expand commands** to see their full prompts
- **Customize prompts** (modifications are preserved across updates)

## Core Workflow (Recommended Order)

### 1. `/speckit.constitution` — Define Project Principles

Start here to establish your project's foundational values, constraints, and guidelines. The constitution guides all subsequent specifications and ensures consistency across features.

**Creates:** A constitution document with core principles, technical constraints, and team conventions.

### 2. `/speckit.specify` — Create Feature Specification

Define the feature you want to build with clear requirements, acceptance criteria, and boundaries.

**Creates:** A detailed feature specification with scope, requirements, and success criteria.

### 3. `/speckit.clarify` — Identify Gaps

Review your specification for ambiguities, missing details, and edge cases. The AI asks clarifying questions to strengthen the spec before implementation.

**Tip:** Run `/speckit.clarify` multiple times — each pass catches different gaps.

### 4. `/speckit.plan` — Implementation Planning

Convert your specification into a high-level implementation plan with phases and milestones.

**Creates:** A phased implementation roadmap with dependencies and risk areas.

### 5. `/speckit.tasks` — Generate Tasks

Break your plan into specific, actionable tasks with dependencies clearly mapped.

**Creates:** A dependency-ordered task list ready for execution.

### 6. `/speckit.implement` — Execute with Auto Run

**Maestro-specific command.** Converts your tasks into Auto Run documents that Maestro can execute autonomously. This bridges spec-kit's structured approach with Maestro's multi-agent capabilities.

**Creates:** Markdown documents in `Auto Run Docs/` with task checklists.

## Analysis & Quality Commands

### `/speckit.analyze` — Cross-Artifact Analysis

Verify consistency across your constitution, specifications, and tasks. Catches contradictions and gaps between documents.

### `/speckit.checklist` — Generate QA Checklist

Create a custom checklist for your feature based on the specification. Useful for QA, code review, and acceptance testing.

### `/speckit.taskstoissues` — Export to GitHub Issues

Convert your tasks directly into GitHub Issues. Requires `gh` CLI to be installed and authenticated.

## Getting Help

Run `/speckit.help` to get an overview of the workflow and tips for best results.

## Auto-Updates

Spec-Kit prompts are automatically synced from the [GitHub spec-kit repository](https://github.com/github/spec-kit):

1. Open **Settings → AI Commands**
2. Click **Check for Updates**
3. New commands and prompt improvements are downloaded
4. Your custom modifications are preserved

The version number and last update date are shown at the top of the Spec Kit Commands section.

## Tips for Best Results

- **Start with constitution** — Even for small projects, defining principles helps maintain consistency
- **Iterate on specifications** — Use `/speckit.clarify` multiple times to refine your spec
- **Keep specs focused** — One feature per specification cycle works best
- **Review before implementing** — Use `/speckit.analyze` to catch issues early
- **Leverage parallelism** — With Maestro, run multiple spec-kit workflows simultaneously across different agents
