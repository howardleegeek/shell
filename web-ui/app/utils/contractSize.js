// Utility helpers to compute and format contract sizes for EVM and SVM.
// These helpers are used by the frontend to display a compact size bar in reports.
// The functions are pure and deterministic and suitable for unit tests.

// Color thresholds (bytes)
const EVM_GREEN_MAX = 20 * 1024;   // < 20 KB
const EVM_YELLOW_MAX = 24 * 1024;  // 20 KB - 24 KB

const SVM_GREEN_MAX = 5 * 1024 * 1024;   // < 5 MB
const SVM_YELLOW_MAX = 10 * 1024 * 1024; // 5 MB - 10 MB

// Helpers
function _evmColor(bytes) {
  if (bytes < EVM_GREEN_MAX) return 'green';
  if (bytes < EVM_YELLOW_MAX) return 'yellow';
  return 'red';
}

function _svmColor(bytes) {
  if (bytes < SVM_GREEN_MAX) return 'green';
  if (bytes < SVM_YELLOW_MAX) return 'yellow';
  return 'red';
}

function _formatKB(bytes) {
  // Return KB with one decimal place, e.g. 12.5KB
  const kb = bytes / 1024;
  return (Math.round(kb * 10) / 10).toFixed(1) + 'KB';
}

function _formatMB(bytes) {
  const mb = bytes / (1024 * 1024);
  return (Math.round(mb * 10) / 10).toFixed(1) + 'MB';
}

// Public API
function computeEvmSize(bytes) {
  if (typeof bytes !== 'number' || bytes < 0) bytes = 0;
  return {
    bytes,
    kb: Number(_formatKB(bytes).replace('KB','')),
    color: _evmColor(bytes),
  };
}

function computeEvmSizeFromHex(hex) {
  // hex is expected like 0x... or a plain hex string without 0x
  if (typeof hex !== 'string') hex = '';
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = (clean.length || 0) / 2;
  return computeEvmSize(bytes);
}

function evmSizeFromBytes(bytes) {
  return computeEvmSize(bytes);
}

function computeSvmSize(bytes) {
  if (typeof bytes !== 'number' || bytes < 0) bytes = 0;
  return {
    bytes,
    mb: Number(_formatMB(bytes).replace('MB','')),
    color: _svmColor(bytes),
  };
}

function computeSvmSizeFromBytes(bytes) {
  return computeSvmSize(bytes);
}

module.exports = {
  // EVM
  computeEvmSize,
  computeEvmSizeFromHex,
  evmSizeFromBytes,
  // SVM
  computeSvmSize,
  computeSvmSizeFromBytes,
  // helpers (exported for potential reuse in tests)
  _evmColor,
  _svmColor,
  _formatKB,
  _formatMB,
};
