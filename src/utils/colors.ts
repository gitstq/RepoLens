// Terminal color utility functions
// Provides ANSI color codes for CLI output

/** Whether color output is enabled */
let colorEnabled = true;

/**
 * Enable or disable color output
 */
export function setColorEnabled(enabled: boolean): void {
  colorEnabled = enabled;
}

/**
 * Check if color output is currently enabled
 */
export function isColorEnabled(): boolean {
  return colorEnabled;
}

// ANSI color code definitions
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
} as const;

/**
 * Wrap text with a color code
 */
function colorize(text: string, color: string): string {
  if (!colorEnabled) return text;
  return `${color}${text}${COLORS.reset}`;
}

// Exported color functions
export const c = {
  reset: (text: string) => colorize(text, COLORS.reset),
  bold: (text: string) => colorize(text, COLORS.bold),
  dim: (text: string) => colorize(text, COLORS.dim),
  underline: (text: string) => colorize(text, COLORS.underline),

  black: (text: string) => colorize(text, COLORS.black),
  red: (text: string) => colorize(text, COLORS.red),
  green: (text: string) => colorize(text, COLORS.green),
  yellow: (text: string) => colorize(text, COLORS.yellow),
  blue: (text: string) => colorize(text, COLORS.blue),
  magenta: (text: string) => colorize(text, COLORS.magenta),
  cyan: (text: string) => colorize(text, COLORS.cyan),
  white: (text: string) => colorize(text, COLORS.white),
  gray: (text: string) => colorize(text, COLORS.gray),

  bgBlack: (text: string) => colorize(text, COLORS.bgBlack),
  bgRed: (text: string) => colorize(text, COLORS.bgRed),
  bgGreen: (text: string) => colorize(text, COLORS.bgGreen),
  bgYellow: (text: string) => colorize(text, COLORS.bgYellow),
  bgBlue: (text: string) => colorize(text, COLORS.bgBlue),
  bgMagenta: (text: string) => colorize(text, COLORS.bgMagenta),
  bgCyan: (text: string) => colorize(text, COLORS.bgCyan),
  bgWhite: (text: string) => colorize(text, COLORS.bgWhite),
};

/**
 * Get color for a health grade
 */
export function gradeColor(grade: string): (text: string) => string {
  switch (grade) {
    case 'A': return c.green;
    case 'B': return c.blue;
    case 'C': return c.yellow;
    case 'D': return c.red;
    default: return c.white;
  }
}

/**
 * Get color for a score value (0-100)
 */
export function scoreColor(score: number): (text: string) => string {
  if (score >= 90) return c.green;
  if (score >= 75) return c.blue;
  if (score >= 60) return c.yellow;
  return c.red;
}

/**
 * Create a visual progress bar in the terminal
 */
export function progressBar(value: number, max: number, width: number = 30): string {
  const ratio = Math.min(value / max, 1);
  const filled = Math.round(ratio * width);
  const empty = width - filled;

  const filledChar = colorEnabled ? '\u2588' : '#';
  const emptyChar = colorEnabled ? '\u2591' : '-';

  let bar = '';
  if (ratio >= 0.75) {
    bar = c.green(filledChar.repeat(filled));
  } else if (ratio >= 0.5) {
    bar = c.yellow(filledChar.repeat(filled));
  } else {
    bar = c.red(filledChar.repeat(filled));
  }

  bar += c.dim(emptyChar.repeat(empty));
  return bar;
}

/**
 * Create a colored score badge
 */
export function scoreBadge(score: number): string {
  const text = String(score).padStart(3);
  const colorFn = scoreColor(score);
  return colorFn(c.bold(` ${text} `));
}

/**
 * Strip all ANSI color codes from a string
 */
export function stripColors(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Print a section header
 */
export function sectionHeader(title: string): string {
  const line = '\u2500'.repeat(60);
  return `\n${c.cyan(c.bold(`\u250C${line}\u2510`))}\n` +
         `${c.cyan(c.bold('\u2503'))} ${c.bold(c.white(title))}\n` +
         `${c.cyan(c.bold(`\u2514${line}\u2518`))}`;
}

/**
 * Print a step indicator
 */
export function step(stepNum: number, total: number, description: string): string {
  const progress = `[${stepNum}/${total}]`;
  return `${c.cyan(c.bold(progress))} ${c.white(description)}`;
}
