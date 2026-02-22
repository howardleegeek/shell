import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

test('renders iframe pointing to web-ui UI (dev or prod)', () => {
  const { container } = render(<App />);
  const iframe = container.querySelector('iframe');
  expect(iframe).not.toBeNull();
  const src = iframe?.getAttribute('src');
  expect(src).toBeTruthy();
  // Accept both dev server in development or local index.html in production
  expect([ 'http://localhost:5173', './index.html' ].includes(src!)).toBe(true);
});
