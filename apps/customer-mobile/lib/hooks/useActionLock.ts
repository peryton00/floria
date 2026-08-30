import { useState, useRef, useCallback } from "react";

/**
 * useActionLock
 *
 * Hook to strictly prevent double-tap submissions and concurrent in-flight async operations.
 * Uses an immediate synchronous ref guard alongside React state to guarantee 0 race conditions.
 */
export function useActionLock() {
  const [isLocked, setIsLocked] = useState(false);
  const lockRef = useRef(false);

  const runExclusive = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | undefined> => {
      if (lockRef.current) {
        return undefined;
      }

      lockRef.current = true;
      setIsLocked(true);

      try {
        const result = await action();
        return result;
      } finally {
        lockRef.current = false;
        setIsLocked(false);
      }
    },
    [],
  );

  return {
    isLocked,
    runExclusive,
  };
}
