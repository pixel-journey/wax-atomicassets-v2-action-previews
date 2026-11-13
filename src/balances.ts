/**
 * announcedepo, receive_token_transfer, withdraw, and the burnasset
 * balance credit from atomicassets-contract tag v2.0.0 src/atomicassets.cpp.
 * Not compiled. Not executed. Not a broadcast.
 *
 * backasset in that file still fails. These functions do not call it.
 * A deposit credits the balances table. It does not attach tokens to an NFT.
 * Burning an asset that already has backed_tokens credits that same table.
 * withdraw is the action that can send tokens back out.
 *
 * Symbol strings are compared as the caller wrote them. The contract compares
 * eosio::symbol values. "8,WAX" and another spelling are different here.
 * Amounts are decimal integer strings. JavaScript Number is not used.
 */

import { account } from "./names";

export type Qty = { symbol: string; amount: string };

export type BalanceMove =
  | { ok: false; reason: string }
  | {
      ok: true;
      action: "announcedepo" | "deposit" | "withdraw" | "burn-credit";
      quantities: Qty[] | null;
      createdRow?: boolean;
      alreadyAnnounced?: boolean;
      transferSent?: boolean;
    };

const AMOUNT = /^(0|[1-9][0-9]*)$/;

function parseAmount(amount: string): bigint | null {
  if (!AMOUNT.test(amount)) return null;
  return BigInt(amount);
}

function copy(rows: readonly Qty[]): Qty[] {
  return rows.map((row) => ({ symbol: row.symbol, amount: row.amount }));
}

function badRows(rows: readonly Qty[]): string | null {
  const seen = new Set<string>();
  for (const row of rows) {
    if (row.symbol.length === 0) return "symbol is empty";
    if (parseAmount(row.amount) === null) return `${row.amount} is not a non-negative integer`;
    if (seen.has(row.symbol)) return "symbols in one balance row must be unique";
    seen.add(row.symbol);
  }
  return null;
}

export function previewAnnounceDeposit(input: {
  owner: string;
  symbol: string;
  supportedSymbols: readonly string[];
  quantities: readonly Qty[] | null;
}): BalanceMove {
  const who = account(input.owner, "owner");
  if (who) return { ok: false, reason: who };
  if (input.symbol.length === 0) return { ok: false, reason: "symbol is empty" };
  if (!input.supportedSymbols.includes(input.symbol)) {
    return { ok: false, reason: "The specified symbol is not supported" };
  }
  if (input.quantities === null) {
    return {
      ok: true,
      action: "announcedepo",
      createdRow: true,
      alreadyAnnounced: false,
      quantities: [{ symbol: input.symbol, amount: "0" }],
    };
  }
  const bad = badRows(input.quantities);
  if (bad) return { ok: false, reason: bad };
  if (input.quantities.some((row) => row.symbol === input.symbol)) {
    return {
      ok: true,
      action: "announcedepo",
      createdRow: false,
      alreadyAnnounced: true,
      quantities: copy(input.quantities),
    };
  }
  return {
    ok: true,
    action: "announcedepo",
    createdRow: false,
    alreadyAnnounced: false,
    quantities: [...copy(input.quantities), { symbol: input.symbol, amount: "0" }],
  };
}

export function previewReceiveDeposit(input: {
  memo: string;
  symbol: string;
  amount: string;
  tokenSupported: boolean;
  quantities: readonly Qty[] | null;
}): BalanceMove {
  if (!input.tokenSupported) return { ok: false, reason: "The transferred token is not supported" };
  if (input.memo !== "deposit") return { ok: false, reason: "invalid memo" };
  if (parseAmount(input.amount) === null) return { ok: false, reason: `${input.amount} is not a non-negative integer` };
  if (input.quantities === null) {
    return {
      ok: false,
      reason: "You need to first initialize the balance table row using the announcedepo action",
    };
  }
  const bad = badRows(input.quantities);
  if (bad) return { ok: false, reason: bad };
  const next = copy(input.quantities);
  const row = next.find((item) => item.symbol === input.symbol);
  if (!row) {
    return {
      ok: false,
      reason: "You first need to announce the asset type you're backing using the announcedepo action",
    };
  }
  row.amount = (BigInt(row.amount) + BigInt(input.amount)).toString();
  return { ok: true, action: "deposit", quantities: next };
}

export function previewWithdraw(input: {
  symbol: string;
  amount: string;
  supportedSymbols: readonly string[];
  quantities: readonly Qty[] | null;
}): BalanceMove {
  const amount = parseAmount(input.amount);
  if (amount === null) return { ok: false, reason: `${input.amount} is not a non-negative integer` };
  if (amount <= 0n) return { ok: false, reason: "token_to_withdraw must be positive" };
  if (input.quantities === null) {
    return { ok: false, reason: "The specified account does not have a balance table row" };
  }
  const bad = badRows(input.quantities);
  if (bad) return { ok: false, reason: bad };
  const next = copy(input.quantities);
  const index = next.findIndex((item) => item.symbol === input.symbol);
  if (index < 0) {
    return {
      ok: false,
      reason: "The specified account does not have a balance for the symbol specified in the quantity",
    };
  }
  const have = BigInt(next[index].amount);
  if (have < amount) {
    return { ok: false, reason: "The specified account's balance is lower than the specified quantity" };
  }
  const left = have - amount;
  if (left === 0n) next.splice(index, 1);
  else next[index] = { symbol: input.symbol, amount: left.toString() };
  return {
    ok: true,
    action: "withdraw",
    quantities: next.length === 0 ? null : next,
    transferSent: input.supportedSymbols.includes(input.symbol),
  };
}

/**
 * The block inside burnasset that runs only when backed_tokens is not empty.
 * It does not send a token transfer. It does not check burnable.
 * Call previewBurn in assetMove.ts for the flag. An empty backed list is a no-op.
 */
export function previewBurnCredit(input: {
  backed: readonly Qty[];
  quantities: readonly Qty[] | null;
}): BalanceMove {
  const backedBad = badRows(input.backed);
  if (backedBad) return { ok: false, reason: backedBad };
  if (input.backed.length === 0) {
    return {
      ok: true,
      action: "burn-credit",
      createdRow: false,
      quantities: input.quantities === null ? null : copy(input.quantities),
    };
  }
  if (input.quantities === null) {
    return {
      ok: true,
      action: "burn-credit",
      createdRow: true,
      quantities: copy(input.backed),
    };
  }
  const haveBad = badRows(input.quantities);
  if (haveBad) return { ok: false, reason: haveBad };
  const next = copy(input.quantities);
  for (const credit of input.backed) {
    const row = next.find((item) => item.symbol === credit.symbol);
    if (!row) next.push({ symbol: credit.symbol, amount: credit.amount });
    else row.amount = (BigInt(row.amount) + BigInt(credit.amount)).toString();
  }
  return { ok: true, action: "burn-credit", createdRow: false, quantities: next };
}
