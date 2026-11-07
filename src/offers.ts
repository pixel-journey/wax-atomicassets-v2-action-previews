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
