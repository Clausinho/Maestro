// Tab helper functions for AI multi-tab support
// These helpers manage AITab state within Maestro sessions

import { Session, AITab, LogEntry, UsageStats } from '../types';
import { generateId } from './ids';

/**
 * Get the currently active AI tab for a session.
 * Returns the tab matching activeTabId, or the first tab if not found.
 * Returns undefined if the session has no tabs.
 *
 * @param session - The Maestro session
 * @returns The active AITab or undefined if no tabs exist
 */
export function getActiveTab(session: Session): AITab | undefined {
  if (!session.aiTabs || session.aiTabs.length === 0) {
    return undefined;
  }

  const activeTab = session.aiTabs.find(tab => tab.id === session.activeTabId);

  // Fallback to first tab if activeTabId doesn't match any tab
  // (can happen after tab deletion or data corruption)
  return activeTab ?? session.aiTabs[0];
}

/**
 * Options for creating a new AI tab.
 */
export interface CreateTabOptions {
  claudeSessionId?: string | null;  // Claude Code session UUID (null for new tabs)
  logs?: LogEntry[];                // Initial conversation history
  name?: string | null;             // User-defined name (null = show UUID octet)
  starred?: boolean;                // Whether session is starred
  usageStats?: UsageStats;          // Token usage stats
}

/**
 * Result of creating a new tab - contains both the new tab and updated session.
 */
export interface CreateTabResult {
  tab: AITab;                       // The newly created tab
  session: Session;                 // Updated session with the new tab added and set as active
}

/**
 * Create a new AI tab for a session.
 * The new tab is appended to the session's aiTabs array and set as the active tab.
 *
 * @param session - The Maestro session to add the tab to
 * @param options - Optional tab configuration (claudeSessionId, logs, name, starred)
 * @returns Object containing the new tab and updated session
 *
 * @example
 * // Create a new empty tab
 * const { tab, session: updatedSession } = createTab(session);
 *
 * @example
 * // Create a tab for an existing Claude session
 * const { tab, session: updatedSession } = createTab(session, {
 *   claudeSessionId: 'abc123',
 *   name: 'My Feature',
 *   starred: true,
 *   logs: existingLogs
 * });
 */
export function createTab(session: Session, options: CreateTabOptions = {}): CreateTabResult {
  const {
    claudeSessionId = null,
    logs = [],
    name = null,
    starred = false,
    usageStats
  } = options;

  // Create the new tab with default values
  const newTab: AITab = {
    id: generateId(),
    claudeSessionId,
    name,
    starred,
    logs,
    messageQueue: [],
    inputValue: '',
    usageStats,
    createdAt: Date.now(),
    state: 'idle'
  };

  // Update the session with the new tab added and set as active
  const updatedSession: Session = {
    ...session,
    aiTabs: [...(session.aiTabs || []), newTab],
    activeTabId: newTab.id
  };

  return {
    tab: newTab,
    session: updatedSession
  };
}
