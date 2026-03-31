export interface ProcessingQueue {
  add: (task: () => Promise<void>) => Promise<void>;
  drain: () => Promise<void>;
}

export function createProcessingQueue(concurrency: number): ProcessingQueue {
  const queue: (() => Promise<void>)[] = [];
  let running = 0;
  let drainWaiters: Array<() => void> = [];

  function notifyDrainIfIdle(): void {
    if (running === 0 && queue.length === 0 && drainWaiters.length > 0) {
      const waiters = drainWaiters;
      drainWaiters = [];
      for (const notify of waiters) notify();
    }
  }

  const runNext = async (): Promise<void> => {
    if (running >= concurrency || queue.length === 0) {
      notifyDrainIfIdle();
      return;
    }

    running++;
    const task = queue.shift()!;

    try {
      await task();
    } finally {
      running--;
      void runNext();
    }
  };

  return {
    add: async (task) => {
      queue.push(task);
      void runNext();
    },
    drain: () => {
      if (running === 0 && queue.length === 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        drainWaiters.push(resolve);
      });
    },
  };
}
