import React from 'react';
import GasProfilerPanel from './gas-profiler';

// Lightweight mock data for the gas profiler panel.
const mockReport = `Function: transfer(address,uint256) min: 10 avg: 20 max: 40 calls: 120
Function: approve(address,uint256) min: 5 avg: 12 max: 30 calls: 80
Function: mint(address,uint256) min: 8 avg: 18 max: 25 calls: 60`;

export const GasPanelMock: React.FC = () => {
  return (
    <div style={{ padding: 16 }}>
      <GasProfilerPanel reportText={mockReport} />
    </div>
  );
};

export default GasPanelMock;
