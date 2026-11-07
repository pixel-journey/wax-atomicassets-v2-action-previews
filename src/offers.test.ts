import { describe, expect, it } from "vitest";
import { previewCreateBuyo, previewCreateOffer } from "./offers";

describe("two offers", () => {
  it("allows several AtomicAssets ids and refuses a self-offer", () => {
    expect(previewCreateOffer({
      sender: "alice",
      recipient: "bob",
      senderAssetIds: ["1", "2"],
      recipientAssetIds: [],
      memo: "",
    })).toEqual({ ok: true, checked: "shape-only" });
    expect(previewCreateOffer({
      sender: "alice",
      recipient: "alice",
      senderAssetIds: ["1"],
      recipientAssetIds: [],
      memo: "",
    })).toEqual({ ok: false, reason: "Can't send an offer to yourself" });
    expect(previewCreateOffer({
      sender: "alice",
      recipient: "bob",
      senderAssetIds: ["1", "1"],
      recipientAssetIds: [],
      memo: "x".repeat(256),
    }).ok).toBe(false);
    expect(previewCreateOffer({
      sender: "alice",
      recipient: "bob",
      senderAssetIds: ["1"],
      recipientAssetIds: [],
      memo: "x".repeat(257),
    }).ok).toBe(false);
  });

  it("refuses a buy offer that is not exactly one asset", () => {
    expect(previewCreateBuyo(["42"])).toEqual({ ok: true, action: "createbuyo", assetId: "42" });
    expect(previewCreateBuyo(["1001", "1002"])).toEqual({
      ok: false,
      reason: "createbuyo rejects more than one asset",
    });
    expect(previewCreateBuyo([]).ok).toBe(false);
  });
});
