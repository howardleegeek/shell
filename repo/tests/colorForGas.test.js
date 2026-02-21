const { colorForGas } = require('../web-ui/app/lib/gasProfiler.js');

describe('colorForGas', () => {
  test('returns green color for low gas', () => {
    const c = colorForGas(0);
    expect(c).toMatch(/^rgb\(0,\s*255,\s*0\)$/i);
  });

  test('returns red shade for high gas', () => {
    const c = colorForGas(100000);
    // Expect red-dominant color at the high end of the reference scale
    expect(c).toMatch(/^rgb\(255,\s*0,\s*0\)$/i);
  });
});
