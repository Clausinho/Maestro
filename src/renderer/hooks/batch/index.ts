/**
 * Batch processing modules
 * Extracted from useBatchProcessor.ts for modularity
 */

// Utility functions for markdown task processing
export { countUnfinishedTasks, countCheckedTasks, uncheckAllTasks } from './batchUtils';

// Debounce hook for per-session state updates
export { useSessionDebounce } from './useSessionDebounce';
export type { UseSessionDebounceOptions, UseSessionDebounceReturn } from './useSessionDebounce';
