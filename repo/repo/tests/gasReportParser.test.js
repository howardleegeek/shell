'use strict';

const { parseGasReport, parseComputeReport, colorForGas, generateAiSuggestions } = require('../web-ui/app/lib/gasReportParser.js');

describe('gasReportParser', () => {
  test('colorForGas should produce green for low avg', () => {
    const c = colorForGas(0);
    expect(c).toMatch(/^rgb\(0,\s*255,\s*0\)$/i);
  });

  test('parseGasReport parses simple lines', () => {
    const text = 'Function: transfer(min)  min: 340  avg: 420  max: 580  calls: 10\nFunction: approve(min)   min: 260  avg: 270  max: 300  calls: 5';
    const res = parseGasReport(text);
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(2);
    expect(res[0]).toHaveProperty('name');
    expect(res[0]).toHaveProperty('min');
  });
});
