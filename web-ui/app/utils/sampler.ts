export type Sampler<TArgs extends unknown[]> = ((...args: TArgs) => void) & {
  dispose: () => void;
};

function forwardErrorToGlobal(error: unknown) {
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  const candidate = globalThis as typeof globalThis & {
    reportError?: (error: unknown) => void;
  };

  if (typeof candidate.reportError === 'function') {
    candidate.reportError(normalizedError);
    return;
  }

  setTimeout(() => {
    throw normalizedError;
  }, 0);
}

export function createSampler<TThis, TArgs extends unknown[]>(
  fn: (this: TThis, ...args: TArgs) => void,
  wait: number,
  context?: TThis,
): Sampler<TArgs> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  const sampler = function sampler(this: TThis, ...args: TArgs) {
    if (disposed) {
      return;
    }

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    const callContext = (context ?? this) as TThis;

    timeoutId = setTimeout(() => {
      timeoutId = null;

      if (disposed) {
        return;
      }

      try {
        fn.apply(callContext, args);
      } catch (error) {
        forwardErrorToGlobal(error);
      }
    }, wait);
  } as Sampler<TArgs>;

  sampler.dispose = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    disposed = true;
  };

  return sampler;
}
