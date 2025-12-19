/**
 * ParticipantCard.tsx
 *
 * Displays a single group chat participant with their status,
 * session ID, context usage, stats, and cost.
 */

import { MessageSquare, Copy, Check, DollarSign } from 'lucide-react';
import { useState, useCallback } from 'react';
import type { Theme, GroupChatParticipant, SessionState } from '../types';

interface ParticipantCardProps {
  theme: Theme;
  participant: GroupChatParticipant;
  state: SessionState;
  color?: string;
}

/**
 * Format cost as a dollar amount.
 */
function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Format time as relative or absolute.
 */
function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ParticipantCard({
  theme,
  participant,
  state,
  color,
}: ParticipantCardProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  // Prefer agent's session ID (clean GUID) over internal process session ID
  const displaySessionId = participant.agentSessionId || participant.sessionId;

  const copySessionId = useCallback(() => {
    if (displaySessionId) {
      navigator.clipboard.writeText(displaySessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [displaySessionId]);

  const getStatusColor = (): string => {
    switch (state) {
      case 'busy':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      case 'connecting':
        return theme.colors.warning;
      default:
        return theme.colors.success;
    }
  };

  const getStatusLabel = (): string => {
    switch (state) {
      case 'busy':
        return 'Working';
      case 'error':
        return 'Error';
      case 'connecting':
        return 'Connecting';
      default:
        return 'Idle';
    }
  };

  return (
    <div
      className="rounded-lg border p-3"
      style={{
        backgroundColor: theme.colors.bgMain,
        borderColor: theme.colors.border,
        borderLeftWidth: '3px',
        borderLeftColor: color || theme.colors.accent,
      }}
    >
      {/* Header row: name and status */}
      <div className="flex items-center justify-between">
        <span
          className="font-medium"
          style={{ color: color || theme.colors.textMain }}
        >
          {participant.name}
        </span>
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: getStatusColor() }}
          title={getStatusLabel()}
        />
      </div>

      {/* Agent type */}
      <div
        className="text-xs mt-1"
        style={{ color: theme.colors.textDim }}
      >
        {participant.agentId}
      </div>

      {/* Session ID pill */}
      {displaySessionId && (
        <div className="mt-2 flex items-center gap-1">
          <button
            onClick={copySessionId}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity cursor-pointer"
            style={{
              backgroundColor: `${theme.colors.accent}20`,
              color: theme.colors.accent,
              border: `1px solid ${theme.colors.accent}40`,
            }}
            title={`Session: ${displaySessionId}\nClick to copy`}
          >
            <span className="font-mono">
              {displaySessionId.slice(0, 8)}...
            </span>
            {copied ? (
              <Check className="w-2.5 h-2.5" />
            ) : (
              <Copy className="w-2.5 h-2.5" />
            )}
          </button>
        </div>
      )}

      {/* Stats row */}
      {(participant.messageCount || participant.tokenCount || participant.processingTimeMs) && (
        <div
          className="text-xs mt-2 flex items-center gap-3"
          style={{ color: theme.colors.textDim }}
        >
          {(participant.messageCount !== undefined && participant.messageCount > 0) && (
            <span className="flex items-center gap-1" title="Messages sent">
              <MessageSquare className="w-3 h-3" />
              {participant.messageCount}
            </span>
          )}
          {(participant.tokenCount !== undefined && participant.tokenCount > 0) && (
            <span className="flex items-center gap-1" title="Tokens used">
              <Zap className="w-3 h-3" />
              {formatTokens(participant.tokenCount)}
            </span>
          )}
          {(participant.processingTimeMs !== undefined && participant.processingTimeMs > 0) && (
            <span className="flex items-center gap-1" title="Processing time">
              <Clock className="w-3 h-3" />
              {formatDuration(participant.processingTimeMs)}
            </span>
          )}
        </div>
      )}

      {/* Context usage bar */}
      {participant.contextUsage !== undefined && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs"
              style={{ color: theme.colors.textDim }}
            >
              Context
            </span>
            <span
              className="text-xs"
              style={{ color: theme.colors.textDim }}
            >
              {participant.contextUsage}%
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: theme.colors.border }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${participant.contextUsage}%`,
                backgroundColor:
                  participant.contextUsage > 80
                    ? theme.colors.warning
                    : theme.colors.accent,
              }}
            />
          </div>
        </div>
      )}

      {/* Last activity summary - always visible */}
      {participant.lastSummary && (
        <div
          className="mt-2 text-xs p-2 rounded"
          style={{
            backgroundColor: theme.colors.bgSidebar,
            color: theme.colors.textDim,
          }}
        >
          <span style={{ color: theme.colors.textMain }}>Last:</span>{' '}
          {participant.lastSummary}
        </div>
      )}

      {/* Last activity time */}
      {participant.lastActivity && (
        <div
          className="mt-1 text-[10px]"
          style={{ color: theme.colors.textDim }}
        >
          {new Date(participant.lastActivity).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
