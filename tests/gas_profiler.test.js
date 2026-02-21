const { parseGasReport } = require('../web-ui/app/lib/gasProfiler.js');

try {
  const text = `Function: transfer(min)  min: 340  avg: 420  max: 580  calls: 10\nFunction: approve(min)  min: 260  avg: 270  max: 300  calls: 5`;
  const rows = parseGasReport(text);
  if (!Array.isArray(rows) || rows.length !== 2) throw new Error('parse result invalid');
  if (rows[0].name !== 'transfer(min)' || rows[0].min !== 340 || rows[0].avg !== 420) throw new Error('unexpected first row');
  console.log('gas_profiler.test: ok');
  process.exit(0);
} catch (e) {
  console.error('gas_profiler.test: failed', e);
  process.exit(1);
}
