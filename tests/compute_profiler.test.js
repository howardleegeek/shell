const { parseComputeReport } = require('../web-ui/app/lib/gasProfiler.js');

try {
  const text = 'Instruction: ADD  compute: 123\nInstruction: MUL  compute: 456';
  const items = parseComputeReport(text);
  if (!Array.isArray(items) || items.length !== 2) throw new Error('parse result invalid');
  if (items[0].instruction !== 'ADD' || items[0].compute !== 123) throw new Error('unexpected first item');
  console.log('compute_profiler.test: ok');
  process.exit(0);
} catch (e) {
  console.error('compute_profiler.test: failed', e);
  process.exit(1);
}
