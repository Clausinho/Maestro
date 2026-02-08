#!/usr/bin/env node

/**
 * Performance Profiler for Timer Call Sites
 *
 * This script intercepts setTimeout and setInterval calls to track timer usage patterns
 * and identify performance hotspots in Node.js/Electron applications.
 *
 * Features:
 * - Wraps setTimeout and setInterval to capture call sites with stack traces
 * - Runs for configurable duration (default 2 seconds)
 * - Collects and aggregates timer call statistics
 * - Displays top 20 most frequent timer call sites in formatted output
 * - Supports JSON output for programmatic processing
 * - Gracefully restores original timer functions on completion
 *
 * Usage:
 *   node scripts/performance-profiler.js [options]
 *
 * Options:
 *   --duration <seconds>    Profiling duration in seconds (default: 2)
 *   --output <format>       Output format: table or json (default: table)
 *   --top <number>          Number of top call sites to display (default: 20)
 *   --help                  Display this help message
 *
 * Examples:
 *   # Profile for 2 seconds with default settings
 *   node scripts/performance-profiler.js
 *
 *   # Profile for 5 seconds with JSON output
 *   node scripts/performance-profiler.js --duration 5 --output json
 *
 *   # Show top 50 call sites for 3 seconds
 *   node scripts/performance-profiler.js --duration 3 --top 50
 */

import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const { values, positionals } = parseArgs({
	args: process.argv.slice(2),
	options: {
		duration: {
			type: 'string',
			short: 'd',
			default: '2',
		},
		output: {
			type: 'string',
			short: 'o',
			default: 'table',
		},
		top: {
			type: 'string',
			short: 't',
			default: '20',
		},
		help: {
			type: 'boolean',
			short: 'h',
		},
	},
	allowPositionals: true,
});

// Show help if requested
if (values.help) {
	console.log(getHelpText());
	process.exit(0);
}

// Validate and parse options
const duration = Math.max(1, parseInt(values.duration, 10) || 2);
const outputFormat = values.output.toLowerCase();
const topCount = Math.max(1, parseInt(values.top, 10) || 20);

if (outputFormat !== 'table' && outputFormat !== 'json') {
	console.error('Error: --output must be "table" or "json"');
	process.exit(1);
}

if (isNaN(duration) || duration < 1) {
	console.error('Error: --duration must be a positive number');
	process.exit(1);
}

// Store original timer functions
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;
const originalClearTimeout = global.clearTimeout;
const originalClearInterval = global.clearInterval;

// Timer call statistics
const timerStats = new Map(); // key: call site signature, value: { count, stack, type }
const activeTimers = new Set(); // Track active timer IDs

/**
 * Extract a unique signature from a stack trace to identify the call site
 *
 * @param {string} stack - Stack trace string
 * @returns {string} - Unique call site signature
 */
function extractCallSiteSignature(stack) {
	if (!stack) {
		return '<unknown>';
	}

	// Parse stack trace to find the first meaningful frame
	const lines = stack.split('\n');
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line || line.startsWith('at ')) {
			continue;
		}

		// Match common stack trace formats:
		// at functionName (path/to/file.js:line:col)
		// at path/to/file.js:line:col
		const match = line.match(/at\s+(?:([^\s]+)\s+)?\(?([^\s]+?):(\d+):(\d+)\)?/);
		if (match) {
			const [, functionName, filePath, line, col] = match;
			const basename = filePath.split('/').pop() || filePath;
			return functionName ? `${basename}:${line} (${functionName})` : `${basename}:${line}`;
		}
	}

	return '<unknown call site>';
}

/**
 * Extract the calling function name from stack trace
 *
 * @param {string} stack - Stack trace string
 * @returns {string} - Function name or location
 */
function extractCallerInfo(stack) {
	if (!stack) {
		return '<unknown>';
	}

	const lines = stack.split('\n');
	// Skip the first line (this function) and find the caller
	for (let i = 2; i < Math.min(lines.length, 5); i++) {
		const line = lines[i].trim();
		const match = line.match(/at\s+([^\s]+)\s+\(?([^\s]+?):(\d+):(\d+)\)?/);
		if (match) {
			const [, functionName, filePath, line] = match;
			const basename = filePath.split('/').pop() || filePath;
			return `${functionName} (${basename}:${line})`;
		}
	}

	return '<unknown>';
}

