---
title: Overview
---

Maestro hones fractured attention into focused intent. It is built for developers who need to coordinate multiple AI agents, repositories, and long-running tasks without leaving a keyboard-first workflow.

## Spec-Driven Workflow

Maestro enables a **specification-first approach** to AI-assisted development. Instead of ad-hoc prompting, you collaboratively build detailed specs with the AI, then execute them systematically:

1. PLAN
Discuss the feature with the AI agent.
2. SPECIFY
Create markdown docs with task checklists in the Auto Run folder.
3. EXECUTE
Auto Run executes tasks in a fresh session per task.
4. REFINE
Review results, update specs, and repeat.

**Why this works:**
- **Deliberate planning** — Conversation forces you to think through requirements before coding
- **Documented specs** — Your markdown files become living documentation
- **Clean execution** — Each task runs in isolation with no context bleed
- **Iterative refinement** — Review, adjust specs, re-run — specs evolve with your understanding

**Example workflow:**

1. **Plan**: In the AI Terminal, discuss your feature: *"I want to add user authentication with OAuth support"*
2. **Specify**: Ask the AI to help create a spec: *"Create a markdown checklist for implementing this feature"*
3. **Save**: Copy the spec to your Auto Run folder (or have the AI write it directly)
4. **Execute**: Switch to Auto Run tab, select the doc, click Run — Maestro handles the rest
5. **Review**: Check the History tab for results, refine specs as needed

This approach mirrors methodologies like [Spec-Kit](https://github.com/github/spec-kit), but with a graphical interface, real-time AI collaboration, and multi-agent parallelism.

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Agent** | A workspace tied to a project directory and AI provider (Claude Code, Codex, or OpenCode). Contains one Command Terminal and one AI Terminal with full conversation history. |
| **Group** | Organizational container for agents. Group by project, client, or workflow. |
| **Group Chat** | Multi-agent conversation coordinated by a moderator. Ask questions across multiple agents and get synthesized answers. |
| **Git Worktree** | An isolated working directory linked to a separate branch. Worktree sub-agents appear nested under their parent in the session list and can create PRs. |
| **AI Terminal** | The conversation interface with your AI agent. Supports `@` file mentions, slash commands, and image attachments. |
| **Command Terminal** | A PTY shell session for running commands directly. Tab completion for files, git branches, and command history. |
| **Session Explorer** | Browse all past conversations for an agent. Star, rename, search, and resume any previous session. |
| **Auto Run** | Automated task runner that processes markdown checklists. Spawns fresh AI sessions per task. |
| **Playbook** | A saved Auto Run configuration with document order, options, and settings for repeatable batch workflows. |
| **History** | Timestamped log of all actions (user commands, AI responses, Auto Run completions) with session links. |
| **Remote Control** | Web interface for mobile access. Local network or remote via Cloudflare tunnel. |
| **CLI** | Headless command-line tool for scripting, automation, and CI/CD integration. |
