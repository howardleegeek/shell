export const EVM_WARNING_MIN = 20 * 1024
export const EVM_YELLOW_MAX = 24_576

export function hexByteLength(hexValue) {
  if (typeof hexValue !== 'string') {
    throw new TypeError('hexValue must be a string')
  }

  const clean = hexValue.trim().replace(/^0x/i, '')
  if (!clean) {
    return 0
  }

  return Math.ceil(clean.length / 2)
}

export function formatKilobytes(bytes) {
  return (bytes / 1024).toFixed(1)
}

export function formatMegabytes(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1)
}

export function classifyEvmContractSize(bytes) {
  if (bytes > EVM_YELLOW_MAX) {
    return 'red'
  }

  if (bytes >= EVM_WARNING_MIN) {
    return 'yellow'
  }

  return 'green'
}

export const computeHexByteLength = hexByteLength
export const getEvmSizeColor = classifyEvmContractSize

export default {
  EVM_WARNING_MIN,
  EVM_YELLOW_MAX,
  hexByteLength,
  formatKilobytes,
  formatMegabytes,
  classifyEvmContractSize,
  computeHexByteLength,
  getEvmSizeColor,
}
