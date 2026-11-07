import { describe, expect, it } from "vitest";
import { WEEK, accept, propose, reject, type AuthorState } from "./authorSwap";

const open: AuthorState = { collection: "pixel", author: "alice", pending: null };

describe("author swap", () => {
  it("lets owner permission accept immediately and not one week later", () => {
    const now = 1_700_000_000;
    const proposed = propose(open, "alice", "bob", true, now);
    expect(proposed.ok && proposed.state.pending?.acceptanceDate).toBe(now);
    if (!proposed.ok) return;
    expect(accept(proposed.state, "bob", now).ok).toBe(true);
    const late = accept(proposed.state, "bob", now + WEEK);
    expect(late).toEqual({ ok: false, reason: "Author swap for this collection has expired" });
  });

  it("makes an active proposal wait one week and then last one week", () => {
    const now = 1_700_000_000;
    const proposed = propose(open, "alice", "bob", false, now);
    if (!proposed.ok) throw new Error(proposed.reason);
    expect(proposed.state.pending?.acceptanceDate).toBe(now + WEEK);
    const early = accept(proposed.state, "bob", now + WEEK - 1);
    expect(early.ok).toBe(false);
    if (early.ok) return;
    expect(early.reason).toBe("[ 1 ] seconds remaining until this author swap can be accepted");
    const onTime = accept(proposed.state, "bob", now + WEEK);
    expect(onTime.ok && onTime.state.author).toBe("bob");
    expect(onTime.ok && onTime.state.pending).toBe(null);
    expect(accept(proposed.state, "bob", now + 2 * WEEK).ok).toBe(false);
  });

  it("refuses a second proposal, a stranger, and keeps the author on reject", () => {
    const now = 1_700_000_000;
    const proposed = propose(open, "alice", "bob", true, now);
    if (!proposed.ok) throw new Error(proposed.reason);
    const again = propose(proposed.state, "alice", "carol", true, now);
    expect(again).toEqual({
      ok: false,
      reason: "Can't swap author's while an authorswap is underway for this collection",
    });
    expect(accept(proposed.state, "carol", now).ok).toBe(false);
    const rejected = reject(proposed.state, "alice");
    expect(rejected.ok && rejected.state).toEqual(open);
    expect(reject(proposed.state, "carol").ok).toBe(false);
  });
});
