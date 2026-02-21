import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import NatSpecGenerator from './NatSpecGenerator';

type MockEditor = {
  getValue: () => string;
  executeEdits?: jest.Mock;
  applyEdits?: jest.Mock;
};

describe('NatSpecGenerator', () => {
  test('inserts Solidity NatSpec blocks above functions using Monaco API', async () => {
    const code = `pragma solidity ^0.8.0;
contract C {
  function foo(uint x) public returns (uint) { return x; }
}`;
    const editor: MockEditor = {
      getValue: () => code,
      executeEdits: jest.fn(),
    };
    const mockAI = {
      generateDocs: jest.fn(async (_lang: any, _code: string, _file: string) => [
        { line: 3, comment: '@title Foo' },
        { line: 4, comment: '@param x The input' },
      ]),
    };

    render(
      <NatSpecGenerator editor={editor} fileName={'contracts/My.sol'} aiClient={mockAI} />
    );

    // Click Generate Docs
    const btn = screen.getByText('Generate Docs');
    fireEvent.click(btn);

    // Expect editor.executeEdits to have been called with two edits
    expect(editor.executeEdits).toHaveBeenCalled();
  });
});
