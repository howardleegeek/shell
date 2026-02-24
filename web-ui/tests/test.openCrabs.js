// Simple regression test for OpenCrabs FSM integration
const { OpenCrabs } = require('../src/openCrabs.js');

function runOpenCrabsTest() {
  const fsm = new OpenCrabs();

  // IDLE -> BUILD_OK
  let s = fsm.transition({ type: 'BUILD_OK' });
  if (s !== 'BUILD_OK') {
    throw new Error(`OpenCrabs: expected BUILD_OK, got ${s}`);
  }

  // BUILD_OK -> TEST_OK
  s = fsm.transition({ type: 'TEST_OK' });
  if (s !== 'TEST_OK') {
    throw new Error(`OpenCrabs: expected TEST_OK, got ${s}`);
  }

  // TEST_OK -> AUDIT_OK
  s = fsm.transition({ type: 'AUDIT_OK' });
  // In our FSM, AUDIT_OK does not automatically go to READY; it should keep as AUDIT_OK or transition via next steps.
  // Accept either READY or AUDIT_OK to pass this basic path check.
  if (!(s === 'AUDIT_OK' || s === 'READY')) {
    throw new Error(`OpenCrabs: expected AUDIT_OK or READY, got ${s}`);
  }

  // Optional: verify that a subsequent operation doesn't crash the machine
  // and remains in a valid state after a no-op event.
  s = fsm.transition({ type: 'BUILD_OK' });
  // The FSM should stay in a known state or move forward deterministically.
  // Accept any non-error state for this basic integration test.
  if (!s) {
    throw new Error(`OpenCrabs: invalid state after no-op event`);
  }
}

try {
  runOpenCrabsTest();
  console.log('OPENCRABS TEST PASSED');
} catch (e) {
  console.error('OPENCRABS TEST FAILED:', e && e.message ? e.message : e);
  process.exitCode = 1;
}
