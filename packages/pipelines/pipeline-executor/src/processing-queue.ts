export interface ProcessingQueue {
  add: (task: () => Promise<void>) => Promise<void>;
  drain: () => Promise<void>;
}

export function createProcessingQueue(concurrency: number): ProcessingQueue {
  const queue: (() => Promise<void>)[] = [];
  let running = 0;
  let resolveIdle: (() => void) | null = null;

  const runNext = async (): Promise<void> => {
    if (running >= concurrency || queue.length === 0) {
      if (running === 0 && queue.length === 0 && resolveIdle) {
        resolveIdle();
      }
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
        resolveIdle = resolve;
      });
    },
  };
}
