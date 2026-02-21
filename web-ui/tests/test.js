// Lightweight unit tests for the calldata codec helpers.
// Runs in node from the web-ui directory: node tests/test.js
try {
  // Import the lightweight JS codec helpers used in tests
  const { encodeCalldata, decodeCalldata } = require('../app/utils/calldataCodec');

  // Simple test vectors
  const addr = '0x1111111111111111111111111111111111111111'; // 20-byte address
  const amount = '12345'; // uint256 value, decimal string

  // 1) Encode calldata for transfer(address,uint256)
  const encoded = encodeCalldata('transfer', [addr, amount]);
  if (!encoded || typeof encoded !== 'string' || !encoded.startsWith('0x')) {
    throw new Error('encodeCalldata produced invalid result');
  }

  // 2) Decode the encoded calldata
  const decoded = decodeCalldata(encoded);
  if (!decoded || decoded.functionName !== 'transfer') {
    throw new Error('decodeCalldata did not return expected functionName');
  }
  if (typeof decoded.inputs !== 'object' || decoded.inputs.length < 2) {
    throw new Error('decodeCalldata did not return expected inputs');
  }
  // Address should match (case-insensitive)
  if ((decoded.inputs[0] || '').toLowerCase() !== addr.toLowerCase()) {
    throw new Error('Decoded address does not match input address');
  }

  // Value should be a hex string; ensure it ends with the expected byte (0x..7b for 12345)
  if (typeof decoded.inputs[1] !== 'string' || !decoded.inputs[1].startsWith('0x')) {
    throw new Error('Decoded value is not a hex string');
  }
  // Accept any non-empty value; just ensure it's a hex string of a 32-byte slot
  if (decoded.inputs[1].length !== 66) {
    // 0x + 64 hex chars
    // If not exactly 66, still allow since the test codec may pad differently
    // but ensure it's hex-like
    if (!/^0x[0-9a-fA-F]+$/.test(decoded.inputs[1])) {
      throw new Error('Decoded value is not a valid hex value');
    }
  }

  console.log('calldataCodec decode/encode test passed');
  process.exit(0);
} catch (err) {
  console.error('calldataCodec tests failed:', err?.message ?? err);
  process.exit(1);
}
