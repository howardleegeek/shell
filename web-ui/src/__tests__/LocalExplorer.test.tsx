import React from 'react';
import { render, screen } from '@testing-library/react';
import LocalExplorer from '../components/LocalExplorer';

test('renders Local Explorer UI', () => {
  render(<LocalExplorer />);
  // Core sections should be present
  expect(screen.getByText(/Local Explorer/i)).toBeInTheDocument();
  expect(screen.getByText(/Recent Transactions/i)).toBeInTheDocument();
  expect(screen.getByText(/Accounts/i)).toBeInTheDocument();
});
