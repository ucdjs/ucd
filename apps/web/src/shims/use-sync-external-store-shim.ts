import * as React from "react";

type Subscribe = (onStoreChange: () => void) => () => void;
type EqualityFn<T> = (a: T, b: T) => boolean;

const objectIs: (x: unknown, y: unknown) => boolean
  = typeof Object.is === "function"
    ? Object.is
    : (x, y) => {
        const xNum = x as number;
        const yNum = y as number;
        return (x === y && (x !== 0 || 1 / xNum === 1 / yNum))
          // eslint-disable-next-line no-self-compare
          || (x !== x && y !== y);
      };

function checkIfSnapshotChanged<TSnapshot>(inst: {
  value: TSnapshot;
  getSnapshot: () => TSnapshot;
}): boolean {
  const latestGetSnapshot = inst.getSnapshot;
  const prevValue = inst.value;
  try {
    const nextValue = latestGetSnapshot();
    return !objectIs(prevValue, nextValue);
  } catch {
    return true;
  }
}

function useSyncExternalStoreClient<TSnapshot>(
  subscribe: Subscribe,
  getSnapshot: () => TSnapshot,
): TSnapshot {
  const value = getSnapshot();
  const instRef = React.useRef({ value, getSnapshot });
  const [, forceUpdate] = React.useReducer((count: number) => count + 1, 0);

  React.useLayoutEffect(() => {
    const nextInst = { value, getSnapshot };
    instRef.current = nextInst;
    if (checkIfSnapshotChanged(nextInst)) {
      forceUpdate();
    }
  }, [forceUpdate, subscribe, value, getSnapshot]);

  React.useEffect(() => {
    const inst = instRef.current;
    if (checkIfSnapshotChanged(inst)) {
      forceUpdate();
    }
    return subscribe(() => {
      if (checkIfSnapshotChanged(instRef.current)) {
        forceUpdate();
      }
    });
  }, [forceUpdate, subscribe]);

  React.useDebugValue(value);
  return value;
}

function syncExternalStoreServer<TSnapshot>(
  _subscribe: Subscribe,
  getSnapshot: () => TSnapshot,
): TSnapshot {
  return getSnapshot();
}

const useSyncExternalStoreShim
  = typeof window === "undefined"
    || typeof window.document === "undefined"
    || typeof window.document.createElement === "undefined"
    ? syncExternalStoreServer
    : useSyncExternalStoreClient;

export function useSyncExternalStore<TSnapshot>(
  subscribe: Subscribe,
  getSnapshot: () => TSnapshot,
  getServerSnapshot?: () => TSnapshot,
): TSnapshot {
  if (typeof React.useSyncExternalStore === "function") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSyncExternalStoreShim(subscribe, getSnapshot);
}

export function useSyncExternalStoreWithSelector<TSnapshot, TSelection>(
  subscribe: Subscribe,
  getSnapshot: () => TSnapshot,
  getServerSnapshot: (() => TSnapshot) | undefined,
  selector: (snapshot: TSnapshot) => TSelection,
  isEqual?: EqualityFn<TSelection>,
): TSelection {
  const instRef = React.useRef<{ hasValue: boolean; value: TSelection } | null>(
    null,
  );

  if (instRef.current === null) {
    instRef.current = { hasValue: false, value: null as TSelection };
  }

  const [getSelection, getServerSelection] = React.useMemo(() => {
    const inst = instRef.current as { hasValue: boolean; value: TSelection };
    let hasMemo = false;
    let memoizedSnapshot: TSnapshot;
    let memoizedSelection: TSelection;

    const maybeGetServerSnapshot
      = getServerSnapshot === undefined ? null : getServerSnapshot;

    const memoizedSelector = (nextSnapshot: TSnapshot) => {
      if (!hasMemo) {
        // eslint-disable-next-line react-hooks/immutability
        hasMemo = true;
        memoizedSnapshot = nextSnapshot;
        const nextSelection = selector(nextSnapshot);
        if (isEqual !== undefined && inst.hasValue) {
          const currentSelection = inst.value;
          if (isEqual(currentSelection, nextSelection)) {
            memoizedSelection = currentSelection;
            return memoizedSelection;
          }
        }
        memoizedSelection = nextSelection;
        return memoizedSelection;
      }

      const currentSelection = memoizedSelection;
      if (objectIs(memoizedSnapshot, nextSnapshot)) {
        return currentSelection;
      }

      const nextSelection = selector(nextSnapshot);
      if (isEqual !== undefined && isEqual(currentSelection, nextSelection)) {
        memoizedSnapshot = nextSnapshot;
        return currentSelection;
      }

      memoizedSnapshot = nextSnapshot;
      memoizedSelection = nextSelection;
      return memoizedSelection;
    };

    return [
      () => memoizedSelector(getSnapshot()),
      maybeGetServerSnapshot === null
        ? undefined
        : () => memoizedSelector(maybeGetServerSnapshot()),
    ] as const;
  }, [getSnapshot, getServerSnapshot, selector, isEqual]);

  const selectedValue = useSyncExternalStore(
    subscribe,
    getSelection,
    getServerSelection,
  );

  React.useEffect(() => {
    const inst = instRef.current as { hasValue: boolean; value: TSelection };
    inst.hasValue = true;
    inst.value = selectedValue;
  }, [selectedValue]);

  React.useDebugValue(selectedValue);
  return selectedValue;
}
