import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TemplateGallery from '../src/components/TemplateGallery';

type TemplateItem = {
  id: string; name: string; description: string; chain: 'SVM'|'EVM'; category: string; icon: string; promptTemplate: string;
};

const mockTemplates: TemplateItem[] = [
  { id: 'a', name: 'Test A', description: 'desc', chain: 'SVM', category: 'Token', icon: '🪙', promptTemplate: 'prompt A' },
  { id: 'b', name: 'Test B', description: 'desc', chain: 'SVM', category: 'Token', icon: '🪙', promptTemplate: 'prompt B' },
];

let mockPush: jest.Mock;
jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('TemplateGallery', () => {
  beforeEach(() => {
    mockPush = jest.fn();
  });

  it('renders provided templates and handles Use action', () => {
    const { container } = render(<TemplateGallery templates={mockTemplates} />);
    // Should render names
    expect(container.textContent).toContain('Test A');
    expect(container.textContent).toContain('Test B');
    // Click the first Use button
    const uses = screen.getAllByText('Use');
    expect(uses.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(uses[0]);
    // Ensure navigation attempted with the first template prompt
    expect(mockPush).toHaveBeenCalledWith('/ai-chat?prompt=' + encodeURIComponent('prompt A'));
  });
});
