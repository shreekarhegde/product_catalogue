import { useEffect, useState } from "react";

type Result<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; message: string };

export function useRequest<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [response, setResponse] = useState<{
    load: typeof load;
    attempt: number;
    result: Result<T>;
  }>();

  useEffect(() => {
    const controller = new AbortController();
    const update = (result: Result<T>) => {
      if (!controller.signal.aborted) setResponse({ load, attempt, result });
    };
    load(controller.signal).then(
      (data) => update({ status: "ready", data }),
      (error: Error) => update({ status: "error", message: error.message }),
    );
    return () => controller.abort();
  }, [load, attempt]);

  // A result belongs to the URL and attempt that requested it.
  const result: Result<T> = response?.load === load && response.attempt === attempt
    ? response.result
    : { status: "loading" };

  return { result, retry: () => setAttempt((value) => value + 1) };
}