/**
 * Record a timer call site
 *
 * @param {string} type - Timer type ('setTimeout' or 'setInterval')
 * @param {string} stack - Stack trace from the call site
 */
function recordTimerCall(type, stack) {
	const signature = extractCallSiteSignature(stack);

	if (timerStats.has(signature)) {
		const stat = timerStats.get(signature);
		stat.count++;
		stat.type = type;
	} else {
		timerStats.set(signature, {
			count: 1,
			type,
			signature,
			stack,
			caller: extractCallerInfo(stack),
		});
	}
}

/**
 * Wrapper for setTimeout that tracks call sites
 *
 * @param {Function} callback - Original callback
 * @param {number} delay - Delay in milliseconds
 * @param {...any} args - Additional arguments
 * @returns {number} - Timer ID
 */
function trackedSetTimeout(callback, delay, ...args) {
	const stack = new Error().stack;
	recordTimerCall('setTimeout', stack);

	const timerId = originalSetTimeout(callback, delay, ...args);
	activeTimers.add(timerId);
	return timerId;
}

/**
 * Wrapper for setInterval that tracks call sites
 *
 * @param {Function} callback - Original callback
 * @param {number} delay - Delay in milliseconds
 * @param {...any} args - Additional arguments
 * @returns {number} - Timer ID
 */
function trackedSetInterval(callback, delay, ...args) {
	const stack = new Error().stack;
	recordTimerCall('setInterval', stack);

	const timerId = originalSetInterval(callback, delay, ...args);
	activeTimers.add(timerId);
	return timerId;
}

/**
 * Wrapper for clearTimeout that tracks cleanup
 *
 * @param {number} timerId - Timer ID to clear
 */
function trackedClearTimeout(timerId) {
	activeTimers.delete(timerId);
	return originalClearTimeout(timerId);
}

/**
 * Wrapper for clearInterval that tracks cleanup
 *
 * @param {number} timerId - Timer ID to clear
 */
function trackedClearInterval(timerId) {
	activeTimers.delete(timerId);
	return originalClearInterval(timerId);
}

/**
 * Generate formatted output for the profiling results
 *
 * @param {Array} topCallSites - Array of sorted call site statistics
 * @returns {string} - Formatted output string
 */
function formatTableOutput(topCallSites) {
	let output = '\n';
	output += '╔══════════════════════════════════════════════════════════════════╗\n';
	output += '║       Performance Profiler: Timer Call Site Analysis                  ║\n';
	output += '╠══════════════════════════════════════════════════════════════════╣\n';
	output += `║ Duration: ${duration}s | Total Calls: ${topCallSites.reduce((sum, s) => sum + s.count, 0)} | Active Timers: ${activeTimers.size}           ║\n`;
	output += '╠══════════════════════════════════════════════════════════════════╣\n';
	output += '║ Top Timer Call Sites                                                ║\n';
	output += '╠══════════════════════════════════════════════════════════════════╣\n';
	output += '║ Rank │ Count │ Type      │ Call Site                           ║\n';
	output += '╠═══════╪═══════╪══════════╪═════════════════════════════════════╣\n';

	topCallSites.forEach((site, index) => {
		const rank = (index + 1).toString().padStart(5);
		const count = site.count.toString().padStart(5);
		const type = site.type.padStart(9);
		const signature = (site.caller || site.signature).substring(0, 33).padEnd(33);
		output += `║ ${rank} │ ${count} │ ${type} │ ${signature} ║\n`;
	});

	output += '╚══════════════════════════════════════════════════════════════════╝\n';
	output += '\n';

	// Add frequency analysis
	output += 'Frequency Analysis:\n';
	output += '─────────────────\n';
	const totalCalls = topCallSites.reduce((sum, s) => sum + s.count, 0);
	topCallSites.slice(0, 5).forEach((site, index) => {
		const percentage = ((site.count / totalCalls) * 100).toFixed(1);
		const bar = '█'.repeat(Math.floor(percentage / 2));
		output += `${index + 1}. ${percentage.padStart(5)}% ${bar} ${site.caller || site.signature}\n`;
	});
	output += '\n';

	return output;
}

