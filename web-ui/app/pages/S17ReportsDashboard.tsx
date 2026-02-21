import React from 'react';
import ContractSizeBar from '../components/workbench/ContractSizeBar';
import {
  computeEvmSizeFromHex,
} from '../utils/contractSize';

// Simple build report dashboard mock for S17 Reports
export const S17ReportsDashboard: React.FC = () => {
  // Mock build data to demonstrate integration
  const evmContracts = [
    { name: 'ContractA', deployedBytecode: '0x' + 'aa'.repeat(1024) }, // ~1024 bytes
    { name: 'ContractB', deployedBytecode: '0x' + 'bb'.repeat(5000) }, // ~5000 bytes
  ];

  const svmContracts = [
    { name: 'SvmModule', soSizeBytes: 2 * 1024 * 1024 }, // 2 MB
    { name: 'AuxModule', soSizeBytes: 7 * 1024 * 1024 }, // 7 MB
  ];

  // Ensure at least one EVM/SVM entry exists to render something meaningful
  return (
    <div style={{ padding: 16 }}>
      <h2>Build Report (S17 Dashboard)</h2>
      <ContractSizeBar evmContracts={evmContracts} svmContracts={svmContracts} />
    </div>
  );
};

export default S17ReportsDashboard;
