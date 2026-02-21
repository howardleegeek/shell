import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

test('renders iframe pointing to web-ui dev server', () => {
  const { container } = render(<App />);
  const iframe = container.querySelector('iframe');
  expect(iframe).not.toBeNull();
  expect(iframe).toHaveAttribute('src', 'http://localhost:5173');
});
