import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MigrationWizard from '../components/MigrationWizard';

describe('MigrationWizard', () => {
  test('renders and generates Solidity -> Rust skeleton', () => {
    render(<MigrationWizard />);

    // Source chain select
    const src = screen.getByLabelText(/Source Chain/i) as HTMLSelectElement;
    expect(src).toBeInTheDocument();
    // Ensure default is Solidity
    expect(src.value).toBe('solidity');

    // Target chain select
    const dst = screen.getByLabelText(/Target Chain/i) as HTMLSelectElement;
    expect(dst).toBeInTheDocument();
    fireEvent.change(src, { target: { value: 'solidity' } });
    // change to a different target
    fireEvent.change(dst, { target: { value: 'solidity-to-rust' } });
    expect(dst.value).toBe('solidity-to-rust');

    // Contract code input
    const textarea = screen.getByLabelText(/Contract Code/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'contract Foo { function bar() public {} }' } });
    expect(textarea.value).toBe('contract Foo { function bar() public {} }');

    // Generate skeleton
    const btn = screen.getByRole('button', { name: /Generate Skeleton/i });
    fireEvent.click(btn);

    // Skeleton should appear and mention Rust/Anchor skeleton
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton.textContent).toContain('Rust/Anchor');
  });
});
