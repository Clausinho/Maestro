---
type: guide
title: Git Workflow & Fork Management
created: 2025-02-08
tags:
  - git
  - workflow
  - contributing
  - fork
related:
  - '[[CONTRIBUTING.md]]'
  - '[[docs/development/README.md]]'
  - '[[CLAUDE.md]]'
---

# Git Workflow & Fork Management

This guide documents the git workflow for contributing to Maestro using a fork-based development model. It covers fork synchronization, branch naming conventions, pull request processes, and automation setup.

## Overview

Maestro uses a **fork-based contribution workflow** where contributors:

1. Fork the main repository (`pedramamini/Maestro`)
2. Create feature branches in their personal fork
3. Submit pull requests from fork to upstream
4. Keep their fork synchronized with upstream regularly

This model allows for safe parallel development while maintaining a clean upstream repository.

---

## Remote Configuration

### Standard Remote Setup

Your repository should have two remotes:

```bash
# View current remotes
git remote -v

# Expected output:
# origin    https://github.com/pedramamini/Maestro.git (fetch)
# origin    https://github.com/pedramamini/Maestro.git (push)
# fork      https://github.com/YOUR_USERNAME/Maestro.git (fetch)
# fork      https://github.com/YOUR_USERNAME/Maestro.git (push)
```

### Adding Your Fork

If your fork is not already configured:

```bash
# Using GitHub CLI (recommended)
gh repo set-default YOUR_USERNAME/Maestro

# Or using git directly
git remote add fork git@github.com:YOUR_USERNAME/Maestro.git

# Or using HTTPS
git remote add fork https://github.com/YOUR_USERNAME/Maestro.git
```

### Fetching from Fork

After adding the fork, fetch to ensure connectivity:

```bash
git fetch fork
```

You should see branches listed after fetching:

```bash
$ git fetch fork
From https://github.com/YOUR_USERNAME/Maestro
 * [new branch]      main          -> fork/main
 * [new branch]      feature-x     -> fork/feature-x
```

---

## Fork Synchronization Strategy

### The Flow: Upstream → Fork → Local

```
┌─────────────┐      fetch      ┌──────────────┐      pull      ┌─────────────┐
│   Upstream  │ ───────────────►│    Fork      │ ─────────────►│    Local    │
│ (pedramamini)│                │ (your fork)   │                │ (your dev)  │
└─────────────┘                  └──────────────┘                └─────────────┘
     main                               main                       main
```

### Regular Synchronization

Keep your fork's `main` branch up-to-date with upstream:

```bash
# Fetch latest from upstream
git fetch origin

# Checkout your fork's main branch
git checkout fork/main

# Merge upstream main into fork main
git merge origin/main

# Push to update your fork
git push fork main
```

### Before Starting New Work

Always sync your fork before creating a new feature branch:

```bash
# 1. Fetch upstream changes
git fetch origin

# 2. Update your fork's main
git checkout fork/main
git merge origin/main
git push fork main

# 3. Create feature branch from updated fork/main
git checkout -b feature/your-feature-name fork/main
```

### Updating Feature Branches

If upstream changes affect your feature branch:

```bash
# Fetch latest from upstream
git fetch origin

# Rebase your feature branch onto latest upstream main
git checkout feature/your-feature-name
git rebase origin/main

# Resolve any conflicts if needed
# git add <resolved-files>
# git rebase --continue

# Push updated feature branch (may need force if history changed)
git push fork feature/your-feature-name --force-with-lease
```

**⚠️ Important**: Use `--force-with-lease` instead of `--force` to avoid overwriting others' changes.

---

## Branch Naming Conventions

Follow these naming conventions for branches to maintain organization and clarity:

### Feature Branches

For new features or enhancements:

```
feature/<feature-name>
feature/<category>/<specific-name>
```

**Examples**:

- `feature/add-usage-dashboard`
- `feature/document-graph/visualization`
- `feature/ssh-remote-execution`

### Bug Fix Branches

For fixing bugs:

```
fix/<bug-description>
fix/<category>/<issue-number>-<brief-description>
```

**Examples**:

- `fix/memory-leak-in-session-manager`
- `fix/performance/123-excessive-timer-frequency`

### Documentation Branches

For documentation changes:

```
docs/<topic>
docs/<category>/<topic>
```

**Examples**:

- `docs/update-contributing-guide`
- `docs/performance/profiling-guide`

### Refactoring Branches

For code refactoring without behavior changes:

```
refactor/<component-or-area>
refactor/<technique>/<component>
```

**Examples**:

- `refactor/session-storage-interface`
- `refactor/optimize/renderer-component-updates`

### Experiment Branches

For experimental features or proof-of-concepts:

```
experiment/<idea>
experiment/<area>/<idea>
```

**Examples**:

- `experiment/new-agent-integration`
- `experiment/performance/webworker-architecture`

### Release/Branch Branches

For release preparations (typically maintainers only):

```
release/<version>
```

**Examples**:

- `release/0.15.0`
- `release/0.16.0-beta`

### Naming Best Practices

