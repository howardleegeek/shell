"use strict";

// Lightweight OpenCrabs-like status machine for Auto-Repair workflow
// This is a small, dependency-free FSM to illustrate integration with
// build/test/audit stages. It is intentionally minimal and deterministic
// for testability in this kata.

class OpenCrabs {
  constructor() {
    this.state = 'IDLE';
  }

  getState() {
    return this.state;
  }

  // Apply a progress event and update the state accordingly.
  // Event shape: { type: 'BUILD_OK'|'BUILD_FAIL'|'TEST_OK'|'TEST_FAIL'|'AUDIT_OK'|'AUDIT_FAIL'|'FIXED', nextState?: string }
  transition(event) {
    if (!event || !event.type) return this.state;

    switch (this.state) {
      case 'IDLE':
        if (event.type === 'BUILD_OK') this.state = 'BUILD_OK';
        else if (event.type === 'BUILD_FAIL') this.state = 'REPAIRING';
        break;
      case 'BUILD_OK':
        if (event.type === 'TEST_OK') this.state = 'TEST_OK';
        if (event.type === 'BUILD_FAIL') this.state = 'REPAIRING';
        if (event.type === 'BUILD_FAIL') this.state = 'REPAIRING';
        break;
      case 'TEST_OK':
        if (event.type === 'AUDIT_OK') this.state = 'READY';
        if (event.type === 'TEST_FAIL') this.state = 'REPAIRING';
        if (event.type === 'AUDIT_FAIL') this.state = 'REPAIRING';
        break;
      case 'AUDIT_OK':
        if (event.type === 'READY' || event.type === 'AUDIT_FAIL') this.state = 'REPAIRING';
        break;
      case 'REPAIRING':
        // After a repair attempt, the caller can signal the next desired state.
        // Use explicit nextState if provided.
        if (event.nextState) this.state = event.nextState;
        break;
      case 'READY':
        // Terminal success state; allow regressions if a new failure occurs
        if (event.type === 'BUILD_FAIL' || event.type === 'TEST_FAIL' || event.type === 'AUDIT_FAIL') {
          this.state = 'REPAIRING';
        }
        break;
      default:
        // Unknown state; stay idle
        this.state = 'IDLE';
    }
    return this.state;
  }
}

module.exports = {
  OpenCrabs,
};
