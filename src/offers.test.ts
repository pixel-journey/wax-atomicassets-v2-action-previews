import { describe, expect, it } from "vitest";
import { previewCreateBuyo, previewCreateOffer, previewCreateOfferHeld, previewAcceptOffer, previewCancelOffer, previewDeclineOffer, previewPayOfferRam } from "./offers";

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

  it("lets the sender cancel and the recipient accept or decline", () => {
    const rows = [{ id: "7", sender: "alice", recipient: "bob" }];
    expect(previewCancelOffer(rows, "7", "alice")).toEqual({ ok: true, action: "canceloffer", id: "7" });
    expect(previewAcceptOffer(rows, "7", "bob")).toEqual({ ok: true, action: "acceptoffer", id: "7" });
    expect(previewDeclineOffer(rows, "7", "bob")).toEqual({ ok: true, action: "declineoffer", id: "7" });
    expect(previewCancelOffer(rows, "7", "bob").ok).toBe(false);
    expect(previewAcceptOffer(rows, "9", "bob")).toEqual({
      ok: false,
      reason: "No offer with this id exists",
    });
  });

  it("moves the offer RAM payer without measuring bytes", () => {
    const paid = [{ id: "7", sender: "alice", recipient: "bob", ramPayer: "alice" }];
    expect(previewPayOfferRam(paid, "7", "carol")).toEqual({
      ok: true,
      action: "payofferram",
      id: "7",
      ramPayer: "carol",
      previousPayer: "alice",
    });
    expect(previewPayOfferRam(paid, "8", "carol")).toEqual({
      ok: false,
      reason: "No offer with this id exists",
    });
  });
});

describe("createoffer with holdings", () => {
  const assets = [
    { id: "1", owner: "alice", hasTemplate: true, transferable: true },
    { id: "2", owner: "alice", hasTemplate: true, transferable: false },
    { id: "3", owner: "bob", hasTemplate: false, transferable: false },
  ];

  it("accepts a held transferable asset and a templateless asset", () => {
    expect(previewCreateOfferHeld({
      sender: "alice",
      recipient: "bob",
      senderAssetIds: ["1"],
      recipientAssetIds: ["3"],
      memo: "",
      assets,
    })).toEqual({ ok: true, checked: "held" });
  });

  it("uses the contract sentences for a missing id, a soulbound asset, and a duplicate side", () => {
    expect(previewCreateOfferHeld({
      sender: "alice",
      recipient: "bob",
      senderAssetIds: ["9"],
      recipientAssetIds: [],
      memo: "",
      assets,
    })).toEqual({
      ok: false,
      reason: "Offer sender doesn't own at least one of the provided assets (ID: 9)",
    });
    expect(previewCreateOfferHeld({
      sender: "alice",
      recipient: "bob",
      senderAssetIds: ["2"],
      recipientAssetIds: [],
      memo: "",
      assets,
    })).toEqual({
      ok: false,
      reason: "At least one asset isn't transferable (ID: 2)",
    });
    expect(previewCreateOfferHeld({
      sender: "alice",
      recipient: "bob",
      senderAssetIds: ["1"],
      recipientAssetIds: ["3", "3"],
      memo: "",
      assets,
    })).toEqual({
      ok: false,
      reason: "The assets in recipient_asset_ids must be unique",
    });
  });
});

