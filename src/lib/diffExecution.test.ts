import { describe, expect, it } from "vitest";

import { createDiffAnalysisExecutor } from "./diffExecution";

describe("diffExecution", () => {
  it("executes synchronously when worker transport is unavailable", async () => {
    const executor = createDiffAnalysisExecutor({
      createWorker: () => null,
      workerThresholdChars: 0,
    });

    await expect(
      executor.execute({
        original: "alpha\nbeta\n",
        modified: "alpha\ngamma\n",
        leftLanguage: "text",
        rightLanguage: "text",
        changesOnly: true,
      })
    ).resolves.toMatchObject({
      mode: "sync",
      requestId: 1,
      result: {
        stats: { added: 1, removed: 1 },
      },
    });
  });

  it("increments and preserves request ids across sequential calls", async () => {
    const executor = createDiffAnalysisExecutor({
      createWorker: () => null,
    });

    const first = await executor.execute({
      original: "a\n",
      modified: "b\n",
      leftLanguage: "text",
      rightLanguage: "text",
      changesOnly: true,
    });
    const second = await executor.execute({
      original: "c\n",
      modified: "d\n",
      leftLanguage: "text",
      rightLanguage: "text",
      changesOnly: true,
    });

    expect(first.requestId).toBe(1);
    expect(second.requestId).toBe(2);
  });
});
