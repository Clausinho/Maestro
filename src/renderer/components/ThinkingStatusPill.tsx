import React, { memo, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { Session, Theme } from '../types';

interface ThinkingStatusPillProps {
  sessions: Session[];
  theme: Theme;
  onSessionClick?: (sessionId: string) => void;
  namedSessions?: Record<string, string>; // Claude session ID -> custom name
}

// ElapsedTimeDisplay - shows time since thinking started
const ElapsedTimeDisplay = memo(({ startTime, textColor }: { startTime: number; textColor: string }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(
    Math.floor((Date.now() - startTime) / 1000)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <span className="font-mono text-xs" style={{ color: textColor }}>
      {formatTime(elapsedSeconds)}
    </span>
  );
});

ElapsedTimeDisplay.displayName = 'ElapsedTimeDisplay';

// Helper to get display name for a session
function getSessionDisplayName(session: Session, namedSessions?: Record<string, string>): string {
  // If session has a Claude session ID, show that (with custom name if available)
  if (session.claudeSessionId) {
    const customName = namedSessions?.[session.claudeSessionId];
    if (customName) return customName;
    // Show first segment of GUID in uppercase
    return session.claudeSessionId.split('-')[0].toUpperCase();
  }
  // Fall back to Maestro session name
  return session.name;
}

// Helper to format tokens compactly
function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
}

