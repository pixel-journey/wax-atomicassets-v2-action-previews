/**
 * Two different offers.
 *
 * previewCreateOffer copies the shape checks at the start of
 * atomicassets::createoffer in tag v2.0.0 (src/atomicassets.cpp).
 * It does not check is_account, ownership, or the transferable flag.
 * Several asset ids on one side are allowed. A self-offer is not.
 * Memo length is JavaScript string length. That matches the contract
 * only for ASCII.
 *
 * previewCreateBuyo is the AtomicMarket v2.0.0 release note:
 * createbuyo rejects more than one asset. The market C++ was not opened.
 * This is not createoffer.
 */

import { account, uint64 } from "./names";

export type OfferShape =
  | { ok: false; reason: string }
  | { ok: true; checked: "shape-only" };

export function previewCreateOffer(input: {
  sender: string;
  recipient: string;
  senderAssetIds: readonly string[];
  recipientAssetIds: readonly string[];
  memo: string;
}): OfferShape {
  const bad = account(input.sender, "sender") || account(input.recipient, "recipient");
  if (bad) return { ok: false, reason: bad };
  if (input.sender === input.recipient) return { ok: false, reason: "Can't send an offer to yourself" };
  if (input.senderAssetIds.length === 0 && input.recipientAssetIds.length === 0) {
    return { ok: false, reason: "Can't create an empty offer" };
  }
  if (input.memo.length > 256) return { ok: false, reason: "An offer memo can only be 256 characters max" };
  for (const side of [input.senderAssetIds, input.recipientAssetIds]) {
    const seen = new Set<bigint>();
    for (const id of side) {
      const n = uint64(id);
      if (n === null) return { ok: false, reason: `${id} is not a positive uint64` };
      if (seen.has(n)) return { ok: false, reason: "asset ids on one side must be unique" };
      seen.add(n);
    }
  }
  return { ok: true, checked: "shape-only" };
}

export type Buyo =
  | { ok: false; reason: string }
  | { ok: true; action: "createbuyo"; assetId: string };

export function previewCreateBuyo(assetIds: readonly string[]): Buyo {
  if (assetIds.length !== 1) return { ok: false, reason: "createbuyo rejects more than one asset" };
  if (uint64(assetIds[0]) === null) return { ok: false, reason: `${assetIds[0]} is not a positive uint64` };
  return { ok: true, action: "createbuyo", assetId: assetIds[0] };
}

/**
 * canceloffer / acceptoffer / declineoffer from the same cpp file.
 * Auth only. Ownership is re-checked on accept in the contract; this
 * preview does not hold asset tables, so it does not re-check them.
 * The contract string for a missing offer is "No offer with this id exists".
 */
export type OfferRow = { id: string; sender: string; recipient: string };

export type OfferStep =
  | { ok: false; reason: string }
  | { ok: true; action: "canceloffer" | "acceptoffer" | "declineoffer"; id: string };

function findOffer(offers: readonly OfferRow[], id: string): OfferRow | null {
  if (uint64(id) === null) return null;
  return offers.find((row) => row.id === id) ?? null;
}

export function previewCancelOffer(offers: readonly OfferRow[], id: string, actor: string): OfferStep {
  const bad = account(actor, "actor");
  if (bad) return { ok: false, reason: bad };
  const row = findOffer(offers, id);
  if (!row) return { ok: false, reason: "No offer with this id exists" };
  if (actor !== row.sender) return { ok: false, reason: "require_auth would fail" };
  return { ok: true, action: "canceloffer", id };
}

export function previewAcceptOffer(offers: readonly OfferRow[], id: string, actor: string): OfferStep {
  const bad = account(actor, "actor");
  if (bad) return { ok: false, reason: bad };
  const row = findOffer(offers, id);
  if (!row) return { ok: false, reason: "No offer with this id exists" };
  if (actor !== row.recipient) return { ok: false, reason: "require_auth would fail" };
  return { ok: true, action: "acceptoffer", id };
}

export function previewDeclineOffer(offers: readonly OfferRow[], id: string, actor: string): OfferStep {
  const bad = account(actor, "actor");
  if (bad) return { ok: false, reason: bad };
  const row = findOffer(offers, id);
  if (!row) return { ok: false, reason: "No offer with this id exists" };
  if (actor !== row.recipient) return { ok: false, reason: "require_auth would fail" };
  return { ok: true, action: "declineoffer", id };
}

/**
 * payofferram rewrites the offer row under a new payer.
 * The contract always erase-then-emplace, even when the payer is unchanged.
 * Byte refund amounts are not measured.
 */
export type PaidOffer = OfferRow & { ramPayer: string };

export type PayRam =
  | { ok: false; reason: string }
  | { ok: true; action: "payofferram"; id: string; ramPayer: string; previousPayer: string };

export function previewPayOfferRam(offers: readonly PaidOffer[], id: string, payer: string): PayRam {
  const bad = account(payer, "payer");
  if (bad) return { ok: false, reason: bad };
  const row = offers.find((item) => item.id === id);
  if (!row || uint64(id) === null) return { ok: false, reason: "No offer with this id exists" };
  return { ok: true, action: "payofferram", id, ramPayer: payer, previousPayer: row.ramPayer };
}


