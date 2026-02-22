// Minimal in-repo stand-in for nano-stores' atom primitive.
// This is a lightweight substitute to support the testing/demo surface
// for this kata. It implements a tiny reactive store with get/set/subscribe
// semantics enough for unit tests.

type Subscriber<T> = (value: T) => void

export function atom<T>(initial: T) {
  let value: T = initial
  const subscribers: Array<Subscriber<T>> = []

  const store = {
    get(): T {
      return value
    },
    set(v: T) {
      value = v
      for (const s of subscribers) s(value)
    },
    subscribe(cb: Subscriber<T>): () => void {
      subscribers.push(cb)
      // immediately notify new subscriber with current value
      cb(value)
      return () => {
        const idx = subscribers.indexOf(cb)
        if (idx >= 0) subscribers.splice(idx, 1)
      }
    },
  }

  // Provide a simple type-safe proxy for external usage
  return store as {
    get: () => T,
    set: (v: T) => void,
    subscribe: (cb: (value: T) => void) => () => void,
  } & typeof store
}
