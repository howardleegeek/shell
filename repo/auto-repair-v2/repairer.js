// Lightweight repair helper (stub)
// Exports a function to generate a basic patch descriptor.
"use strict";
function createPatch(context) {
  return {
    type: context && context.type ? context.type : 'unknown',
    description: 'Auto-generated patch (stub)',
    context: context || {}
  };
}
module.exports = { createPatch };
