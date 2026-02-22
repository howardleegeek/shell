// Simple in-process event stream to simulate real-time contract events
// in tests and during development without external dependencies.
export type ContractEvent = {
  timestamp: number
  name: string
  params: Record<string, any>
  txHash: string
  source?: 'EVM' | 'SVM'
}

type Subscriber = (e: ContractEvent) => void

class EventStreamClass {
  private subscribers = new Set<Subscriber>()

  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb)
    return () => this.subscribers.delete(cb)
  }

  // For testing and local dev: emit a new event to all subscribers
  emit(e: ContractEvent) {
    for (const cb of this.subscribers) cb(e)
  }
}

export const EventStream = new EventStreamClass()
