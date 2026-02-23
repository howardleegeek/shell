// ES Module shim: re-export from the TypeScript parser implementation.
// This keeps test imports in ESModule style while sharing the logic with TS sources.
export { parseGasReport, parseComputeReport, colorForGas, generateAiSuggestions, formatNumber } from './gas-report-parser.ts';
