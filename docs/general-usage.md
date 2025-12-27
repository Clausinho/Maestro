---
title: General Usage
description: Learn the Maestro UI layout, agent status indicators, file explorer, and output filtering.
icon: layout-dashboard
---

## UI Overview

Maestro features a three-panel layout:

- **Left Panel** - Agent list with grouping, filtering, search, bookmarks, and drag-and-drop organization
- **Main Panel** - Center workspace with two modes per agent:
  - **AI Terminal** - Converse with your AI provider (Claude Code, Codex, or OpenCode). Supports multiple tabs (each tab is a session), `@` file mentions, image attachments, slash commands, and draft auto-save.
  - **Command Terminal** - PTY shell with tab completion for files, branches, tags, and command history.
  - **Views**: Session Explorer, File Preview, Git Diffs, Git Logs
- **Right Panel** - Three tabs: File Explorer, History Viewer, and Auto Run

![Main screen](./screenshots/main-screen.png)

## Agent Status Indicators

Each agent shows a color-coded status indicator:

- 🟢 **Green** - Ready and waiting
- 🟡 **Yellow** - Agent is thinking
- 🔴 **Red** - No connection with agent
- 🟠 **Pulsing Orange** - Attempting to establish connection
- 🔴 **Red Badge** - Unread messages (small red dot overlapping top-right of status indicator, iPhone-style)

## File Explorer and Preview

Browse project files with syntax highlighting, markdown preview, and image viewing. Reference files in prompts with `@` mentions.

![File viewer](./screenshots/file-viewer.png)

## Prompt Composer

For complex prompts that need more editing space, use the **Prompt Composer** — a fullscreen editing modal.

**To open the Prompt Composer:**
- Click the **pencil icon** (✏️) in the bottom-left corner of the AI input box

![Prompt Composer Button](./screenshots/prompt-composer-button.png)

The Prompt Composer provides:
- **Full-screen editing space** for complex, multi-paragraph prompts
- **Character and token count** displayed in the footer
- **All input controls** — History toggle, Read-only mode, Thinking toggle, and send shortcut indicator
- **Image attachment support** via the image icon in the footer

![Prompt Composer](./screenshots/prompt-composer.png)

When you're done editing, click **Send** or press the displayed shortcut to send your message. The composer closes automatically and your prompt is sent to the AI.

## Output Filtering

Search and filter AI output with include/exclude modes, regex support, and per-response local filters.

## Command Interpreter

The command interpreter can be focused for a clean, terminal-only experience when you collapse the left panel.

![Command interpreter](./screenshots/command-interpreter.png)

## Session Management

Browse, star, rename, and resume past sessions. The Session Explorer (`Cmd+Shift+L`) shows all conversations for an agent with search, filtering, and quick actions.

![Session tracking](./screenshots/session-tracking.png)
