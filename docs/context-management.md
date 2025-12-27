---
title: Context Management
description: Compact, merge, and transfer conversation context between sessions and agents.
icon: layers
---

## Tab Menu

Right-click any tab to access the full range of context management options:

![Tab Menu](./screenshots/tab-menu.png)

| Action | Description |
|--------|-------------|
| **Copy Session ID** | Copy the Claude Code session ID to clipboard |
| **Star Session** | Bookmark this session for quick access |
| **Rename Tab** | Give the tab a descriptive name |
| **Mark as Unread** | Add unread indicator to the tab |
| **Context: Copy to Clipboard** | Copy the full conversation to clipboard |
| **Context: Compact** | Compress context while preserving key information |
| **Context: Merge Into** | Merge this context into another session |
| **Context: Send to Agent** | Transfer context to a different agent |

## Tab Export

Export any tab conversation as a self-contained HTML file:

1. Right-click the tab → **Context: Copy to Clipboard**
2. Or use **Command Palette** (`Cmd+K`) → "Export tab to HTML"

The exported HTML file includes:
- **Full conversation history** with all messages
- **Your current theme colors** — the export adopts your active Maestro theme
- **Maestro branding** with links to the website and GitHub
- **Session metadata** — agent type, working directory, timestamps, token usage
- **Rendered markdown** — code blocks, tables, and formatting preserved

This is useful for sharing conversations, creating documentation, or archiving important sessions.

---

Context management lets you combine or transfer conversation history between sessions and agents, enabling powerful workflows where you can:

- **Compact & continue** — Compress your context to stay within token limits while preserving key information
- **Merge sessions** — Combine context from multiple conversations into one
- **Transfer to other agents** — Send your context to a different AI agent (e.g., Claude Code → Codex)

## Compact & Continue

When your conversation approaches context limits, you can compress it while preserving essential information:

1. **Right-click** a tab → **"Context: Compact"**, or use **Command Palette** (`Cmd+K` / `Ctrl+K`) → "Context: Compact"
2. The AI compacts the conversation, extracting key decisions, code changes, and context
3. A new tab opens with the compressed context, ready to continue working

**When to use:**
- The context warning sash appears (yellow at 60%, red at 80% usage)
- You want to continue a long conversation without losing important context
- You need to free up context space for new tasks

**What gets preserved:**
- Key decisions and their rationale
- Code changes and file modifications
- Important technical details and constraints
- Current task state and next steps

## Merging Sessions

Combine context from multiple sessions or tabs into one:

1. **Right-click** a tab → **"Context: Merge Into"**, or use **Command Palette** (`Cmd+K` / `Ctrl+K`) → "Merge with another session"
2. Search for or select the target session/tab from the modal
3. Review the merge preview showing estimated token count
4. Optionally enable **Clean context** to remove duplicates and reduce size
5. Click **"Merge Into"**

![Merge Modal](./screenshots/tab-merge.png)

The modal shows:
- **Paste ID** tab — Enter a specific session ID directly
- **Open Tabs** tab — Browse all open tabs across all agents
- **Token estimate** — Shows source size and estimated size after cleaning
- **Agent grouping** — Tabs organized by agent with tab counts

The merged context creates a new tab in the target session with conversation history from both sources. Use this to consolidate related conversations or bring context from an older session into a current one.

**What gets merged:**
- Full conversation history (user messages and AI responses)
- Token estimates are shown before merge to help you stay within context limits

**Tips:**
- You can merge tabs within the same session or across different sessions
- Large merges (100k+ tokens) will show a warning but still proceed
- Self-merge (same tab to itself) is prevented
- Enable "Clean context" for large merges to reduce token count

## Sending to Another Agent

Transfer your context to a different AI agent:

1. **Right-click** a tab → **"Context: Send to Agent"**, or use **Command Palette** (`Cmd+K` / `Ctrl+K`) → "Send to another agent"
2. Search for or select the target agent from the list
3. Review the token estimate and cleaning options
4. Click **"Send to Session"**

![Send to Agent Modal](./screenshots/tab-send.png)

The modal shows:
- **Searchable agent list** with status indicators (Idle, Busy, etc.)
- **Agent paths** to distinguish between agents with similar names
- **Token estimate** — Shows source size and estimated size after cleaning
- **Clean context option** — Remove duplicates and reduce size before transfer

**Context Cleaning:**
When transferring between agents, the context can be automatically cleaned to:
- Remove duplicate messages and verbose output
- Condense while preserving key information
- Optimize token usage for the target session

Cleaning is enabled by default but can be disabled for verbatim transfers.

**Use Cases:**
- Start a task in Claude Code, then hand off to Codex for a different perspective
- Transfer a debugging session to an agent with different tool access
- Move context to an agent pointing at a different project directory
- Share context with a worktree sub-agent working on the same codebase