// Helper to format bytes compactly
function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${bytes}B`;
}

// Single session row for the expanded dropdown
const SessionRow = memo(({
  session,
  theme,
  namedSessions,
  onSessionClick
}: {
  session: Session;
  theme: Theme;
  namedSessions?: Record<string, string>;
  onSessionClick?: (sessionId: string) => void;
}) => {
  const displayName = getSessionDisplayName(session, namedSessions);
  const tokens = session.currentCycleTokens || 0;

  return (
    <button
      onClick={() => onSessionClick?.(session.id)}
      className="flex items-center justify-between gap-3 w-full px-3 py-2 text-left hover:bg-white/5 transition-colors"
      style={{ color: theme.colors.textMain }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Loader2
          className="w-3 h-3 shrink-0 animate-spin"
          style={{ color: theme.colors.warning }}
        />
        <span className="text-xs font-mono truncate">{displayName}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0 text-xs" style={{ color: theme.colors.textDim }}>
        {tokens > 0 && (
          <span>{formatTokens(tokens)}</span>
        )}
        {session.thinkingStartTime && (
          <ElapsedTimeDisplay
            startTime={session.thinkingStartTime}
            textColor={theme.colors.textDim}
          />
        )}
      </div>
    </button>
  );
});

SessionRow.displayName = 'SessionRow';

// Main component - shows primary thinking session with expandable list for multiple
function ThinkingStatusPillInner({ sessions, theme, onSessionClick, namedSessions }: ThinkingStatusPillProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter to only busy sessions with AI source
  const thinkingSessions = sessions.filter(
    s => s.state === 'busy' && s.busySource === 'ai'
  );

  if (thinkingSessions.length === 0) {
    return null;
  }

  // Primary session is the first one (most recently started or active)
  const primarySession = thinkingSessions[0];
  const additionalSessions = thinkingSessions.slice(1);
  const hasMultiple = additionalSessions.length > 0;

  // Get tokens for current thinking cycle only (not cumulative context)
  const primaryTokens = primarySession.currentCycleTokens || 0;
  // Get bytes received during streaming (for real-time progress when tokens not yet available)
  const primaryBytes = primarySession.currentCycleBytes || 0;

  // Get display components - show more on larger screens
  const maestroSessionName = primarySession.name;
  const claudeSessionId = primarySession.claudeSessionId;
  const customName = claudeSessionId ? namedSessions?.[claudeSessionId] : undefined;

  // For tooltip, show all available info
  const tooltipParts = [maestroSessionName];
  if (claudeSessionId) tooltipParts.push(`Claude: ${claudeSessionId}`);
  if (customName) tooltipParts.push(`Named: ${customName}`);
  const fullTooltip = tooltipParts.join(' | ');

  return (
    <div className="relative mb-2">
      <div
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-full mx-auto max-w-full overflow-hidden"
        style={{
          backgroundColor: theme.colors.warning + '20',
          border: `1px solid ${theme.colors.border}`
        }}
      >
        {/* Pulsing indicator */}
        <Loader2
          className="w-4 h-4 shrink-0 animate-spin"
          style={{ color: theme.colors.warning }}
        />

        {/* Maestro session name - always visible, not clickable */}
        <span
          className="text-xs font-medium shrink-0"
          style={{ color: theme.colors.textMain }}
          title={fullTooltip}
        >
          {maestroSessionName}
        </span>

        {/* Divider */}
        <div
          className="w-px h-4 shrink-0"
          style={{ backgroundColor: theme.colors.border }}
        />

        {/* Token/Bytes info for this thought cycle */}
        {/* Show tokens once available, otherwise show streaming bytes for real-time progress */}
        <div className="flex items-center gap-1 shrink-0 text-xs" style={{ color: theme.colors.textDim }}>
          {primaryTokens > 0 ? (
            <>
              <span>Tokens:</span>
              <span className="font-medium" style={{ color: theme.colors.textMain }}>
                {formatTokens(primaryTokens)}
              </span>
            </>
          ) : primaryBytes > 0 ? (
            <>
              <span>Recv:</span>
              <span className="font-medium" style={{ color: theme.colors.textMain }}>
                {formatBytes(primaryBytes)}
              </span>
            </>
          ) : (
            <>
              <span>Recv:</span>
              <span>...</span>
            </>
          )}
        </div>

        {/* Elapsed time for primary session */}
        {primarySession.thinkingStartTime && (
          <>
            <div
              className="w-px h-4 shrink-0"
              style={{ backgroundColor: theme.colors.border }}
            />
            <div className="flex items-center gap-1 shrink-0 text-xs" style={{ color: theme.colors.textDim }}>
              <span>Elapsed:</span>
              <ElapsedTimeDisplay
                startTime={primarySession.thinkingStartTime}
                textColor={theme.colors.textMain}
              />
            </div>
          </>
        )}

        {/* Claude session ID - clickable to navigate to session */}
        {claudeSessionId && (
          <>
            <div
              className="w-px h-4 shrink-0"
              style={{ backgroundColor: theme.colors.border }}
            />
            <button
              onClick={() => onSessionClick?.(primarySession.id)}
              className="text-xs font-mono hover:underline cursor-pointer"
              style={{ color: theme.colors.accent }}
              title={`Claude Session: ${claudeSessionId}`}
            >
              {customName || claudeSessionId.substring(0, 8)}
            </button>
          </>
        )}

        {/* Additional sessions indicator dot */}
        {hasMultiple && (
          <div
            className="relative"
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
              style={{
                backgroundColor: theme.colors.warning + '40',
                border: `1px solid ${theme.colors.warning}60`
              }}
              title={`+${additionalSessions.length} more thinking`}
            >
              <span
                className="text-[10px] font-bold"
                style={{ color: theme.colors.warning }}
              >
                +{additionalSessions.length}
              </span>
            </div>

            {/* Expanded dropdown */}
            {isExpanded && (
              <div
                className="absolute right-0 top-full mt-1 min-w-[200px] rounded-lg shadow-xl overflow-hidden z-50"
                style={{
                  backgroundColor: theme.colors.bgSidebar,
                  border: `1px solid ${theme.colors.border}`
                }}
              >
                <div
                  className="px-3 py-1.5 text-[10px] uppercase tracking-wide font-semibold"
                  style={{ color: theme.colors.textDim, backgroundColor: theme.colors.bgActivity }}
                >
                  All Thinking Sessions
                </div>
                {thinkingSessions.map(session => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    theme={theme}
                    namedSessions={namedSessions}
                    onSessionClick={onSessionClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Memoized export
export const ThinkingStatusPill = memo(ThinkingStatusPillInner, (prevProps, nextProps) => {
  // Check if thinking sessions have changed
  const prevThinking = prevProps.sessions.filter(s => s.state === 'busy' && s.busySource === 'ai');
  const nextThinking = nextProps.sessions.filter(s => s.state === 'busy' && s.busySource === 'ai');

  if (prevThinking.length !== nextThinking.length) return false;

  // Compare each thinking session's relevant properties
  for (let i = 0; i < prevThinking.length; i++) {
    const prev = prevThinking[i];
    const next = nextThinking[i];
    if (
      prev.id !== next.id ||
      prev.name !== next.name ||
      prev.claudeSessionId !== next.claudeSessionId ||
      prev.state !== next.state ||
      prev.thinkingStartTime !== next.thinkingStartTime ||
      prev.currentCycleTokens !== next.currentCycleTokens ||
      prev.currentCycleBytes !== next.currentCycleBytes
    ) {
      return false;
    }
  }

  // Check if namedSessions changed for any thinking session
  if (prevProps.namedSessions !== nextProps.namedSessions) {
    for (const session of nextThinking) {
      if (session.claudeSessionId) {
        const prevName = prevProps.namedSessions?.[session.claudeSessionId];
        const nextName = nextProps.namedSessions?.[session.claudeSessionId];
        if (prevName !== nextName) return false;
      }
    }
  }

  return prevProps.theme === nextProps.theme;
});

ThinkingStatusPill.displayName = 'ThinkingStatusPill';
