import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalldataCodec from './CalldataCodec';

// Mock ethers Interface for testing
jest.mock('ethers', () => {
  return {
    Interface: class {
      constructor(_abi: any) {
        // store for potential inspection if needed
        this.abi = _abi;
      }
      decodeFunctionData(fragment: string, data: string) {
        // Simulate decode success for most inputs, but fail for specific selector to test 4byte lookup
        const low = (data || '').toLowerCase();
        if (low.startsWith('0xdead')) {
          return undefined;
        }
        // return a deterministic object for testing
        return { functionFragment: fragment, data, args: ['0xDEAD', '123'] };
      }
      encodeFunctionData(fragment: string, args: any[]) {
        return `0xENCODED:${fragment}:${JSON.stringify(args ?? [])}`;
      }
    },
  };
});

describe('CalldataCodec', () => {
  const abi = [
    {
      type: 'function',
      name: 'transfer',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
    },
  ];

  test('Decode tab: decodes calldata using ABI when available', async () => {
    render(<CalldataCodec abi={abi as any} />);

    // Switch to Decode tab (default is decode)
    const area = screen.getByTestId('decode-input') as HTMLTextAreaElement;
    fireEvent.change(area, { target: { value: '0x1234abcd' } });

    // Wait for output to appear and contain fragment signature
    const output = await screen.findByTestId('decode-output');
    expect(output.textContent).toContain('transfer(address,uint256)');
  });

  test('Decode tab: 4byte.directory lookup when ABI decode fails', async () => {
    // Prepare fetch mock before rendering so async lookup can use it
    (global as any).fetch = jest.fn().mockResolvedValue({
      json: async () => ({ results: [{ text_signature: 'doSomething(uint256)' }] }),
    });
    // Provide same ABI, but input that triggers ABI decode failure in mock
    render(<CalldataCodec abi={abi as any} />);

    // Switch to Decode tab (default is decode) and input a selector starting with 0xdead to trigger 4byte lookup
    const area = screen.getByTestId('decode-input') as HTMLTextAreaElement;
    fireEvent.change(area, { target: { value: '0xdeadbeefdeadbeef' } });


    // Wait for output to include 4byte signature
    const output = await screen.findByTestId('decode-output');
    await waitFor(() => expect(output.textContent).toContain('4byte: doSomething(uint256)'));
  });

  test('Encode tab: encodes calldata using ABI when available', async () => {
    render(<CalldataCodec abi={abi as any} />);

    // Switch to Encode tab
    const tabBtn = screen.getByTestId('tab-encode');
    fireEvent.click(tabBtn);

    // Select function (index 0 by default)
    const fnSelect = screen.getByTestId('encode-fn-select') as HTMLSelectElement;
    // ensure the value is set to 0
    expect(fnSelect.value).toBe('0');

    // Fill arguments for address and uint256
    const arg0 = screen.getByTestId('arg-0') as HTMLInputElement;
    const arg1 = screen.getByTestId('arg-1') as HTMLInputElement;
    fireEvent.change(arg0, { target: { value: '0xAbC1230000000000000000000000000000000000' } });
    fireEvent.change(arg1, { target: { value: '1000' } });

    // Output should be set by mock Interface
    const out = await screen.findByTestId('encode-output');
    expect(out.textContent).toContain('0xENCODED:transfer');
  });
});