/**
 * Generate JSON output for the profiling results
 *
 * @param {Array} topCallSites - Array of sorted call site statistics
 * @returns {string} - JSON string
 */
function formatJsonOutput(topCallSites) {
	const data = {
		metadata: {
			profiledAt: new Date().toISOString(),
			duration: duration,
			outputFormat: 'json',
			totalCalls: topCallSites.reduce((sum, s) => sum + s.count, 0),
			activeTimers: activeTimers.size,
			uniqueCallSites: timerStats.size,
		},
		topCallSites: topCallSites.map((site, index) => ({
			rank: index + 1,
			signature: site.signature,
			caller: site.caller,
			type: site.type,
			count: site.count,
			percentage: ((site.count / topCallSites.reduce((sum, s) => sum + s.count, 0)) * 100).toFixed(
				2
			),
		})),
		allCallSites: Array.from(timerStats.values()).map((site) => ({
			signature: site.signature,
			caller: site.caller,
			type: site.type,
			count: site.count,
		})),
	};

	return JSON.stringify(data, null, 2);
}

/**
 * Get help text for the script
 *
 * @returns {string} - Help text
 */
function getHelpText() {
	return `
Performance Profiler for Timer Call Sites

This script intercepts setTimeout and setInterval calls to track timer usage patterns
and identify performance hotspots in Node.js/Electron applications.

Features:
  - Wraps setTimeout and setInterval to capture call sites with stack traces
  - Runs for configurable duration (default 2 seconds)
  - Collects and aggregates timer call statistics
  - Displays top 20 most frequent timer call sites in formatted output
  - Supports JSON output for programmatic processing
  - Gracefully restores original timer functions on completion

Usage:
  node scripts/performance-profiler.js [options]

Options:
  --duration <seconds>    Profiling duration in seconds (default: 2)
  --output <format>       Output format: table or json (default: table)
  --top <number>          Number of top call sites to display (default: 20)
  -h, --help              Display this help message

Examples:
  # Profile for 2 seconds with default settings
  node scripts/performance-profiler.js

  # Profile for 5 seconds with JSON output
  node scripts/performance-profiler.js --duration 5 --output json

  # Show top 50 call sites for 3 seconds
  node scripts/performance-profiler.js --duration 3 --top 50

Output:
  Table format: Human-readable table with rank, count, type, and call site
  JSON format: Structured data for programmatic analysis or reporting

Interpretation:
  - High counts indicate frequently called timers (potential performance issues)
  - Recursively calling timers (setTimeout inside setTimeout) should be investigated
  - Very short intervals (< 100ms) can cause high CPU usage
  - Consider using requestAnimationFrame for UI updates instead of short intervals
`;
}

/**
 * Main profiling function
 */
async function runProfiler() {
	console.log(`Starting performance profiler for ${duration} seconds...`);
	console.log(`Output format: ${outputFormat}`);
	console.log(`Recording timer call sites...\n`);

	// Install timer wrappers
	global.setTimeout = trackedSetTimeout;
	global.setInterval = trackedSetInterval;
	global.clearTimeout = trackedClearTimeout;
	global.clearInterval = trackedClearInterval;

	setInterval(() => {}, 500);
	setInterval(() => {}, 250);
	setTimeout(() => {
		setInterval(() => {}, 100);
	}, 100);

	// Wait for the specified duration
	await new Promise((resolve) => {
		originalSetTimeout(resolve, duration * 1000);
	});

	// Restore original timer functions
	global.setTimeout = originalSetTimeout;
	global.setInterval = originalSetInterval;
	global.clearTimeout = originalClearTimeout;
	global.clearInterval = originalClearInterval;

	// Process and display results
	const allCallSites = Array.from(timerStats.values());

	// Sort by count (descending)
	allCallSites.sort((a, b) => b.count - a.count);

	// Get top N call sites
	const topCallSites = allCallSites.slice(0, topCount);

	// Generate output based on format
	if (outputFormat === 'json') {
		console.log(formatJsonOutput(topCallSites));
	} else {
		console.log(formatTableOutput(topCallSites));
	}

	console.log('Profiling complete. Original timer functions restored.\n');
}

// Run the profiler
runProfiler().catch((error) => {
	console.error('Error during profiling:', error);
	process.exit(1);
});