1. **Be descriptive** - Branch names should clearly indicate what the branch does
2. **Use lowercase** - Avoid uppercase to prevent case-sensitivity issues
3. **Use hyphens** - Separate words with hyphens, not underscores or spaces
4. **Keep it concise** - Avoid overly long branch names (aim for < 50 characters)
5. **Reference issues** - Include issue numbers when applicable for traceability
6. **Avoid special characters** - Stick to alphanumeric and hyphens

**Good examples**:

- ✅ `feature/add-gemini-coder-agent`
- ✅ `fix/456-authentication-timeout`
- ✅ `docs/performance-guide-update`

**Bad examples**:

- ❌ `AddGeminiCoderAgent` (uppercase)
- ❌ `fix_auth_timeout` (underscores)
- ❌ `feature/adding-support-for-gemini-coder-and-qwen3-agents` (too long)
- ❌ `experiment@new-thing` (special characters)

---

## Pull Request Workflow

### Creating a Pull Request

1. **Prepare your branch**:

   ```bash
   # Ensure your branch is up-to-date with upstream
   git fetch origin
   git rebase origin/main

   # Push to your fork
   git push fork feature/your-feature-name
   ```

2. **Create PR via GitHub CLI**:

   ```bash
   gh pr create --base main --head fork:feature/your-feature-name \
                --title "Brief, descriptive title" \
                --body "Detailed description of changes..."
   ```

3. **Or create via GitHub web interface**:
   - Go to https://github.com/pedramamini/Maestro
   - Click "New Pull Request"
   - Select your fork and branch as the source
   - Fill in the title and description
   - Submit the PR

### PR Title Format

Use clear, descriptive titles following these patterns:

```
<type>: <brief description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes (formatting, etc.)
- refactor: Code refactoring
- perf: Performance improvements
- test: Adding or updating tests
- chore: Maintenance tasks
```

**Examples**:

- `feat: add Gemini Coder agent integration`
- `fix: resolve memory leak in session manager`
- `perf: optimize timer usage in renderer`
- `docs: update contributing guidelines with git workflow`

### PR Description Template

Use this template for comprehensive pull request descriptions:

```markdown
## Description

Brief description of what this PR does and why it's needed.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing

### Manual Testing

- [ ] Tested locally with development build
- [ ] Tested with production data
- [ ] Verified on [platform] (macOS / Windows / Linux)

### Automated Testing

- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Updated tests for modified functionality

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review performed
- [ ] Commented complex code sections
- [ ] Updated documentation if needed
- [ ] No new warnings or errors
- [ ] Added appropriate tests
- [ ] All tests pass

## Related Issues

Fixes #123
Related to #456

## Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

## Additional Notes

Any additional context, considerations, or known limitations.
```

### PR Review Process

1. **Wait for review** - Maintainers will review your PR and provide feedback
2. **Address feedback** - Make requested changes and push updates
3. **Request re-review** - Comment to signal that changes are ready for re-review
4. **Approval & merge** - Once approved, a maintainer will merge your PR

### Handling Review Feedback

When receiving review feedback:

```bash
# Make requested changes locally
git checkout feature/your-feature-name
# ... make changes ...

# Commit the changes
git add .
git commit -m "Address review feedback"

# Push to your fork
git push fork feature/your-feature-name
```

---

## Nightly Pull Automation Setup

> **Note**: This is a placeholder for Phase 03 implementation. Automation scripts and cron job setup will be detailed in that phase.

### Purpose

Automate daily synchronization of your fork with upstream to:

- Keep development environment current
- Reduce merge conflicts before starting work
- Maintain clean branch history
- Enable quick response to upstream changes

### Planned Automation

**Scripts to be created in Phase 03**:

1. **`scripts/sync-fork.sh`** - Automated fork synchronization script
   - Fetches upstream changes
   - Updates fork's main branch
   - Creates a backup before sync
   - Logs synchronization history
   - Handles conflicts gracefully

2. **`scripts/create-feature-branch.sh`** - Feature branch creation helper
   - Syncs fork before creating branch
   - Validates branch name against conventions
   - Sets up tracking branch
   - Runs initial build/test

3. **Cron job configuration** - Scheduled nightly runs
   - Configurable timing (default: 2 AM local time)
   - Email notifications on success/failure
   - Backup and rollback support

### Manual Sync Procedure (Phase 03)

Until automation is implemented, perform manual sync regularly:

```bash
# 1. Create backup of current state
git branch backup-$(date +%Y%m%d)

# 2. Fetch upstream
git fetch origin

# 3. Update fork main
git checkout fork/main
git merge origin/main

# 4. Push to fork
git push fork main

# 5. Return to previous branch
git checkout -
```

### Monitoring Sync Health

Track fork synchronization to detect issues early:

```bash
# Check days since last sync
git log --oneline -1 --since="7 days ago" fork/main
# If empty, fork hasn't been synced in 7+ days

# Compare branch commits
git rev-list --left-right --count origin/main...fork/main
# Shows number of commits that differ between branches
```

---

## Common Git Scenarios

### Scenario 1: Upstream Has Conflicting Changes

