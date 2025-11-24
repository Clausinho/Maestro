import React, { useRef, useEffect, useMemo, forwardRef, useState } from 'react';
import { Activity, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Session, Theme, LogEntry } from '../types';
import Convert from 'ansi-to-html';
import DOMPurify from 'dompurify';

interface TerminalOutputProps {
  session: Session;
  theme: Theme;
  activeFocus: string;
  outputSearchOpen: boolean;
  outputSearchQuery: string;
  setOutputSearchOpen: (open: boolean) => void;
  setOutputSearchQuery: (query: string) => void;
  setActiveFocus: (focus: string) => void;
  setLightboxImage: (image: string | null) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  logsEndRef: React.RefObject<HTMLDivElement>;
  maxOutputLines: number;
}

export const TerminalOutput = forwardRef<HTMLDivElement, TerminalOutputProps>((props, ref) => {
  const {
    session, theme, activeFocus, outputSearchOpen, outputSearchQuery,
    setOutputSearchOpen, setOutputSearchQuery, setActiveFocus, setLightboxImage,
    inputRef, logsEndRef, maxOutputLines
  } = props;

  // Use the forwarded ref if provided, otherwise create a local one
  const terminalOutputRef = (ref as React.RefObject<HTMLDivElement>) || useRef<HTMLDivElement>(null);

  // Track which log entries are expanded (by log ID)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleExpanded = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  // Auto-focus on search input when opened
  useEffect(() => {
    if (outputSearchOpen) {
      terminalOutputRef.current?.querySelector('input')?.focus();
    }
  }, [outputSearchOpen]);

  // Create ANSI converter with theme-aware colors
  const ansiConverter = useMemo(() => {
    return new Convert({
      fg: theme.colors.textMain,
      bg: theme.colors.bgMain,
      newline: false,
      escapeXML: true,
      stream: false,
      colors: {
        0: theme.colors.textMain,   // black -> textMain
        1: theme.colors.error,       // red -> error
        2: theme.colors.success,     // green -> success
        3: theme.colors.warning,     // yellow -> warning
        4: theme.colors.accent,      // blue -> accent
        5: theme.colors.accentDim,   // magenta -> accentDim
        6: theme.colors.accent,      // cyan -> accent
        7: theme.colors.textDim,     // white -> textDim
      }
    });
  }, [theme]);

  // Filter out bash prompt lines and apply processing
  const processLogText = (text: string, isTerminal: boolean): string => {
    if (!isTerminal) return text;

    // Remove bash prompt lines (e.g., "bash-3.2$", "zsh%", "$", "#")
    const lines = text.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      // Skip empty lines and common prompt patterns
      if (!trimmed) return false;
      if (/^(bash-\d+\.\d+\$|zsh[%#]|\$|#)\s*$/.test(trimmed)) return false;
      return true;
    });

    return filteredLines.join('\n');
  };

  const activeLogs: LogEntry[] = session.inputMode === 'ai' ? session.aiLogs : session.shellLogs;

  return (
    <div
      ref={terminalOutputRef}
      tabIndex={0}
      className="flex-1 overflow-y-auto p-6 space-y-4 transition-colors outline-none relative"
      style={{ backgroundColor: session.inputMode === 'ai' ? theme.colors.bgMain : theme.colors.bgActivity }}
      onKeyDown={(e) => {
        // / to open search
        if (e.key === '/' && !outputSearchOpen) {
          e.preventDefault();
          setOutputSearchOpen(true);
          return;
        }
        // Escape handling
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          if (outputSearchOpen) {
            // Close search but stay focused on output
            setOutputSearchOpen(false);
            setOutputSearchQuery('');
          } else {
            // Focus back to text input
            inputRef.current?.focus();
            setActiveFocus('main');
          }
          return;
        }
        // Arrow key scrolling
        if (e.key === 'ArrowUp' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          terminalOutputRef.current?.scrollBy({ top: -40, behavior: 'smooth' });
          return;
        }
        if (e.key === 'ArrowDown' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          terminalOutputRef.current?.scrollBy({ top: 40, behavior: 'smooth' });
          return;
        }
        // Cmd+Up to jump to top
        if (e.key === 'ArrowUp' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          terminalOutputRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        // Cmd+Down to jump to bottom
        if (e.key === 'ArrowDown' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          terminalOutputRef.current?.scrollTo({ top: terminalOutputRef.current.scrollHeight, behavior: 'smooth' });
          return;
        }
      }}
    >
      {/* Output Search */}
      {outputSearchOpen && (
        <div className="sticky top-0 z-10 pb-4">
          <input
            type="text"
            value={outputSearchQuery}
            onChange={(e) => setOutputSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                setOutputSearchOpen(false);
                setOutputSearchQuery('');
                terminalOutputRef.current?.focus();
              }
            }}
            placeholder="Filter output... (Esc to close)"
            className="w-full px-3 py-2 rounded border bg-transparent outline-none text-sm"
            style={{ borderColor: theme.colors.accent, color: theme.colors.textMain, backgroundColor: theme.colors.bgSidebar }}
            autoFocus
          />
        </div>
      )}
      {activeLogs.filter(log => {
        if (!outputSearchQuery) return true;
        return log.text.toLowerCase().includes(outputSearchQuery.toLowerCase());
      }).map((log, idx, filteredLogs) => {
        const isTerminal = session.inputMode === 'terminal';

        // Find the most recent user command before this log entry (for echo stripping)
        let lastUserCommand: string | undefined;
        if (isTerminal && log.source !== 'user') {
          for (let i = idx - 1; i >= 0; i--) {
            if (filteredLogs[i].source === 'user') {
              lastUserCommand = filteredLogs[i].text;
              break;
            }
          }
        }

        // Strip command echo from terminal output
        let textToProcess = log.text;
        if (isTerminal && log.source !== 'user' && lastUserCommand) {
          // Remove command echo from beginning of output
          if (textToProcess.startsWith(lastUserCommand)) {
            textToProcess = textToProcess.slice(lastUserCommand.length);
            // Remove newline after command
            if (textToProcess.startsWith('\r\n')) {
              textToProcess = textToProcess.slice(2);
            } else if (textToProcess.startsWith('\n') || textToProcess.startsWith('\r')) {
              textToProcess = textToProcess.slice(1);
            }
          }
        }

        const processedText = processLogText(textToProcess, isTerminal && log.source !== 'user');

        // Skip rendering if text is empty after processing
        if (!processedText.trim() && log.source !== 'user') return null;

        // Convert ANSI codes to HTML for terminal output and sanitize
        const htmlContent = isTerminal && log.source !== 'user'
          ? DOMPurify.sanitize(ansiConverter.toHtml(processedText))
          : processedText;

        // Count lines in the processed text
        const lineCount = processedText.split('\n').length;
        const shouldCollapse = lineCount > maxOutputLines && maxOutputLines !== Infinity;
        const isExpanded = expandedLogs.has(log.id);

        // Truncate text if collapsed
        const displayText = shouldCollapse && !isExpanded
          ? processedText.split('\n').slice(0, maxOutputLines).join('\n')
          : processedText;

        const displayHtmlContent = shouldCollapse && !isExpanded && isTerminal && log.source !== 'user'
          ? DOMPurify.sanitize(ansiConverter.toHtml(displayText))
          : htmlContent;

        return (
          <div key={log.id} className={`flex gap-4 group ${log.source === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-12 shrink-0 text-[10px] opacity-40 pt-2 font-mono text-center">
              {new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </div>
            <div className={`flex-1 p-4 rounded-xl border ${log.source === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                 style={{
                   backgroundColor: log.source === 'user' ? theme.colors.bgActivity : 'transparent',
                   borderColor: theme.colors.border
                 }}>
              {log.images && log.images.length > 0 && (
                <div className="flex gap-2 mb-2 overflow-x-auto">
                  {log.images.map((img, idx) => (
                    <img key={idx} src={img} className="h-20 rounded border cursor-zoom-in" onClick={() => setLightboxImage(img)} />
                  ))}
                </div>
              )}
              {shouldCollapse && !isExpanded ? (
                <div>
                  <div
                    className={`${isTerminal && log.source !== 'user' ? 'whitespace-pre-wrap text-sm font-mono overflow-x-auto' : 'whitespace-pre-wrap text-sm'}`}
                    style={{
                      maxHeight: `${maxOutputLines * 1.5}em`,
                      overflow: 'hidden',
                      color: theme.colors.textMain
                    }}
                  >
                    {isTerminal && log.source !== 'user' ? (
                      <div dangerouslySetInnerHTML={{ __html: displayHtmlContent }} />
                    ) : (
                      displayText
                    )}
                  </div>
                  <button
                    onClick={() => toggleExpanded(log.id)}
                    className="flex items-center gap-2 mt-2 text-xs px-3 py-1.5 rounded border hover:opacity-70 transition-opacity"
                    style={{
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.bgActivity,
                      color: theme.colors.accent
                    }}
                  >
                    <ChevronDown className="w-3 h-3" />
                    Show all {lineCount} lines
                  </button>
                </div>
              ) : shouldCollapse && isExpanded ? (
                <div>
                  <div
                    className={`${isTerminal && log.source !== 'user' ? 'whitespace-pre-wrap text-sm font-mono overflow-x-auto' : 'whitespace-pre-wrap text-sm'}`}
                    style={{
                      maxHeight: '600px',
                      overflow: 'auto',
                      color: theme.colors.textMain
                    }}
                  >
                    {isTerminal && log.source !== 'user' ? (
                      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                    ) : (
                      processedText
                    )}
                  </div>
                  <button
                    onClick={() => toggleExpanded(log.id)}
                    className="flex items-center gap-2 mt-2 text-xs px-3 py-1.5 rounded border hover:opacity-70 transition-opacity"
                    style={{
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.bgActivity,
                      color: theme.colors.accent
                    }}
                  >
                    <ChevronUp className="w-3 h-3" />
                    Show less
                  </button>
                </div>
              ) : (
                <>
                  {isTerminal && log.source !== 'user' ? (
                    <div
                      className="whitespace-pre-wrap text-sm font-mono overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                      style={{ color: theme.colors.textMain }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm">{processedText}</div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
      {session.state === 'busy' && (
        <div className="flex items-center justify-center gap-2 text-xs opacity-50 animate-pulse py-4">
          <Activity className="w-4 h-4" />
          {session.inputMode === 'ai' ? 'Claude is thinking...' : 'Executing shell command...'}
        </div>
      )}
      <div ref={logsEndRef} />
    </div>
  );
});

TerminalOutput.displayName = 'TerminalOutput';
