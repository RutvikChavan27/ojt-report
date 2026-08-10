import { useEffect, useState } from "react";

type ApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

/**
 * Runs an async data-fetching function and tracks loading/error state.
 * Re-runs whenever `deps` change; stale responses are ignored on unmount
 * or when deps change mid-flight.
 *
 *   const { data, loading, error } = useApi(() => fetchProducts(gender), [gender]);
 */
export function useApi<T>(
  factory: () => Promise<T>,
  deps: unknown[],
): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: null });

    factory()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (active) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : "Something went wrong",
          });
        }
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
