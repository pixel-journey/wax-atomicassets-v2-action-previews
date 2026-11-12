import { describe, expect, it } from "vitest";
import { previewBurn, previewTransfer } from "./assetMove";

const held = [
  { id: "1", hasTemplate: true, transferable: true, burnable: true },
  { id: "2", hasTemplate: true, transferable: false, burnable: false },
  { id: "3", hasTemplate: false, transferable: false, burnable: false },
];

describe("transfer and burn flags", () => {
  it("refuses a self transfer, a duplicate, and a non-transferable template", () => {
    expect(previewTransfer({ from: "alice", to: "bob", assetIds: ["1"], memo: "", held }).ok).toBe(true);
    expect(previewTransfer({ from: "alice", to: "alice", assetIds: ["1"], memo: "", held })).toEqual({
      ok: false,
      reason: "Can't transfer assets to yourself",
    });
    expect(previewTransfer({ from: "alice", to: "bob", assetIds: ["1", "1"], memo: "", held })).toEqual({
      ok: false,
      reason: "Can't transfer the same asset multiple times",
    });
    expect(previewTransfer({ from: "alice", to: "bob", assetIds: ["2"], memo: "", held })).toEqual({
      ok: false,
      reason: "At least one asset isn't transferable (ID: 2)",
    });
  });

  it("burns a burnable template and a templateless asset, and refuses a locked burn flag", () => {
    expect(previewBurn("alice", "1", held)).toEqual({ ok: true, action: "burnasset", ids: ["1"] });
    expect(previewBurn("alice", "3", held)).toEqual({ ok: true, action: "burnasset", ids: ["3"] });
    expect(previewBurn("alice", "2", held)).toEqual({ ok: false, reason: "The asset is not burnable" });
    expect(previewBurn("alice", "9", held)).toEqual({
      ok: false,
      reason: "No asset with this id exists for this owner",
    });
  });
});
