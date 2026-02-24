import { ContractEvent, EventStream } from '../components/EventsPanel';
import { ethers } from 'ethers';
import { PublicKey, Connection } from '@solana/web3.js';

export interface EventStreamOptions {
  chain: 'evm' | 'solana';
  provider?: ethers.providers.Provider;
  connection?: Connection;
  contractAddress?: string;
  programId?: string;
}

export class EventStreamService implements EventStream {
  private subscriptions: Set<(ev: ContractEvent) => void> = new Set();
  private chain: 'evm' | 'solana';
  private provider?: ethers.providers.Provider;
  private connection?: Connection;
  private contractAddress?: string;
  private programId?: string;
  private listener?: any;

  constructor(options: EventStreamOptions) {
    this.chain = options.chain;
    this.provider = options.provider;
    this.connection = options.connection;
    this.contractAddress = options.contractAddress;
    this.programId = options.programId;
  }

  subscribe(cb: (ev: ContractEvent) => void) {
    this.subscriptions.add(cb);
    this.startListening();
    return {
      unsubscribe: () => {
        this.subscriptions.delete(cb);
        if (this.subscriptions.size === 0) {
          this.stopListening();
        }
      }
    };
  }

  private startListening() {
    if (this.listener) return;

    switch (this.chain) {
      case 'evm':
        this.startEVMListening();
        break;
      case 'solana':
        this.startSolanaListening();
        break;
    }
  }

  private stopListening() {
    if (this.listener) {
      this.listener.removeAllListeners();
      this.listener = undefined;
    }
  }

  private startEVMListening() {
    if (!this.provider || !this.contractAddress) return;

    // For demonstration, we'll simulate EVM events
    // In a real implementation, you'd use contract ABI and event filters
    this.listener = this.provider.on('block', (blockNumber: number) => {
      // Simulate Transfer event
      setTimeout(() => {
        if (this.subscriptions.size === 0) return;
        const ev: ContractEvent = {
          timestamp: Date.now(),
          eventName: 'Transfer',
          chain: 'evm',
          address: this.contractAddress,
          from: '0x1a2b3c4d5e6f7890',
          to: '0x9a8b7c6d5e4f3210',
          amount: '1000',
          txHash: `0x${blockNumber.toString(16).padStart(64, '0')}`
        };
        this.emitEvent(ev);
      }, 2000);

      // Simulate Approval event
      setTimeout(() => {
        if (this.subscriptions.size === 0) return;
        const ev: ContractEvent = {
          timestamp: Date.now(),
          eventName: 'Approval',
          chain: 'evm',
          address: this.contractAddress,
          owner: '0x1a2b3c4d5e6f7890',
          spender: '0x5e6f7a8b9c0d1e2f',
          amount: 'MAX',
          txHash: `0x${(blockNumber + 1).toString(16).padStart(64, '0')}`
        };
        this.emitEvent(ev);
      }, 3000);
    });
  }

  private startSolanaListening() {
    if (!this.connection || !this.programId) return;

    // For demonstration, we'll simulate Solana account changes
    // In a real implementation, you'd use program-derived addresses and account filters
    const accountPubkey = new PublicKey(this.programId);
    
    this.connection.onAccountChange(accountPubkey, (accountInfo: any) => {
      if (this.subscriptions.size === 0) return;
      
      const ev: ContractEvent = {
        timestamp: Date.now(),
        eventName: 'AccountChange',
        chain: 'solana',
        address: accountPubkey.toString(),
        data: accountInfo.data
      };
      
      this.emitEvent(ev);
    });

    // Also simulate transfer events
    setInterval(() => {
      if (this.subscriptions.size === 0) return;
      const ev: ContractEvent = {
        timestamp: Date.now(),
        eventName: 'Transfer',
        chain: 'solana',
        from: 'solana1...',
        to: 'solana2...',
        amount: '10',
        txHash: `tx_${Date.now()}`
      };
      this.emitEvent(ev);
    }, 5000);
  }

  private emitEvent(ev: ContractEvent) {
    this.subscriptions.forEach(cb => {
      try {
        cb(ev);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }
}

export function createEventStream(options: EventStreamOptions): EventStream {
  return new EventStreamService(options);
}

// Mock data for testing
export const mockEvents: ContractEvent[] = [
  {
    timestamp: Date.now() - 60000,
    eventName: 'Transfer',
    chain: 'evm',
    address: '0xContractAddress',
    from: '0xSender',
    to: '0xReceiver',
    amount: '1000',
    txHash: '0xTransactionHash'
  },
  {
    timestamp: Date.now() - 120000,
    eventName: 'Approval',
    chain: 'evm',
    address: '0xContractAddress',
    owner: '0xOwner',
    spender: '0xSpender',
    amount: 'MAX',
    txHash: '0xTransactionHash2'
  }
];