```bash
# Fetch upstream changes
git fetch origin

# Rebase your feature branch
git checkout feature/your-feature-name
git rebase origin/main

# If conflicts occur:
# 1. Git will pause and indicate conflicted files
# 2. Edit files to resolve conflicts
# 3. Mark files as resolved:
git add <resolved-files>

# 4. Continue rebase
git rebase --continue

# If needed to abort:
git rebase --abort

# After successful rebase, push with force-with-lease
git push fork feature/your-feature-name --force-with-lease
```

### Scenario 2: Need to Update PR After Reviews

```bash
# Make additional changes
git checkout feature/your-feature-name
# ... make changes ...

# Commit changes
git add .
git commit -m "Add requested changes from PR review"

# Push to fork
git push fork feature/your-feature-name

# PR updates automatically with new commits
```

### Scenario 3: Accidentally Committed to Main Branch

```bash
# Oops, committed to fork/main instead of feature branch
git checkout fork/main

# Create feature branch from current state
git checkout -b feature/your-feature-name

# Reset main back to upstream
git reset --hard origin/main

# Push reset main to fork
git push fork main --force-with-lease

# Continue with feature branch
git push fork feature/your-feature-name
```

### Scenario 4: Multiple Related Branches

```bash
# Create stacked feature branches
git checkout -b feature/part-one fork/main
# ... work on part one ...
git push fork feature/part-one

# Create part two based on part one
git checkout -b feature/part-two fork/part-one
# ... work on part two ...
git push fork feature/part-two

# When part one is merged, update part two
git checkout feature/part-two
git rebase origin/main
git push fork feature/part-two --force-with-lease
```

---

## Git Best Practices

### Commit Messages

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples**:

```
feat(session): add auto-save draft functionality

- Implement localStorage-based draft persistence
- Auto-save every 5 seconds during typing
- Restore drafts on session load
- Clean up old drafts after 30 days

Closes #123
```

```
fix(renderer): resolve memory leak in timer hook

- Clear intervals on component unmount
- Add cleanup to useEffect return
- Add unit tests for timer hook behavior

Fixes #456
```

### Keeping History Clean

- **Use rebase** instead of merge for pulling updates
- **Squash WIP commits** before submitting PRs (but keep logical separate commits)
- **Write clear messages** for each commit
- **Review before pushing** - use `git rebase -i` to edit history

### Branch Hygiene

- **Delete merged branches** after PR merge:
  ```bash
  git branch -d feature/merged-feature
  git push fork --delete feature/merged-feature
  ```
- **Keep branches short-lived** - aim to merge within a few days of creation
- **Avoid long-running feature branches** - they accumulate merge conflicts

### Backup Strategy

- **Before destructive operations** (rebase, force push), create backup:
  ```bash
  git branch backup-before-rebase
  ```
- **Tag important milestones**:
  ```bash
  git tag milestone-2025-02-08
  git push origin milestone-2025-02-08
  ```

---

## Troubleshooting

### Issue: Cannot Push to Fork

**Symptoms**:

```
error: failed to push some refs to 'https://github.com/YOUR_USERNAME/Maestro.git'
! [rejected]        feature/name -> feature/name (non-fast-forward)
```

**Solution**:

```bash
# Fetch your fork to see what's there
git fetch fork

# Rebase your local branch onto fork's branch
git checkout feature/name
git rebase fork/feature/name

# Or if you know your version is correct:
git push fork feature/name --force-with-lease
```

### Issue: Remote Repository Not Found

**Symptoms**:

```
fatal: repository 'https://github.com/pedramamini/Maestro.git' not found
```

**Solution**:

```bash
# Check authentication
gh auth status

# Re-authenticate if needed
gh auth login

# Or update remote with personal access token
git remote set-url origin https://TOKEN@github.com/pedramamini/Maestro.git
```

### Issue: Rebase Conflicts

**Symptoms**:

```
CONFLICT (content): Merge conflict in src/file.ts
Automatic rebase failed; fix conflicts and then commit the result.
```

**Solution**:

```bash
# See what conflicts exist
git status

# Edit files to resolve conflicts (look for <<<<<<<, =======, >>>>>>>)
vim src/file.ts

# Mark files as resolved
git add src/file.ts

# Continue rebase
git rebase --continue

# If stuck, abort and try again
git rebase --abort
```

### Issue: Fork Out of Sync

**Symptoms**:
Your fork is many commits behind upstream, causing conflicts.

**Solution**:

```bash
# Hard reset fork/main to upstream main
git fetch origin
git checkout fork/main
git reset --hard origin/main
git push fork main --force-with-lease
```

**⚠️ Warning**: This will overwrite your fork's main branch. Ensure you've backed up any work.

---

## Additional Resources

- **[[CONTRIBUTING.md]]** - Complete contributing guidelines
- **[[CLAUDE.md]]** - Codebase conventions and patterns
- **[[docs/development/README.md]]** - Development documentation hub
- **[GitHub Fork Documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks)** - Official GitHub docs
- **[Git Branching Model](https://nvie.com/posts/a-successful-git-branching-model/)** - Classic git workflow reference

---

**Last Updated**: 2025-02-08
