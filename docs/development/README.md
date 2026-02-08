---
type: note
title: Development Documentation Hub
created: 2025-02-08
tags:
  - development
  - contributing
  - workflow
related:
  - '[[CONTRIBUTING.md]]'
  - '[[CLAUDE.md]]'
  - '[[docs/development/git-workflow.md]]'
  - '[[docs/performance/debugging-guide.md]]'
  - '[[ARCHITECTURE.md]]'
---

# Development Documentation Hub

Welcome to the Maestro development documentation hub. This page provides an organized entry point to all resources for contributing to and developing the Maestro project.

## Core Development Resources

### Getting Started

- **[[CONTRIBUTING.md]]** - Comprehensive guide covering setup, testing, coding standards, and PR process
- **[[CLAUDE.md]]** - Essential guidance for working with the codebase, patterns, and conventions
- **[[ARCHITECTURE.md]]** - Detailed architecture documentation for understanding system design

### Workflow & Processes

- **[[docs/development/git-workflow.md]]** - Git workflow with fork synchronization, branch naming, and PR process
- **[[docs/performance/debugging-guide.md]]** - Performance debugging guide with DevTools workflows and optimization patterns
- **[[docs/performance/baseline-report.md]]** - Performance baseline metrics and profiling results

### Development References

- **[[CLAUDE-PATTERNS.md]]** - Core implementation patterns for process management, settings, modals, themes, Auto Run, and SSH
- **[[CLAUDE-IPC.md]]** - IPC API surface for main-renderer communication
- **[[CLAUDE-PERFORMANCE.md]]** - Performance best practices for React optimization and efficiency
- **[[CLAUDE-WIZARD.md]]** - Onboarding Wizard, Inline Wizard, and Tour System implementation
- **[[CLAUDE-FEATURES.md]]** - Usage Dashboard and Document Graph feature documentation
- **[[CLAUDE-AGENTS.md]]** - Supported agents and their capabilities
- **[[CLAUDE-SESSION.md]]** - Session interface and code conventions

### Agent Integration

- **[[AGENT_SUPPORT.md]]** - Detailed guide for integrating new AI agents into Maestro

## Quick Reference

### Development Commands

```bash
# Development with hot reload (isolated data)
npm run dev

# Development using production data
npm run dev:prod-data

# Web interface development
npm run dev:web

# Type checking
npm run lint

# ESLint code quality checks
npm run lint:eslint

# Run tests
npm run test

# Watch mode for tests
npm run test:watch
```

### Key Directories

- `src/main/` - Electron main process (Node.js)
- `src/renderer/` - React frontend (desktop)
- `src/web/` - Web/mobile interface
- `src/cli/` - CLI tooling for batch automation
- `src/prompts/` - System prompts (editable .md files)
- `src/shared/` - Shared types and utilities
- `docs/` - Mintlify documentation

### Performance Goals

Maestro prioritizes:

- **Snappy interface** - UI interactions should feel instant
- **Battery efficiency** - Minimize unnecessary timers, polling, and re-renders
- **Memory efficiency** - Clean up event listeners, timers, and subscriptions properly

## Development Workflow Overview

1. **Setup** - Fork the repository, clone locally, and run development setup
2. **Branch** - Create a feature branch following naming conventions
3. **Develop** - Make changes following the project's patterns and guidelines
4. **Test** - Run tests, linting, and verify changes work as expected
5. **Document** - Update relevant documentation if needed
6. **Commit** - Use descriptive commit messages following project conventions
7. **PR** - Create a pull request from your fork to upstream following the documented process

See **[[docs/development/git-workflow.md]]** for detailed git workflow instructions.

## Contributing Guidelines

- Follow the existing code style and architecture patterns
- Ensure all tests pass before committing
- Add tests for new features
- Update documentation when adding or modifying features
- Consider performance implications of all changes
- Use keyboard-first design principles for UI changes
- Ensure SSH remote execution support for agent-spawning features

See **[[CONTRIBUTING.md]]** for complete contributing guidelines.

## Support & Resources

- **Discord**: [Join the community](https://runmaestro.ai/discord)
- **Documentation**: [docs.runmaestro.ai](https://docs.runmaestro.ai)
- **GitHub Issues**: [Report bugs & request features](https://github.com/pedramamini/Maestro/issues)

---

**Last Updated**: 2025-02-08
