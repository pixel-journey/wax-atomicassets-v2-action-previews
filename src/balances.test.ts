import { describe, expect, it } from "vitest";
import {
  previewAnnounceDeposit,
  previewBurnCredit,
  previewReceiveDeposit,
  previewWithdraw,
} from "./balances";

describe("announce and deposit", () => {
  it("opens a zero row only for a supported symbol", () => {
    expect(
      previewAnnounceDeposit({
        owner: "alice",
        symbol: "8,WAX",
        supportedSymbols: ["8,WAX"],
        quantities: null,
      }),
    ).toEqual({
      ok: true,
      action: "announcedepo",
      createdRow: true,
      alreadyAnnounced: false,
      quantities: [{ symbol: "8,WAX", amount: "0" }],
    });
    expect(
      previewAnnounceDeposit({
        owner: "alice",
        symbol: "4,PXJ",
        supportedSymbols: ["8,WAX"],
        quantities: null,
      }),
    ).toEqual({ ok: false, reason: "The specified symbol is not supported" });
  });

  it("returns without writing when the symbol is already announced", () => {
    const quantities = [{ symbol: "8,WAX", amount: "3" }];
    expect(
      previewAnnounceDeposit({
        owner: "alice",
        symbol: "8,WAX",
        supportedSymbols: ["8,WAX"],
        quantities,
      }),
    ).toEqual({
      ok: true,
      action: "announcedepo",
      createdRow: false,
      alreadyAnnounced: true,
      quantities,
    });
  });

  it("adds a deposit only after announce, and only for memo deposit", () => {
    expect(
      previewReceiveDeposit({
        memo: "deposit",
        symbol: "8,WAX",
        amount: "5",
        tokenSupported: true,
        quantities: [{ symbol: "8,WAX", amount: "0" }],
      }),
    ).toEqual({
      ok: true,
      action: "deposit",
      quantities: [{ symbol: "8,WAX", amount: "5" }],
    });
    expect(
      previewReceiveDeposit({
        memo: "back",
        symbol: "8,WAX",
        amount: "5",
        tokenSupported: true,
        quantities: [{ symbol: "8,WAX", amount: "0" }],
      }),
    ).toEqual({ ok: false, reason: "invalid memo" });
    expect(
      previewReceiveDeposit({
        memo: "deposit",
        symbol: "8,WAX",
        amount: "5",
        tokenSupported: false,
        quantities: [{ symbol: "8,WAX", amount: "0" }],
      }),
    ).toEqual({ ok: false, reason: "The transferred token is not supported" });
    expect(
      previewReceiveDeposit({
        memo: "deposit",
        symbol: "8,WAX",
        amount: "5",
        tokenSupported: true,
        quantities: null,
      }).reason,
    ).toMatch(/announcedepo/);
    expect(
      previewReceiveDeposit({
        memo: "deposit",
        symbol: "4,PXJ",
        amount: "5",
        tokenSupported: true,
        quantities: [{ symbol: "8,WAX", amount: "0" }],
      }).reason,
    ).toMatch(/announce the asset type/);
  });
});

describe("withdraw and burn credit", () => {
  it("drops a zeroed symbol and the row, and skips the transfer when the symbol is not supported", () => {
    expect(
      previewWithdraw({
        symbol: "8,WAX",
        amount: "5",
        supportedSymbols: ["8,WAX"],
        quantities: [{ symbol: "8,WAX", amount: "5" }],
      }),
    ).toEqual({ ok: true, action: "withdraw", quantities: null, transferSent: true });
    expect(
      previewWithdraw({
        symbol: "4,PXJ",
        amount: "1",
        supportedSymbols: ["8,WAX"],
        quantities: [{ symbol: "4,PXJ", amount: "2" }],
      }),
    ).toEqual({
      ok: true,
      action: "withdraw",
      quantities: [{ symbol: "4,PXJ", amount: "1" }],
      transferSent: false,
    });
    expect(
      previewWithdraw({
        symbol: "8,WAX",
        amount: "0",
        supportedSymbols: ["8,WAX"],
        quantities: [{ symbol: "8,WAX", amount: "1" }],
      }),
    ).toEqual({ ok: false, reason: "token_to_withdraw must be positive" });
    expect(
      previewWithdraw({
        symbol: "8,WAX",
        amount: "3",
        supportedSymbols: ["8,WAX"],
        quantities: [{ symbol: "8,WAX", amount: "2" }],
      }).reason,
    ).toMatch(/lower than the specified quantity/);
    expect(
      previewWithdraw({
        symbol: "8,WAX",
        amount: "1",
        supportedSymbols: ["8,WAX"],
        quantities: null,
      }).reason,
    ).toMatch(/balance table row/);
  });

  it("credits pre-v2 backed tokens into the balance and does nothing when the list is empty", () => {
    expect(previewBurnCredit({ backed: [], quantities: null })).toEqual({
      ok: true,
      action: "burn-credit",
      createdRow: false,
      quantities: null,
    });
    expect(
      previewBurnCredit({
        backed: [{ symbol: "8,WAX", amount: "4" }],
        quantities: null,
      }),
    ).toEqual({
      ok: true,
      action: "burn-credit",
      createdRow: true,
      quantities: [{ symbol: "8,WAX", amount: "4" }],
    });
    expect(
      previewBurnCredit({
        backed: [
          { symbol: "8,WAX", amount: "4" },
          { symbol: "4,PXJ", amount: "1" },
        ],
        quantities: [{ symbol: "8,WAX", amount: "2" }],
      }),
    ).toEqual({
      ok: true,
      action: "burn-credit",
      createdRow: false,
      quantities: [
        { symbol: "8,WAX", amount: "6" },
        { symbol: "4,PXJ", amount: "1" },
      ],
    });
  });
});
