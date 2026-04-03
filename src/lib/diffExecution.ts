import { analyzeDiff, type DiffAnalysisInput, type DiffAnalysisResult } from "./diffAnalysis";

export const DIFF_WORKER_THRESHOLD_CHARS = 75_000;

export interface DiffExecutionRequest {
  requestId: number;
  input: DiffAnalysisInput;
}

export interface DiffExecutionResponse {
  requestId: number;
  result: DiffAnalysisResult;
  mode: "sync" | "worker";
}

interface WorkerLike {
  onerror: ((event: ErrorEvent) => void) | null;
  onmessage: ((event: MessageEvent<DiffExecutionResponse>) => void) | null;
  postMessage: (message: DiffExecutionRequest) => void;
  terminate: () => void;
}

interface PendingWorkerRequest {
  input: DiffAnalysisInput;
  requestId: number;
  resolve: (response: DiffExecutionResponse) => void;
}

export interface DiffAnalysisExecutor {
  dispose: () => void;
  execute: (input: DiffAnalysisInput) => Promise<DiffExecutionResponse>;
}

export interface DiffAnalysisExecutorOptions {
  createWorker?: () => WorkerLike | null;
  syncExecutor?: (input: DiffAnalysisInput) => DiffAnalysisResult;
  workerThresholdChars?: number;
}

export function shouldUseDiffWorker(
  input: Pick<DiffAnalysisInput, "original" | "modified">,
  threshold = DIFF_WORKER_THRESHOLD_CHARS
): boolean {
  return input.original.length + input.modified.length >= threshold;
}

function createBrowserWorker(): WorkerLike | null {
  if (typeof Worker === "undefined") {
    return null;
  }

  return new Worker(new URL("./diff.worker.ts", import.meta.url), {
    type: "module",
  });
}

export function createDiffAnalysisExecutor(
  options: DiffAnalysisExecutorOptions = {}
): DiffAnalysisExecutor {
  const syncExecutor = options.syncExecutor ?? analyzeDiff;
  const createWorker = options.createWorker ?? createBrowserWorker;
  const workerThresholdChars = options.workerThresholdChars ?? DIFF_WORKER_THRESHOLD_CHARS;

  let nextRequestId = 0;
  let worker: WorkerLike | null = null;
  const pendingRequests = new Map<number, PendingWorkerRequest>();

  function createSyncResponse(requestId: number, input: DiffAnalysisInput): DiffExecutionResponse {
    return {
      requestId,
      result: syncExecutor(input),
      mode: "sync",
    };
  }

  function resolvePendingWithSyncFallback(): void {
    const queuedRequests = Array.from(pendingRequests.values());
    pendingRequests.clear();

    for (const request of queuedRequests) {
      request.resolve(createSyncResponse(request.requestId, request.input));
    }
  }

  function disposeWorker(): void {
    worker?.terminate();
    worker = null;
  }

  function getWorker(): WorkerLike | null {
    if (worker) {
      return worker;
    }

    try {
      worker = createWorker();
    } catch {
      worker = null;
    }

    if (!worker) {
      return null;
    }

    worker.onmessage = (event) => {
      const response = event.data;
      const pendingRequest = pendingRequests.get(response.requestId);

      if (!pendingRequest) {
        return;
      }

      pendingRequests.delete(response.requestId);
      pendingRequest.resolve({ ...response, mode: "worker" });
    };

    worker.onerror = () => {
      disposeWorker();
      resolvePendingWithSyncFallback();
    };

    return worker;
  }

  return {
    dispose() {
      disposeWorker();
      resolvePendingWithSyncFallback();
    },
    execute(input) {
      const requestId = ++nextRequestId;

      if (!shouldUseDiffWorker(input, workerThresholdChars)) {
        return Promise.resolve(createSyncResponse(requestId, input));
      }

      const activeWorker = getWorker();

      if (!activeWorker) {
        return Promise.resolve(createSyncResponse(requestId, input));
      }

      return new Promise((resolve) => {
        pendingRequests.set(requestId, { input, requestId, resolve });

        try {
          activeWorker.postMessage({ requestId, input });
        } catch {
          pendingRequests.delete(requestId);
          disposeWorker();
          resolve(createSyncResponse(requestId, input));
        }
      });
    },
  };
}
