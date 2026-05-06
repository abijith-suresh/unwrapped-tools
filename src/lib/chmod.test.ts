import { describe, expect, it } from "vitest";

import { buildChmodResult } from "./chmod";

describe("buildChmodResult", () => {
  it("derives representative permission combinations", () => {
    expect(
      buildChmodResult({
        owner: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        other: { read: true, write: false, execute: false },
      })
    ).toEqual({
      octal: "644",
      symbolic: "rw-r--r--",
      command: "chmod 644 <path>",
    });

    expect(
      buildChmodResult({
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        other: { read: true, write: false, execute: true },
      })
    ).toEqual({
      octal: "755",
      symbolic: "rwxr-xr-x",
      command: "chmod 755 <path>",
    });
  });

  it("handles locked-down and fully-open permission sets", () => {
    expect(
      buildChmodResult({
        owner: { read: true, write: true, execute: false },
        group: { read: false, write: false, execute: false },
        other: { read: false, write: false, execute: false },
      })
    ).toMatchObject({ octal: "600", symbolic: "rw-------" });

    expect(
      buildChmodResult({
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: true, execute: true },
        other: { read: true, write: true, execute: true },
      })
    ).toMatchObject({ octal: "777", symbolic: "rwxrwxrwx" });
  });
});
