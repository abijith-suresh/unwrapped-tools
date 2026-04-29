// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { analyzeDiff } from "./diffAnalysis";
import {
  createDiffAnalysisExecutor,
  type DiffExecutionRequest,
  type DiffExecutionResponse,
} from "./diffExecution";

interface MockWorker {
  onerror: ((event: ErrorEvent) => void) | null;
  onmessage: ((event: MessageEvent<DiffExecutionResponse>) => void) | null;
  postMessage: (message: DiffExecutionRequest) => void;
  postMessageSpy: ReturnType<typeof vi.fn>;
  terminate: () => void;
  terminateSpy: ReturnType<typeof vi.fn>;
}

function createMockWorker(
  postMessage: (message: DiffExecutionRequest, worker: MockWorker) => void
): MockWorker {
  const postMessageSpy = vi.fn((message: DiffExecutionRequest) => postMessage(message, worker));
  const terminateSpy = vi.fn();
  const worker: MockWorker = {
    onerror: null,
    onmessage: null,
    postMessage(message: DiffExecutionRequest) {
      postMessageSpy(message);
    },
    postMessageSpy,
    terminate() {
      terminateSpy();
    },
    terminateSpy,
  };

  return worker;
}

describe("diffExecution browser runtime", () => {
  it("uses the worker transport when the input crosses the threshold", async () => {
    const worker = createMockWorker((message, currentWorker) => {
      currentWorker.onmessage?.({
        data: {
          requestId: message.requestId,
          result: analyzeDiff(message.input),
          mode: "worker",
        },
      } as MessageEvent<DiffExecutionResponse>);
    });
    const executor = createDiffAnalysisExecutor({
      createWorker: () => worker,
      workerThresholdChars: 0,
    });

    const response = await executor.execute({
      original: "alpha\nbeta\n",
      modified: "alpha\ngamma\n",
      leftLanguage: "text",
      rightLanguage: "text",
      changesOnly: true,
    });

    expect(worker.postMessageSpy).toHaveBeenCalledTimes(1);
    expect(response.mode).toBe("worker");
    expect(response.result.stats).toEqual({ added: 1, removed: 1 });
  });

  it("uses the worker transport for structured compare inputs below the size threshold", async () => {
    const worker = createMockWorker((message, currentWorker) => {
      currentWorker.onmessage?.({
        data: {
          requestId: message.requestId,
          result: analyzeDiff(message.input),
          mode: "worker",
        },
      } as MessageEvent<DiffExecutionResponse>);
    });
    const executor = createDiffAnalysisExecutor({
      createWorker: () => worker,
      workerThresholdChars: 1_000_000,
    });

    const response = await executor.execute({
      original: '{"a":1,"b":2}',
      modified: '{"b":2,"a":1}',
      leftLanguage: "json",
      rightLanguage: "json",
      changesOnly: true,
    });

    expect(worker.postMessageSpy).toHaveBeenCalledTimes(1);
    expect(response.mode).toBe("worker");
    expect(response.result.strategy).toBe("json");
    expect(response.result.isIdentical).toBe(true);
  });

  it("falls back to sync execution when worker creation fails", async () => {
    const executor = createDiffAnalysisExecutor({
      createWorker: () => {
        throw new Error("worker unavailable");
      },
      workerThresholdChars: 0,
    });

    const response = await executor.execute({
      original: "alpha\n",
      modified: "beta\n",
      leftLanguage: "text",
      rightLanguage: "text",
      changesOnly: true,
    });

    expect(response.mode).toBe("sync");
  });

  it("routes out-of-order worker responses back to the matching request", async () => {
    const queue: Array<() => void> = [];
    const worker = createMockWorker((message, currentWorker) => {
      queue.push(() => {
        currentWorker.onmessage?.({
          data: {
            requestId: message.requestId,
            result: analyzeDiff(message.input),
            mode: "worker",
          },
        } as MessageEvent<DiffExecutionResponse>);
      });
    });
    const executor = createDiffAnalysisExecutor({
      createWorker: () => worker,
      workerThresholdChars: 0,
    });

    const firstPromise = executor.execute({
      original: "first\n",
      modified: "first changed\n",
      leftLanguage: "text",
      rightLanguage: "text",
      changesOnly: true,
    });
    const secondPromise = executor.execute({
      original: "second\n",
      modified: "second changed\n",
      leftLanguage: "text",
      rightLanguage: "text",
      changesOnly: true,
    });

    queue[1]?.();
    queue[0]?.();

    const [first, second] = await Promise.all([firstPromise, secondPromise]);

    expect(first.requestId).toBe(1);
    expect(second.requestId).toBe(2);
    expect(first.result.rows[0]?.left).toBe("first");
    expect(second.result.rows[0]?.left).toBe("second");
  });

  it("terminates the worker on dispose", async () => {
    const worker = createMockWorker((message, currentWorker) => {
      currentWorker.onmessage?.({
        data: {
          requestId: message.requestId,
          result: analyzeDiff(message.input),
          mode: "worker",
        },
      } as MessageEvent<DiffExecutionResponse>);
    });
    const executor = createDiffAnalysisExecutor({
      createWorker: () => worker,
      workerThresholdChars: 0,
    });

    await executor.execute({
      original: "alpha\n",
      modified: "beta\n",
      leftLanguage: "text",
      rightLanguage: "text",
      changesOnly: true,
    });
    executor.dispose();

    expect(worker.terminateSpy).toHaveBeenCalledTimes(1);
  });
});
