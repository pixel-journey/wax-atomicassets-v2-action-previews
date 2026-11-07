import { describe, expect, it } from "vitest";
import { setLastPayer, setRamPayer } from "./ramPayer";

describe("ram payer", () => {
  it("moves the payer only when the asset is already owned by the new payer", () => {
    expect(setRamPayer(
      [{ assetId: "5", collection: "pixel", ramPayer: "ram.payer" }],
      "5",
      "alice",
    )).toEqual({ ok: true, assetId: "5", oldPayer: "ram.payer", newPayer: "alice" });
    expect(setRamPayer(
      [{ assetId: "5", collection: "pixel", ramPayer: "alice" }],
      "5",
      "alice",
    )).toEqual({ ok: false, reason: "new_payer is already the ram_payer of this asset" });
    expect(setRamPayer([], "5", "alice")).toEqual({
      ok: false,
      reason: "No asset with this id exists in the new_payer's account",
    });
  });

  it("uses the greatest asset id, not another row in the named collection", () => {
    const owned = [
      { assetId: "1", collection: "pixel", ramPayer: "bob" },
      { assetId: "9", collection: "other", ramPayer: "bob" },
    ];
    expect(setLastPayer(owned, "alice", "pixel")).toEqual({
      ok: false,
      reason: "newest owned asset is not in the expected collection",
    });
    expect(setLastPayer(owned, "alice", "other")).toEqual({
      ok: true,
      assetId: "9",
      oldPayer: "bob",
      newPayer: "alice",
    });
  });
});
